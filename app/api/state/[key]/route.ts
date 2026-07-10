import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { projectors, isProjectedKey } from "@/lib/projectors";
import { requireCompanyId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

// GET /api/state/:key — a single value for the logged-in company (or null).
export async function GET(_req: Request, { params }: Ctx) {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { key } = await params;
  if (isProjectedKey(key)) {
    return Response.json(await projectors[key].read(companyId));
  }
  const row = await prisma.appState.findUnique({ where: { companyId_key: { companyId, key } } });
  return Response.json(row ? row.value : null);
}

// PUT /api/state/:key — upsert a value for the logged-in company. Projected
// keys are decomposed into their relational tables; everything else is stored
// in AppState.
export async function PUT(req: Request, { params }: Ctx) {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { key } = await params;
  const text = await req.text();

  let value: unknown;
  try {
    value = text === "" ? null : JSON.parse(text);
  } catch {
    value = text; // fall back to storing the raw string
  }

  if (isProjectedKey(key)) {
    await projectors[key].write(companyId, value);
    return Response.json({ ok: true });
  }

  // A JSON `null` value must be wrapped as Prisma.JsonNull — AppState.value is
  // a non-nullable Json field, so passing a bare `null` throws.
  const dbValue = value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  await prisma.appState.upsert({
    where: { companyId_key: { companyId, key } },
    update: { value: dbValue },
    create: { companyId, key, value: dbValue },
  });

  return Response.json({ ok: true });
}

// DELETE /api/state/:key — remove a value for the logged-in company.
export async function DELETE(_req: Request, { params }: Ctx) {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { key } = await params;
  if (isProjectedKey(key)) {
    await projectors[key].clear(companyId);
    return Response.json({ ok: true });
  }
  await prisma.appState.deleteMany({ where: { companyId, key } });
  return Response.json({ ok: true });
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { projectors, isProjectedKey } from "@/lib/projectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

// GET /api/state/:key — return a single value (or null if absent).
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  if (isProjectedKey(key)) {
    return Response.json(await projectors[key].read());
  }
  const row = await prisma.appState.findUnique({ where: { key } });
  return Response.json(row ? row.value : null);
}

// PUT /api/state/:key — upsert a value. The request body is the raw value
// (JSON text as written to localStorage). Projected keys are decomposed into
// their relational tables; everything else is stored in AppState.
export async function PUT(req: Request, { params }: Ctx) {
  const { key } = await params;
  const text = await req.text();

  let value: unknown;
  try {
    value = text === "" ? null : JSON.parse(text);
  } catch {
    value = text; // fall back to storing the raw string
  }

  if (isProjectedKey(key)) {
    await projectors[key].write(value);
    return Response.json({ ok: true });
  }

  // A JSON `null` value must be wrapped as Prisma.JsonNull — the AppState.value
  // column is a non-nullable Json field, so passing a bare `null` throws.
  const dbValue = value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  await prisma.appState.upsert({
    where: { key },
    update: { value: dbValue },
    create: { key, value: dbValue },
  });

  return Response.json({ ok: true });
}

// DELETE /api/state/:key — remove a value.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { key } = await params;
  if (isProjectedKey(key)) {
    // Clear the projected store's table(s). (write([]) is a no-op for the
    // upsert-only projectors, so clear() must be explicit.)
    await projectors[key].clear();
    return Response.json({ ok: true });
  }
  await prisma.appState.deleteMany({ where: { key } });
  return Response.json({ ok: true });
}

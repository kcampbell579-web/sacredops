import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

// GET /api/state/:key — return a single value (or null if absent).
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  const row = await prisma.appState.findUnique({ where: { key } });
  return Response.json(row ? row.value : null);
}

// PUT /api/state/:key — upsert a value. The request body is the raw value
// (JSON text as written to localStorage); we parse it into JSON for storage.
export async function PUT(req: Request, { params }: Ctx) {
  const { key } = await params;
  const text = await req.text();

  let value: unknown;
  try {
    value = text === "" ? null : JSON.parse(text);
  } catch {
    value = text; // fall back to storing the raw string
  }

  await prisma.appState.upsert({
    where: { key },
    // Prisma requires JSON null to be wrapped; use a plain object cast.
    update: { value: value as never },
    create: { key, value: value as never },
  });

  return Response.json({ ok: true });
}

// DELETE /api/state/:key — remove a value.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { key } = await params;
  await prisma.appState.deleteMany({ where: { key } });
  return Response.json({ ok: true });
}

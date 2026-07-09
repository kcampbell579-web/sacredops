import { prisma } from "@/lib/prisma";
import { projectors, isProjectedKey } from "@/lib/projectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/state — return all persisted portal state as { key: value }.
// Projected keys (e.g. sacredops_submissions) are reconstructed from their
// relational tables; everything else comes from the AppState document store.
export async function GET() {
  const out: Record<string, unknown> = {};

  const rows = await prisma.appState.findMany();
  for (const row of rows) {
    if (!isProjectedKey(row.key)) out[row.key] = row.value;
  }

  for (const [key, projector] of Object.entries(projectors)) {
    out[key] = await projector.read();
  }

  return Response.json(out);
}

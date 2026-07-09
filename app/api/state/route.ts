import { prisma } from "@/lib/prisma";
import { projectors, isProjectedKey } from "@/lib/projectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/state — return all persisted portal state as { key: value }.
// Projected keys (e.g. sacredops_submissions) are reconstructed from their
// relational tables; everything else comes from the AppState document store.
export async function GET() {
  const out: Record<string, unknown> = {};

  // Read the AppState rows and all projected keys concurrently — they hit
  // disjoint tables, and this is on the hot hydrate path.
  const projectorEntries = Object.entries(projectors);
  const [rows, projected] = await Promise.all([
    prisma.appState.findMany(),
    Promise.all(projectorEntries.map(([, projector]) => projector.read())),
  ]);

  for (const row of rows) {
    if (!isProjectedKey(row.key)) out[row.key] = row.value;
  }
  projectorEntries.forEach(([key], i) => {
    out[key] = projected[i];
  });

  return Response.json(out);
}

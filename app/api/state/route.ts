import { prisma } from "@/lib/prisma";
import { projectors, isProjectedKey } from "@/lib/projectors";
import { requireCompanyId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/state — all persisted portal state for the logged-in company as
// { key: value }. Projected keys are reconstructed from their relational
// tables; everything else comes from the AppState document store. Requires a
// session; data is always scoped to the caller's companyId.
export async function GET() {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const out: Record<string, unknown> = {};
  const projectorEntries = Object.entries(projectors);
  const [rows, projected] = await Promise.all([
    prisma.appState.findMany({ where: { companyId } }),
    Promise.all(projectorEntries.map(([, projector]) => projector.read(companyId))),
  ]);

  for (const row of rows) {
    if (!isProjectedKey(row.key)) out[row.key] = row.value;
  }
  projectorEntries.forEach(([key], i) => {
    out[key] = projected[i];
  });

  return Response.json(out);
}

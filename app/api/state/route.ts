import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/state — return all persisted portal state as { key: value }.
export async function GET() {
  const rows = await prisma.appState.findMany();
  const out: Record<string, unknown> = {};
  for (const row of rows) out[row.key] = row.value;
  return Response.json(out);
}

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side free-usage cap for the public marketing tools (e.g. the Toolbox
// Talk generator). Keyed by email so the limit follows the person, not their
// browser — clearing cookies / incognito won't reset it. A bypass with a new
// email just captures another lead. Stored in AppState (no migration needed).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const BUCKET = "_public_tools";
const LIMIT = 3;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// POST /api/tools/usage { tool, email } → { count, limit, allowed }
// Records one use and reports whether it's within the free limit.
export async function POST(req: Request) {
  const { tool, email } = await req.json().catch(() => ({}));
  const e = String(email || "").trim().toLowerCase();
  const t = String(tool || "tool").replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "tool";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return Response.json({ error: "Valid email required." }, { status: 400, headers: CORS });
  }
  const key = `usage:${t}:${e}`;
  try {
    const existing = await prisma.appState.findUnique({
      where: { companyId_key: { companyId: BUCKET, key } },
    });
    const prev =
      existing && existing.value && typeof existing.value === "object" && "count" in existing.value
        ? Number((existing.value as { count?: number }).count) || 0
        : 0;
    const count = prev + 1;
    await prisma.appState.upsert({
      where: { companyId_key: { companyId: BUCKET, key } },
      update: { value: { count } },
      create: { companyId: BUCKET, key, value: { count } },
    });
    return Response.json({ count, limit: LIMIT, allowed: count <= LIMIT }, { headers: CORS });
  } catch {
    // Never block the tool on a storage hiccup — fail open.
    return Response.json({ count: 0, limit: LIMIT, allowed: true }, { headers: CORS });
  }
}

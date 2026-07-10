import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/logout — clear the session.
export async function POST() {
  await destroySession();
  return Response.json({ ok: true });
}

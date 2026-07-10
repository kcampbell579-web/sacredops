import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — the logged-in user (or null).
export async function GET() {
  const user = await getSessionUser();
  return Response.json({ user });
}

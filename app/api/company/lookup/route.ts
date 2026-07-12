import { prisma } from "@/lib/prisma";
import { normalizeSubdomain } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/company/lookup?subdomain=acme — PUBLIC. The login page uses this on a
// company subdomain to show the company name and scope the worker login (no
// company code needed). Returns only the display name + slug, nothing sensitive.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sub = normalizeSubdomain(url.searchParams.get("subdomain") || "");
  if (!sub) return Response.json({ error: "Unknown company." }, { status: 404 });

  const company = await prisma.company.findUnique({ where: { subdomain: sub } });
  if (!company) return Response.json({ error: "Unknown company." }, { status: 404 });

  return Response.json({ company: { name: company.name, subdomain: company.subdomain } });
}

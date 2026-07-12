import { prisma } from "@/lib/prisma";
import { requireAdmin, normalizeSubdomain } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/company — set the company's login subdomain. { subdomain }
// Admin-only. Validates the slug, blocks reserved words, and enforces the
// global uniqueness of subdomains.
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const { subdomain } = await req.json().catch(() => ({}));
  const slug = normalizeSubdomain(String(subdomain || ""));
  if (!slug) {
    return Response.json(
      { error: "Use 2–32 letters, numbers or hyphens (that word is reserved)." },
      { status: 400 }
    );
  }

  const clash = await prisma.company.findUnique({ where: { subdomain: slug } });
  if (clash && clash.id !== admin.companyId) {
    return Response.json({ error: "That address is already taken." }, { status: 409 });
  }

  try {
    await prisma.company.update({ where: { id: admin.companyId }, data: { subdomain: slug } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "That address is already taken." }, { status: 409 });
    }
    throw e;
  }
  return Response.json({ ok: true, subdomain: slug });
}

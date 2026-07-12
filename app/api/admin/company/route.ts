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

  const body = await req.json().catch(() => ({}));

  // Set a custom join code (e.g. a memorable demo code like SACR-OPS1-DEMO).
  if (typeof body.joinCode === "string" && body.joinCode.trim()) {
    const code = body.joinCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (code.length < 4 || code.length > 24) {
      return Response.json({ error: "Code must be 4–24 letters, numbers or hyphens." }, { status: 400 });
    }
    const clash = await prisma.company.findUnique({ where: { joinCode: code } });
    if (clash && clash.id !== admin.companyId) {
      return Response.json({ error: "That code is already taken." }, { status: 409 });
    }
    try {
      await prisma.company.update({ where: { id: admin.companyId }, data: { joinCode: code } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return Response.json({ error: "That code is already taken." }, { status: 409 });
      }
      throw e;
    }
    return Response.json({ ok: true, joinCode: code });
  }

  // Otherwise set the login subdomain.
  const slug = normalizeSubdomain(String(body.subdomain || ""));
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

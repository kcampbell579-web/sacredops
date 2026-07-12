import { prisma } from "@/lib/prisma";
import { requireAdmin, hashSecret } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["ADMIN", "SUPERVISOR", "WORKER"] as const;
type RoleT = (typeof ROLES)[number];

// GET /api/admin/users — list everyone in the admin's company + the join code.
// Admin-only; scoped to the caller's company so no cross-tenant access.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const [company, users] = await Promise.all([
    prisma.company.findUnique({ where: { id: admin.companyId } }),
    prisma.user.findMany({
      where: { companyId: admin.companyId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return Response.json({
    company: {
      name: company?.name || "",
      joinCode: company?.joinCode || "",
      subdomain: company?.subdomain || "",
      plan: company?.plan || "starter",
      hasSubscription: !!company?.stripeCustomerId,
      billingConfigured: !!process.env.STRIPE_SECRET_KEY,
    },
    me: { id: admin.id },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email,
      loginType: u.passwordHash ? "email" : "pin",
      createdAt: u.createdAt,
    })),
  });
}

// PATCH /api/admin/users — change a member's role. { userId, role }
// Guards: the target must be in the admin's company; a company must always
// keep at least one ADMIN (you can't demote the last admin).
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const { userId, role } = await req.json().catch(() => ({}));
  if (!userId || !ROLES.includes(role as RoleT)) {
    return Response.json({ error: "A valid userId and role are required." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!target || target.companyId !== admin.companyId) {
    return Response.json({ error: "That member was not found." }, { status: 404 });
  }

  // Don't allow demoting the last remaining admin.
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { companyId: admin.companyId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return Response.json(
        { error: "You can't remove the last admin — promote someone else first." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: role as RoleT },
  });
  return Response.json({ ok: true, user: { id: updated.id, role: updated.role } });
}

// POST /api/admin/users — member actions. { userId, action, pin? }
//   action "reset-pin"  → set a new 4-digit PIN for a worker/supervisor
//   action "remove"     → delete the member (can't remove yourself or last admin)
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const { userId, action, pin } = await req.json().catch(() => ({}));
  const target = userId ? await prisma.user.findUnique({ where: { id: String(userId) } }) : null;
  if (!target || target.companyId !== admin.companyId) {
    return Response.json({ error: "That member was not found." }, { status: 404 });
  }

  if (action === "reset-pin") {
    if (!/^\d{4}$/.test(String(pin || ""))) {
      return Response.json({ error: "PIN must be 4 digits." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: target.id },
      data: { pinHash: await hashSecret(String(pin)) },
    });
    return Response.json({ ok: true });
  }

  if (action === "remove") {
    if (target.id === admin.id) {
      return Response.json({ error: "You can't remove yourself." }, { status: 409 });
    }
    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { companyId: admin.companyId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return Response.json({ error: "You can't remove the last admin." }, { status: 409 });
      }
    }
    await prisma.user.delete({ where: { id: target.id } });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}

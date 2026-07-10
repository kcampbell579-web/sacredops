import { prisma } from "@/lib/prisma";
import { requireAdmin, generateToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITABLE = ["ADMIN", "SUPERVISOR"] as const;
type InviteRole = (typeof INVITABLE)[number];

// GET /api/admin/invites — pending (unaccepted) invites for the company.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const invites = await prisma.invite.findMany({
    where: { companyId: admin.companyId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      name: i.name,
      role: i.role,
      token: i.token,
      createdAt: i.createdAt,
    })),
  });
}

// POST /api/admin/invites — create an invite. { email, name, role }
// Returns the token so the client can build a shareable accept link.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const { email, name, role } = await req.json().catch(() => ({}));
  const normEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  if (!normEmail || !cleanName) {
    return Response.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!INVITABLE.includes(role as InviteRole)) {
    return Response.json({ error: "Invite role must be Supervisor or Admin." }, { status: 400 });
  }

  // Email is globally unique on User — can't invite someone who already has a login.
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "Someone already has an account with that email." }, { status: 409 });
  }

  // One pending invite per email/company: reuse the row, refresh its token.
  const prior = await prisma.invite.findFirst({
    where: { companyId: admin.companyId, email: normEmail, acceptedAt: null },
  });
  const token = generateToken();
  const invite = prior
    ? await prisma.invite.update({
        where: { id: prior.id },
        data: { name: cleanName, role: role as InviteRole, token, invitedBy: admin.name },
      })
    : await prisma.invite.create({
        data: {
          companyId: admin.companyId,
          email: normEmail,
          name: cleanName,
          role: role as InviteRole,
          token,
          invitedBy: admin.name,
        },
      });

  return Response.json({
    ok: true,
    invite: { id: invite.id, email: invite.email, name: invite.name, role: invite.role, token: invite.token },
  });
}

// DELETE /api/admin/invites — revoke a pending invite. { inviteId }
export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const { inviteId } = await req.json().catch(() => ({}));
  const invite = inviteId
    ? await prisma.invite.findUnique({ where: { id: String(inviteId) } })
    : null;
  if (!invite || invite.companyId !== admin.companyId) {
    return Response.json({ error: "Invite not found." }, { status: 404 });
  }
  await prisma.invite.delete({ where: { id: invite.id } });
  return Response.json({ ok: true });
}

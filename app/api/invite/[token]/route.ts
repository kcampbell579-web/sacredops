import { prisma } from "@/lib/prisma";
import { hashSecret, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/invite/[token] — public: describe a pending invite so the accept
// page can greet the invitee. Returns 404/410 if invalid or already used.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { company: true },
  });
  if (!invite) return Response.json({ error: "This invite link is invalid." }, { status: 404 });
  if (invite.acceptedAt) {
    return Response.json({ error: "This invite has already been used." }, { status: 410 });
  }
  return Response.json({
    invite: {
      email: invite.email,
      name: invite.name,
      role: invite.role,
      companyName: invite.company.name,
      invitedBy: invite.invitedBy,
    },
  });
}

// POST /api/invite/[token] — public: accept the invite by setting a password.
// Creates the email+password user with the assigned role, marks the invite
// used, and logs them in. { name?, password }
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { name, password } = await req.json().catch(() => ({}));

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return Response.json({ error: "This invite link is invalid." }, { status: 404 });
  if (invite.acceptedAt) {
    return Response.json({ error: "This invite has already been used." }, { status: 410 });
  }
  if (String(password || "").length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Guard the race where the email got claimed between invite and accept.
  const clash = await prisma.user.findUnique({ where: { email: invite.email } });
  if (clash) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const finalName = String(name || "").trim() || invite.name;

  // Names are unique within a company; disambiguate on the rare collision.
  let userName = finalName;
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.user.findUnique({
      where: { companyId_name: { companyId: invite.companyId, name: userName } },
    });
    if (!taken) break;
    userName = `${finalName} (${i})`;
  }

  const user = await prisma.user.create({
    data: {
      companyId: invite.companyId,
      role: invite.role,
      name: userName,
      email: invite.email,
      passwordHash: await hashSecret(String(password)),
    },
  });
  await prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

  await createSession(user.id);
  return Response.json({ ok: true, user: { name: user.name, role: user.role } });
}

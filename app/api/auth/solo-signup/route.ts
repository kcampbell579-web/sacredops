import { prisma } from "@/lib/prisma";
import { hashSecret, generateJoinCode, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/solo-signup — an individual worker creates a personal portal
// with NO company code. We spin up a private, single-person workspace for them
// (so all the per-company scoping keeps working) and sign them in as a worker.
// They can request to join a real company later from their profile.
// { name, email, password }
export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  const cleanName = String(name || "").trim();
  const normEmail = String(email || "").trim().toLowerCase();
  if (!cleanName || !normEmail || !password) {
    return Response.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "That email is already registered — try logging in." }, { status: 409 });
  }

  // Unique join code for the personal workspace (retry on the rare collision).
  let joinCode = generateJoinCode(cleanName);
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.company.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode(cleanName);
  }

  const company = await prisma.company.create({
    data: { name: `${cleanName} — Personal`, joinCode },
  });
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      role: "WORKER",
      name: cleanName,
      email: normEmail,
      passwordHash: await hashSecret(String(password)),
    },
  });

  await createSession(user.id);
  return Response.json({ ok: true, user: { name: user.name, role: user.role } });
}

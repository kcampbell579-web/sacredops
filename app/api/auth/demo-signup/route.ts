import { prisma } from "@/lib/prisma";
import { hashSecret, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/demo-signup — sign up for the demo like a real company:
// company code + name + email + password. Joins the demo company as a
// supervisor (so they can explore), and records a lead so the owner sees who
// tried it. { joinCode, name, email, password }
export async function POST(req: Request) {
  const { joinCode, name, email, password } = await req.json().catch(() => ({}));
  const code = String(joinCode || "").trim().toUpperCase();
  const cleanName = String(name || "").trim();
  const normEmail = String(email || "").trim().toLowerCase();
  if (!code || !cleanName || !normEmail || !password) {
    return Response.json({ error: "Company code, name, email, and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { joinCode: code } });
  if (!company) {
    return Response.json({ error: "That code wasn't found. Check the demo code and try again." }, { status: 404 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "That email is already registered — log in with your password instead." }, { status: 409 });
  }

  // Names are unique within a company; disambiguate on collision.
  let userName = cleanName;
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.user.findUnique({
      where: { companyId_name: { companyId: company.id, name: userName } },
    });
    if (!taken) break;
    userName = `${cleanName} (${i})`;
  }

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      role: "SUPERVISOR",
      name: userName,
      email: normEmail,
      passwordHash: await hashSecret(String(password)),
    },
  });

  // Capture the demo signup as a lead for the platform owner.
  try {
    await prisma.lead.create({
      data: { companyName: `Demo · ${company.name}`, name: cleanName, email: normEmail },
    });
  } catch {
    /* never block the demo on lead capture */
  }

  await createSession(user.id);
  return Response.json({ ok: true, user: { name: user.name, role: user.role } });
}

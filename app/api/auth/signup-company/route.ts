import { prisma } from "@/lib/prisma";
import { hashSecret, generateJoinCode, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/signup-company — create a new company + its first admin.
// { companyName, name, email, password }
export async function POST(req: Request) {
  const { companyName, name, email, password } = await req.json().catch(() => ({}));
  if (!companyName || !name || !email || !password) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "That email is already registered." }, { status: 409 });
  }

  // Generate a unique join code (retry on the rare collision).
  let joinCode = generateJoinCode(companyName);
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.company.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode(companyName);
  }

  const company = await prisma.company.create({ data: { name: String(companyName).trim(), joinCode } });
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      role: "ADMIN",
      name: String(name).trim(),
      email: normEmail,
      passwordHash: await hashSecret(String(password)),
    },
  });

  await createSession(user.id);
  return Response.json({
    ok: true,
    user: { name: user.name, role: user.role, companyName: company.name },
    joinCode: company.joinCode,
  });
}

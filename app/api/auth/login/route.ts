import { prisma } from "@/lib/prisma";
import { verifySecret, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/login — supervisor/admin sign-in with email + password.
// { email, password }
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    include: { company: true },
  });

  // Same generic error whether the email is unknown or the password is wrong.
  if (!user || !(await verifySecret(String(password), user.passwordHash))) {
    return Response.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return Response.json({
    ok: true,
    user: { name: user.name, role: user.role, companyName: user.company.name },
  });
}

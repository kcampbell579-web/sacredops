import { prisma } from "@/lib/prisma";
import { hashSecret, verifySecret, createSession, normalizeSubdomain } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/join — worker joins/signs in with name + PIN, and either a
// company code OR a company subdomain (used on acme.sacredops.app so the crew
// never has to type the code). First time creates the worker (sets the PIN);
// afterwards the PIN must match. { joinCode | subdomain, name, pin }
export async function POST(req: Request) {
  const { joinCode, subdomain, name, pin } = await req.json().catch(() => ({}));
  if ((!joinCode && !subdomain) || !name || !pin) {
    return Response.json({ error: "Company, name, and PIN are required." }, { status: 400 });
  }
  if (!/^\d{4}$/.test(String(pin))) {
    return Response.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const sub = subdomain ? normalizeSubdomain(String(subdomain)) : null;
  const company = sub
    ? await prisma.company.findUnique({ where: { subdomain: sub } })
    : await prisma.company.findUnique({ where: { joinCode: String(joinCode).trim().toUpperCase() } });
  if (!company) {
    return Response.json({ error: "That company was not found." }, { status: 404 });
  }

  const cleanName = String(name).trim();
  let user = await prisma.user.findUnique({
    where: { companyId_name: { companyId: company.id, name: cleanName } },
  });

  if (user) {
    // Returning worker: PIN must match (or set it if this account had none).
    if (user.pinHash) {
      if (!(await verifySecret(String(pin), user.pinHash))) {
        return Response.json({ error: "Incorrect PIN for that name." }, { status: 401 });
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { pinHash: await hashSecret(String(pin)) },
      });
    }
  } else {
    // New worker for this company.
    user = await prisma.user.create({
      data: {
        companyId: company.id,
        role: "WORKER",
        name: cleanName,
        pinHash: await hashSecret(String(pin)),
      },
    });
  }

  await createSession(user.id);
  return Response.json({
    ok: true,
    user: { name: user.name, role: user.role, companyName: company.name },
  });
}

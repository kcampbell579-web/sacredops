import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Password / PIN hashing (scrypt, no external dependency)
// ---------------------------------------------------------------------------

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derived) => (err ? reject(err) : resolve(derived)));
  });
}

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(secret, salt);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifySecret(secret: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await scryptAsync(secret, salt);
  const keyBuf = Buffer.from(key, "hex");
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}

// ---------------------------------------------------------------------------
// Company join codes
// ---------------------------------------------------------------------------

// Human-typable, unambiguous alphabet (no 0/O/1/I) in groups, e.g. ACME-7F3K-9QLP.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(companyName: string): string {
  const prefix = (companyName.replace(/[^a-z0-9]/gi, "").slice(0, 4) || "SOPS").toUpperCase();
  const group = () =>
    Array.from(randomBytes(4))
      .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join("");
  return `${prefix}-${group()}-${group()}`;
}

// ---------------------------------------------------------------------------
// Sessions (opaque token in an httpOnly cookie)
// ---------------------------------------------------------------------------

const COOKIE = "sacredops_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = {
  id: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "WORKER";
  companyId: string;
  companyName: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: { include: { company: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    companyId: u.companyId,
    companyName: u.company.name,
  };
}

// Convenience for API routes: returns the companyId or null.
export async function requireCompanyId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.companyId ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
    jar.delete(COOKIE);
  }
}

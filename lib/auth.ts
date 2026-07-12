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

// A long, URL-safe random token for invite links.
export function generateToken(): string {
  return randomBytes(24).toString("hex");
}

// ---------------------------------------------------------------------------
// Company subdomains (acme → acme.sacredops.app)
// ---------------------------------------------------------------------------

// Subdomains we never hand out to a company (they route to other things).
export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "demo", "worker", "workers", "staging", "dev",
  "sacredops", "mail", "support", "help", "status", "blog", "login", "signup",
]);

// Turn a company name into a clean subdomain slug (lowercase a–z0–9 and hyphens).
export function slugifySubdomain(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
}

// Validate an admin-chosen subdomain: 2–32 chars, a–z0–9 and hyphens, and not
// reserved. Returns the normalized value or null if invalid.
export function normalizeSubdomain(raw: string): string | null {
  const s = slugifySubdomain(raw);
  if (s.length < 2 || s.length > 32) return null;
  if (RESERVED_SUBDOMAINS.has(s)) return null;
  return s;
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

// Convenience for admin-only API routes: returns the session user only when
// they are an ADMIN, otherwise null (caller responds 401/403).
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}

// Platform-owner gate. Set OWNER_EMAILS in the environment (comma-separated).
// Fails closed: if unset, nobody is an owner. Returns the session user or null.
export async function requireOwner(): Promise<SessionUser | null> {
  const owners = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!owners.length) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const row = await prisma.user.findUnique({ where: { id: user.id } });
  const email = row?.email?.toLowerCase();
  return email && owners.includes(email) ? user : null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
    jar.delete(COOKIE);
  }
}

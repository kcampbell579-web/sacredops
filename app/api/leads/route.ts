import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the platform owner(s) may view leads. Set OWNER_EMAILS in the Vercel
// project (comma-separated, e.g. "kcampbell579@gmail.com"). Fails closed: if
// the env var is missing/empty, nobody is treated as an owner.
async function ownerGate() {
  const owners = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!owners.length) return null;
  const user = await getSessionUser();
  if (!user) return null;
  // Look up the user's email (session doesn't carry it).
  const row = await prisma.user.findUnique({ where: { id: user.id } });
  const email = row?.email?.toLowerCase();
  return email && owners.includes(email) ? user : null;
}

// GET /api/leads — every "new company" signup, newest first. ?format=csv for CSV.
export async function GET(req: Request) {
  const owner = await ownerGate();
  if (!owner) return Response.json({ error: "Not authorized." }, { status: 403 });

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Date", "Company", "Name", "Email", "Phone"];
    const rows = leads.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.companyName,
      l.name,
      l.email,
      l.phone || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sacredops-leads.csv"`,
      },
    });
  }

  return Response.json({
    leads: leads.map((l) => ({
      id: l.id,
      companyName: l.companyName,
      name: l.name,
      email: l.email,
      phone: l.phone,
      createdAt: l.createdAt,
    })),
  });
}

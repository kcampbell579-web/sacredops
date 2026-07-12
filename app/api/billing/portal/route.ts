import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/billing/portal — open the Stripe billing portal so an admin can
// update their card, change plan, or cancel. Admin-only. → { url }
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const company = await prisma.company.findUnique({ where: { id: admin.companyId } });
  if (!company?.stripeCustomerId) {
    return Response.json({ error: "No subscription yet — upgrade first." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${origin}/admin`,
  });
  return Response.json({ url: session.url });
}

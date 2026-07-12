import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getStripe, priceForPlan } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/billing/checkout — start a Stripe Checkout for a plan upgrade.
// Admin-only. { plan: "pro" | "enterprise" }  → returns { url } to redirect to.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const { plan } = await req.json().catch(() => ({}));
  const price = priceForPlan(String(plan || ""));
  if (!price) return Response.json({ error: "Pick a valid plan." }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: admin.companyId } });
  const adminUser = await prisma.user.findUnique({ where: { id: admin.id } });
  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(company?.stripeCustomerId
      ? { customer: company.stripeCustomerId }
      : { customer_email: adminUser?.email || undefined }),
    line_items: [{ price, quantity: 1 }],
    metadata: { companyId: admin.companyId, plan: String(plan) },
    // 14-day free trial, no card required up front (matches the pricing page).
    subscription_data: { metadata: { companyId: admin.companyId }, trial_period_days: 14 },
    payment_method_collection: "if_required",
    success_url: `${origin}/admin?billing=success`,
    cancel_url: `${origin}/admin?billing=cancel`,
    allow_promotion_codes: true,
  });

  return Response.json({ url: session.url });
}

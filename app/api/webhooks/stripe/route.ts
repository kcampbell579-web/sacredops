import { prisma } from "@/lib/prisma";
import { getStripe, planForPrice } from "@/lib/stripe";
import { CANCELLED_PLAN } from "@/lib/features";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe — Stripe tells us when a subscription starts,
// changes, or cancels; we set the company's plan to match automatically.
// Configure this URL + STRIPE_WEBHOOK_SECRET in the Stripe dashboard.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("billing not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  const setPlan = async (companyId: string, plan: string, extra: Record<string, unknown> = {}) => {
    await prisma.company.update({ where: { id: companyId }, data: { plan, ...extra } }).catch(() => {});
  };
  const companyByCustomer = async (customerId: string | null) => {
    if (!customerId) return null;
    return prisma.company.findFirst({ where: { stripeCustomerId: customerId } });
  };

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const companyId = s.metadata?.companyId;
      const plan = s.metadata?.plan || "pro";
      if (companyId) {
        await setPlan(companyId, plan, {
          stripeCustomerId: (s.customer as string) || null,
          stripeSubId: (s.subscription as string) || null,
        });
      }
      // Send the "subscription confirmed — how to set up your account" email to
      // the buyer (works for marketing Payment Links too). No-op if email isn't
      // configured (RESEND_API_KEY unset).
      const buyerEmail =
        s.customer_details?.email ||
        (typeof s.customer_email === "string" ? s.customer_email : null);
      if (buyerEmail) {
        await sendEmail({
          to: buyerEmail,
          subject: "Welcome to SacredOps — set up your account",
          html: welcomeEmailHtml(),
        });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const sub = event.data.object as Stripe.Subscription;
      const company = (sub.metadata?.companyId
        ? await prisma.company.findUnique({ where: { id: sub.metadata.companyId } })
        : null) || (await companyByCustomer(sub.customer as string));
      if (company) {
        const priceId = sub.items?.data?.[0]?.price?.id;
        // active / trialing → the paid plan (also reactivates a cancelled
        // account that re-subscribes). past_due → keep access while Stripe
        // retries the card. canceled / unpaid / incomplete_expired → lock.
        const good = sub.status === "active" || sub.status === "trialing";
        if (good) {
          await setPlan(company.id, planForPrice(priceId) || "pro", { stripeSubId: sub.id });
        } else if (sub.status !== "past_due") {
          await setPlan(company.id, CANCELLED_PLAN, { stripeSubId: sub.id });
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const company = (sub.metadata?.companyId
        ? await prisma.company.findUnique({ where: { id: sub.metadata.companyId } })
        : null) || (await companyByCustomer(sub.customer as string));
      // Subscription ended → lock the account. Never downgrade to a free tier:
      // every plan is paid, and "no plan" would mean full access.
      if (company) await setPlan(company.id, CANCELLED_PLAN, { stripeSubId: null });
    }
  } catch {
    // Never fail the webhook on our own processing error — Stripe would retry.
    return new Response("handled with error", { status: 200 });
  }

  return new Response("ok", { status: 200 });
}

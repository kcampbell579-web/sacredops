import { getStripe, priceForPlan } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/checkout?plan=starter|pro|business
//
// Launches a branded Stripe Checkout Session from our own domain instead of
// sending buyers to a raw buy.stripe.com Payment Link. We set the success_url
// programmatically to /complete?session_id={CHECKOUT_SESSION_ID}, which the
// post-payment setup page verifies against Stripe — no per-link dashboard
// redirect config to keep in sync.
//
// SAFETY NET: if Stripe isn't configured (no secret key, or the plan's price
// env var is missing) or session creation throws, we fall back to the existing
// Payment Link for that plan, so a Buy button never dead-ends.
const FALLBACK: Record<string, string> = {
  starter: "https://buy.stripe.com/4gM9AMdwE40q6LU0OY2VG03",
  pro: "https://buy.stripe.com/9B63cobowcwW9Y6cxG2VG02",
  business: "https://buy.stripe.com/eVqdR20JSfJ85HQ55e2VG01",
};

function originOf(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) return `${proto}://${host}`;
  try { return new URL(req.url).origin; } catch { return "https://www.sacredops.app"; }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = (url.searchParams.get("plan") || "").toLowerCase();
  const fallback = FALLBACK[plan] || "https://www.sacredops.app/pricing";

  const stripe = getStripe();
  const price = priceForPlan(plan);
  // If billing isn't wired for this plan, use the Payment Link (current behavior).
  if (!stripe || !price || !FALLBACK[plan]) {
    return Response.redirect(fallback, 302);
  }

  const origin = originOf(req);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: plan,
      metadata: { plan, source: "site-checkout" },
      subscription_data: { metadata: { plan, source: "site-checkout" } },
    });
    if (session.url) return Response.redirect(session.url, 303);
    return Response.redirect(fallback, 302);
  } catch {
    // Never dead-end a buyer — fall back to the working Payment Link.
    return Response.redirect(fallback, 302);
  }
}

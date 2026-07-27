import { getStripe, planForPrice } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/checkout/session?session_id=cs_... — read-only lookup used by the
// /complete page to confirm a checkout was paid and prefill the buyer's email
// and plan. Returns only non-sensitive fields. Never trusts the client for the
// payment decision itself — signup-company re-verifies the session server-side.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return Response.json({ paid: false }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return Response.json({ paid: false }, { status: 200 });

  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items.data.price"],
    });
    const paid =
      (s.payment_status === "paid" || s.payment_status === "no_payment_required") &&
      s.status === "complete";
    const sub = s.subscription && typeof s.subscription !== "string" ? s.subscription : null;
    const priceId = sub?.items?.data?.[0]?.price?.id || s.line_items?.data?.[0]?.price?.id || null;
    return Response.json({
      paid,
      email: s.customer_details?.email || null,
      plan: planForPrice(priceId) || null,
    });
  } catch {
    return Response.json({ paid: false }, { status: 200 });
  }
}

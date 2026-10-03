import { prisma } from "@/lib/prisma";
import { getStripe, planForPrice } from "@/lib/stripe";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Records paid checkout sessions and tracks whether we've already emailed the
// buyer, in AppState (no migration needed). This is the webhook-independent
// backstop: /complete hits this endpoint right after Stripe redirects back, so
// even with the Stripe webhook deleted, every real buyer still gets the
// "set up your account" email exactly once.
const BUCKET = "_paid_sessions";

// GET /api/checkout/session?session_id=cs_... — read-only lookup used by the
// /complete page to confirm a checkout was paid and prefill the buyer's email
// and plan. Returns only non-sensitive fields. Never trusts the client for the
// payment decision itself — signup-company re-verifies the session server-side.
// Side effect: on a confirmed payment, sends the welcome/setup email once.
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
    const email = s.customer_details?.email || null;
    const plan = planForPrice(priceId) || null;

    // Backstop welcome email — fires once per paid session, no webhook needed.
    if (paid && email) await welcomeOnce(sessionId, email, plan);

    return Response.json({ paid, email, plan });
  } catch {
    return Response.json({ paid: false }, { status: 200 });
  }
}

// Send the "set up your account" email exactly once for a given paid session.
// Uses an AppState row as the idempotency guard so page reloads don't re-send.
// A no-op when RESEND_API_KEY isn't configured (sendEmail returns false), but
// the paid-session record is still written so you can see who paid.
async function welcomeOnce(sessionId: string, email: string, plan: string | null) {
  const key = `session:${sessionId}`;
  try {
    const existing = await prisma.appState.findUnique({
      where: { companyId_key: { companyId: BUCKET, key } },
    });
    const already =
      existing && existing.value && typeof existing.value === "object" &&
      (existing.value as { welcomed?: boolean }).welcomed === true;
    if (already) return; // email already sent for this session

    // Record the paid session first so it's captured even if the email fails.
    const base = {
      email: email.toLowerCase(),
      plan: plan || "pro",
      paidAt: (existing?.value as { paidAt?: string } | undefined)?.paidAt || new Date().toISOString(),
      welcomed: false,
    };
    await prisma.appState.upsert({
      where: { companyId_key: { companyId: BUCKET, key } },
      update: { value: base },
      create: { companyId: BUCKET, key, value: base },
    });

    const sent = await sendEmail({
      to: email,
      subject: "Welcome to SacredOps — set up your account",
      html: welcomeEmailHtml(),
    });

    if (sent) {
      await prisma.appState.update({
        where: { companyId_key: { companyId: BUCKET, key } },
        data: { value: { ...base, welcomed: true, welcomedAt: new Date().toISOString() } },
      });
    }
  } catch {
    // Never let the backstop break the /complete prefill.
  }
}

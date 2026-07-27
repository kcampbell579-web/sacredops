import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — confirms which Stripe mode/account the server key is in
// and whether it can see a given email's subscription. Never returns the key or
// raw Stripe error text. Gated by a token so it isn't publicly crawlable.
// Remove after billing is confirmed working.
const TOKEN = "sacred-diag-2f9k";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const key = process.env.STRIPE_SECRET_KEY || "";
  const mode = !key
    ? "NONE (no key set)"
    : /_live_/.test(key) || key.startsWith("sk_live") || key.startsWith("rk_live")
    ? "LIVE"
    : /_test_/.test(key) || key.startsWith("sk_test") || key.startsWith("rk_test")
    ? "TEST"
    : "UNKNOWN";

  const out: Record<string, unknown> = { hasKey: !!key, keyMode: mode };

  const stripe = getStripe();
  if (stripe) {
    try {
      const c = await stripe.customers.list({ limit: 1 });
      out.canReachStripe = true;
      out.accountHasCustomers = c.data.length > 0;
    } catch {
      out.canReachStripe = false;
    }

    const email = url.searchParams.get("email");
    if (email) {
      try {
        const custs = await stripe.customers.list({ email, limit: 5 });
        let activeSubs = 0;
        for (const cu of custs.data) {
          const s = await stripe.subscriptions.list({ customer: cu.id, status: "all", limit: 5 });
          activeSubs += s.data.filter((x) => x.status === "active" || x.status === "trialing").length;
        }
        out.emailLookup = { email, customersFound: custs.data.length, activeSubscriptions: activeSubs };
      } catch {
        out.emailLookup = { email, error: "stripe_error" };
      }
    }
  }

  return Response.json(out);
}

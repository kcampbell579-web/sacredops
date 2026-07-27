import { prisma } from "@/lib/prisma";
import { hashSecret, generateJoinCode, createSession, slugifySubdomain, RESERVED_SUBDOMAINS } from "@/lib/auth";
import { getStripe, planForPrice } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Require a paid Stripe subscription before a company account can be created.
// ON by default — to create a company you must have paid. Set
// REQUIRE_PAID_SIGNUP=false only if you need to temporarily open free signups.
// (The demo — /api/auth/demo-signup — is unaffected: it just joins the shared
// demo sandbox and captures a lead, it never creates a company.)
const REQUIRE_PAID = !/^(0|false|no|off)$/i.test(process.env.REQUIRE_PAID_SIGNUP || "");

type Paid = { customerId: string | null; subId: string | null; plan: string };

// AUTHORITATIVE payment check: given the Stripe Checkout Session id that Stripe
// appends to the /complete redirect (?session_id={CHECKOUT_SESSION_ID}), read
// the session straight from Stripe and confirm it was paid. This can't be fooled
// by a mistyped email or a subscription that hasn't finished provisioning — the
// session itself is the receipt. Works for subscription AND one-time links.
async function findPaidBySession(sessionId: string): Promise<Paid | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items.data.price"],
    });
    // Only honor a genuinely completed, paid checkout.
    const paidStatus = s.payment_status === "paid" || s.payment_status === "no_payment_required";
    if (!paidStatus || s.status !== "complete") return null;
    const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
    const sub = s.subscription && typeof s.subscription !== "string" ? s.subscription : null;
    const subId = sub?.id ?? (typeof s.subscription === "string" ? s.subscription : null);
    const priceId =
      sub?.items?.data?.[0]?.price?.id || s.line_items?.data?.[0]?.price?.id || null;
    return { customerId, subId, plan: planForPrice(priceId) || "pro" };
  } catch {
    return null;
  }
}

// Fallback payment check: ask Stripe whether this email has an active
// subscription. Less reliable than the session lookup (depends on the buyer
// typing the exact email they paid with) but covers signups that arrive without
// a session id.
async function findPaidSubscription(email: string): Promise<Paid | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const customers = await stripe.customers.list({ email, limit: 10 });
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 10 });
      const active = subs.data.find((s) => s.status === "active" || s.status === "trialing");
      if (active) {
        const priceId = active.items?.data?.[0]?.price?.id;
        return { customerId: c.id, subId: active.id, plan: planForPrice(priceId) || "pro" };
      }
    }
  } catch {
    /* treat Stripe errors as "not found" — caller decides how to fail */
  }
  return null;
}

// POST /api/auth/signup-company — create a new company + its first admin.
// { companyName, name, email, phone, password }
export async function POST(req: Request) {
  const { companyName, name, email, phone, password, sessionId } = await req.json().catch(() => ({}));
  if (!companyName || !name || !email || !password) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "That email is already registered." }, { status: 409 });
  }

  // Payment gate: require proof of a paid Stripe checkout before we create the
  // account. Prefer the authoritative Checkout Session id from the /complete
  // redirect; fall back to matching by email. When the gate is off, we still
  // attach whatever we find so early subscribers get their plan.
  let paid: Paid | null = null;
  if (REQUIRE_PAID || sessionId) {
    if (sessionId) paid = await findPaidBySession(String(sessionId));
    if (!paid) paid = await findPaidSubscription(normEmail);
  }
  if (REQUIRE_PAID) {
    if (!getStripe()) {
      return Response.json({ error: "Billing isn't set up yet — please contact support@sacredops.app." }, { status: 503 });
    }
    if (!paid) {
      return Response.json(
        {
          error:
            "We couldn't find a paid subscription for this email. Choose a plan and check out first, then create your account with the same email you paid with.",
          needsPayment: true,
          pricingUrl: "https://www.sacredops.app/pricing",
        },
        { status: 402 }
      );
    }
    // One subscription = one company: block reusing a subscription already tied
    // to an existing account. (Skip when we have no customer id to key on.)
    const claimed = paid.customerId
      ? await prisma.company.findFirst({ where: { stripeCustomerId: paid.customerId } })
      : null;
    if (claimed) {
      return Response.json(
        { error: "This subscription is already linked to an account. Log in instead, or use a different email." },
        { status: 409 }
      );
    }
  }

  // Generate a unique join code (retry on the rare collision).
  let joinCode = generateJoinCode(companyName);
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.company.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode(companyName);
  }

  // Auto-assign a login subdomain (acme → acme.sacredops.app). Fall back with a
  // numeric suffix on collision; leave null if we can't derive a usable slug.
  let subdomain: string | null = slugifySubdomain(companyName);
  if (!subdomain || subdomain.length < 2 || RESERVED_SUBDOMAINS.has(subdomain)) {
    subdomain = null;
  } else {
    const base = subdomain;
    for (let i = 0; i < 6; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const clash = await prisma.company.findUnique({ where: { subdomain: candidate } });
      if (!clash) { subdomain = candidate; break; }
      subdomain = null; // exhausted → leave unset, admin can pick one
    }
  }

  const company = await prisma.company.create({
    data: {
      name: String(companyName).trim(),
      joinCode,
      subdomain,
      // When they arrived through a paid subscription, stamp the plan + Stripe
      // linkage so their access matches what they bought right away.
      ...(paid ? { plan: paid.plan, stripeCustomerId: paid.customerId, stripeSubId: paid.subId } : {}),
    },
  });
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      role: "ADMIN",
      name: String(name).trim(),
      email: normEmail,
      passwordHash: await hashSecret(String(password)),
    },
  });

  // Capture the signup as a sales lead (best-effort — never block signup on it).
  try {
    await prisma.lead.create({
      data: {
        companyName: String(companyName).trim(),
        name: String(name).trim(),
        email: normEmail,
        phone: phone ? String(phone).trim() : null,
        companyId: company.id,
      },
    });
  } catch {
    /* ignore lead-capture failures */
  }

  await createSession(user.id);
  return Response.json({
    ok: true,
    user: { name: user.name, role: user.role, companyName: company.name },
    joinCode: company.joinCode,
    subdomain: company.subdomain,
    plan: company.plan,
  });
}

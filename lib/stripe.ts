import Stripe from "stripe";

// Lazily construct the Stripe client. Returns null when STRIPE_SECRET_KEY is
// unset so the app runs fine before billing is configured (routes 503 instead
// of crashing).
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

// Plan ↔ Stripe price mapping, driven by env so you can swap prices without a
// deploy. Starter is free and has no price.
export function priceForPlan(plan: string): string | null {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO || null;
  if (plan === "business") return process.env.STRIPE_PRICE_BUSINESS || null;
  if (plan === "enterprise") return process.env.STRIPE_PRICE_ENTERPRISE || null;
  return null;
}

export function planForPrice(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
  return null;
}

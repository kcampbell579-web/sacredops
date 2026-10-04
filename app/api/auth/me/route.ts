import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveFeatures, CANCELLED_PLAN } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — the logged-in user (or null), plus their company's plan
// and effective feature flags so the portals can hide modules that are off.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ user: null });

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  // The demo company always shows the full product so prospects see everything.
  const isDemo = company?.joinCode === "SACR-OPS1-DEMO";
  // A subscription that ended or went unpaid is stamped "cancelled" by the
  // Stripe webhook: the account is locked (active:false → PortalGate shows a
  // reactivate screen) and every feature flag is off.
  const cancelled = !isDemo && company?.plan === CANCELLED_PLAN;
  // Otherwise, once they subscribe (stripeSubId set) the chosen plan's limits
  // apply; legacy companies with no subscription keep full access. Per-company
  // overrides in company.features still win.
  const subscribed = !!company?.stripeSubId;
  const features = isDemo
    ? effectiveFeatures("enterprise", null)
    : cancelled
      ? effectiveFeatures(CANCELLED_PLAN, null)
      : effectiveFeatures(subscribed ? company?.plan : null, company?.features);
  return Response.json({
    user: { ...user, plan: company?.plan || "starter", active: !cancelled, features },
  });
}

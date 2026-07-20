import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveFeatures } from "@/lib/features";

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
  // Otherwise: full access until there's an ACTIVE paid subscription (free
  // trial / not-yet-billed). Once they subscribe (stripeSubId set), the chosen
  // plan's limits apply. Per-company overrides in company.features still win.
  const subscribed = !!company?.stripeSubId;
  const features = isDemo
    ? effectiveFeatures("enterprise", null)
    : effectiveFeatures(subscribed ? company?.plan : null, company?.features);
  return Response.json({
    user: { ...user, plan: company?.plan || "starter", features },
  });
}

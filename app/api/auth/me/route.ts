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
  const features = effectiveFeatures(company?.plan, company?.features);
  return Response.json({
    user: { ...user, plan: company?.plan || "starter", features },
  });
}

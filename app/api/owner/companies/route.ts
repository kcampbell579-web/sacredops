import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { effectiveFeatures, PLANS, FEATURE_LIST } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/owner/companies — every company with its plan + effective features and
// headcount. Owner-only (OWNER_EMAILS). This is the QC / upsell control panel.
export async function GET() {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: "Owner only." }, { status: 403 });

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return Response.json({
    plans: Object.entries(PLANS).map(([key, v]) => ({ key, label: v.label })),
    featureList: FEATURE_LIST,
    companies: companies.map((c) => ({
      id: c.id,
      name: c.name,
      subdomain: c.subdomain,
      joinCode: c.joinCode,
      plan: c.plan,
      overrides: (c.features as Record<string, boolean>) || {},
      features: effectiveFeatures(c.plan, c.features),
      users: c._count.users,
      createdAt: c.createdAt,
    })),
  });
}

// PATCH /api/owner/companies — set a company's plan and/or feature overrides.
// { companyId, plan?, overrides? }  overrides is a { featureKey: boolean } map.
export async function PATCH(req: Request) {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: "Owner only." }, { status: 403 });

  const { companyId, plan, overrides } = await req.json().catch(() => ({}));
  if (!companyId) return Response.json({ error: "companyId is required." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (plan && PLANS[plan as keyof typeof PLANS]) data.plan = plan;
  if (overrides && typeof overrides === "object") {
    const clean: Record<string, boolean> = {};
    const valid = new Set(FEATURE_LIST.map((f) => f.key as string));
    for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
      if (valid.has(k) && typeof v === "boolean") clean[k] = v;
    }
    data.features = clean;
  }
  if (!Object.keys(data).length) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const c = await prisma.company.update({ where: { id: String(companyId) }, data });
  return Response.json({
    ok: true,
    company: { id: c.id, plan: c.plan, features: effectiveFeatures(c.plan, c.features) },
  });
}

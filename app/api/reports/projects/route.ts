import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/projects
// Aggregation over the decomposed Project table — totals, crew headcount,
// average completion, and breakdowns by role and status.
//
// Optional filter: ?project=<name>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("project") || undefined;
  const where = name ? { name } : {};

  const [total, agg, byRole, byStatus, recent] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.aggregate({ where, _sum: { crew: true }, _avg: { pct: true } }),
    prisma.project.groupBy({
      by: ["role"],
      where,
      _count: { _all: true },
      _sum: { crew: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        role: true,
        crew: true,
        pct: true,
        openInsp: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return Response.json({
    total,
    totalCrew: agg._sum.crew ?? 0,
    avgCompletion: agg._avg.pct ?? 0,
    byRole: byRole.map((r) => ({
      role: r.role,
      count: r._count._all,
      crew: r._sum.crew ?? 0,
    })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    recent,
  });
}

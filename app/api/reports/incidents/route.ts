import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/incidents
// Aggregation over the decomposed Incident + IncidentCondition tables, including
// a JOIN for incidents that had failed environmental conditions.
//
// Optional filter: ?project=<name>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || undefined;
  const where = { project };

  const [total, byType, bySource, byProject, failedConditions, recent] =
    await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.groupBy({ by: ["type"], where, _count: { _all: true } }),
      prisma.incident.groupBy({ by: ["source"], where, _count: { _all: true } }),
      prisma.incident.groupBy({
        by: ["project"],
        where,
        _count: { _all: true },
        orderBy: { _count: { project: "desc" } },
      }),
      // Distinct incidents that had at least one failed condition.
      prisma.incidentCondition.findMany({
        where: {
          result: "fail",
          ...(project ? { incident: { project } } : {}),
        },
        select: { incidentId: true },
        distinct: ["incidentId"],
      }),
      prisma.incident.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          source: true,
          kind: true,
          project: true,
          type: true,
          completedBy: true,
          dateTime: true,
          medicalAttention: true,
          createdAt: true,
          _count: { select: { conditions: true } },
        },
      }),
    ]);

  return Response.json({
    total,
    byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
    bySource: bySource.map((r) => ({ source: r.source, count: r._count._all })),
    byProject: byProject.map((r) => ({ project: r.project, count: r._count._all })),
    withFailedConditions: failedConditions.length,
    recent: recent.map((r) => ({
      id: r.id,
      source: r.source,
      kind: r.kind,
      project: r.project,
      type: r.type,
      completedBy: r.completedBy,
      dateTime: r.dateTime,
      medicalAttention: r.medicalAttention,
      conditionCount: r._count.conditions,
      createdAt: r.createdAt,
    })),
  });
}

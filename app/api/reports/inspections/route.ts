import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireCompanyId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/inspections
// Aggregation over the decomposed Inspection + ChecklistItem tables, including
// a cross-table query for flagged checklist items by project — only possible
// now that checklist items are relational rows rather than a JSON array.
//
// Optional filter: ?project=<name>
export async function GET(req: Request) {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || undefined;
  const where = { companyId, project };

  const [total, byStatus, byType, itemsByResult, flaggedByProject, recent] =
    await Promise.all([
      prisma.inspection.count({ where }),
      prisma.inspection.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.inspection.groupBy({
        by: ["type"],
        where,
        _count: { _all: true },
        orderBy: { _count: { type: "desc" } },
      }),
      prisma.checklistItem.groupBy({
        by: ["result"],
        where: { companyId, ...(project ? { inspection: { project } } : {}) },
        _count: { _all: true },
      }),
      // Flagged items per project — a JOIN across the two decomposed tables,
      // scoped to this company on both sides of the join.
      prisma.$queryRaw<{ project: string; count: number }[]>`
        SELECT i."project" AS project, COUNT(*)::int AS count
        FROM "ChecklistItem" c
        JOIN "Inspection" i ON c."inspectionId" = i."id" AND c."companyId" = i."companyId"
        WHERE c."result" = 'flag' AND c."companyId" = ${companyId}
        ${project ? Prisma.sql`AND i."project" = ${project}` : Prisma.empty}
        GROUP BY i."project"
        ORDER BY count DESC
      `,
      prisma.inspection.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          project: true,
          type: true,
          by: true,
          date: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
    ]);

  return Response.json({
    total,
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
    items: {
      byResult: itemsByResult.map((r) => ({ result: r.result, count: r._count._all })),
    },
    flaggedByProject,
    recent: recent.map((r) => ({
      id: r.id,
      project: r.project,
      type: r.type,
      by: r.by,
      date: r.date,
      status: r.status,
      itemCount: r._count.items,
      createdAt: r.createdAt,
    })),
  });
}

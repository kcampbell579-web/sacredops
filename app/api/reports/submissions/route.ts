import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/submissions
// Real SQL aggregation over the decomposed Submission table — the kind of
// reporting that is impossible while data lives as an opaque JSON blob.
//
// Optional filters: ?project=<name>&formTitle=<title>
export async function GET(req: Request) {
  const companyId = await requireCompanyId();
  if (!companyId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || undefined;
  const formTitle = searchParams.get("formTitle") || undefined;

  const where = { companyId, project, formTitle };

  const [total, byProject, byFormTitle, recent] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.groupBy({
      by: ["project"],
      where,
      _count: { _all: true },
      orderBy: { _count: { project: "desc" } },
    }),
    prisma.submission.groupBy({
      by: ["formTitle"],
      where,
      _count: { _all: true },
      orderBy: { _count: { formTitle: "desc" } },
    }),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        project: true,
        formTitle: true,
        worker: true,
        date: true,
        createdAt: true,
      },
    }),
  ]);

  return Response.json({
    total,
    byProject: byProject.map((r) => ({ project: r.project, count: r._count._all })),
    byFormTitle: byFormTitle.map((r) => ({ formTitle: r.formTitle, count: r._count._all })),
    recent,
  });
}

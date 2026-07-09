import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ store: string }> };

// Escape a single CSV cell (RFC 4180): wrap in quotes if it contains a comma,
// quote, or newline, and double any embedded quotes.
function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  return lines.join("\r\n");
}

// GET /api/export/:store[?project=<name>]
// Streams the full decomposed table as CSV (not just the dashboard's top-10).
export async function GET(req: Request, { params }: Ctx) {
  const { store } = await params;
  const project = new URL(req.url).searchParams.get("project") || undefined;

  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (store === "submissions") {
    const data = await prisma.submission.findMany({
      where: { project },
      orderBy: { createdAt: "desc" },
    });
    headers = ["id", "project", "formTitle", "worker", "date", "createdAt"];
    rows = data.map((r) => [r.id, r.project, r.formTitle, r.worker, r.date, r.createdAt.toISOString()]);
  } else if (store === "inspections") {
    const data = await prisma.inspection.findMany({
      where: { project },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    headers = ["id", "project", "type", "by", "date", "status", "passItems", "flagItems", "createdAt"];
    rows = data.map((r) => {
      const pass = r.items.filter((i) => i.result === "pass").length;
      const flag = r.items.filter((i) => i.result === "flag").length;
      return [r.id, r.project, r.type, r.by, r.date, r.status, pass, flag, r.createdAt.toISOString()];
    });
  } else if (store === "projects") {
    const data = await prisma.project.findMany({
      where: project ? { name: project } : {},
      orderBy: { createdAt: "desc" },
    });
    headers = ["id", "name", "role", "crew", "pct", "openInsp", "status", "createdAt"];
    rows = data.map((r) => [r.id, r.name, r.role, r.crew, r.pct, r.openInsp, r.status, r.createdAt.toISOString()]);
  } else if (store === "incidents") {
    const data = await prisma.incident.findMany({
      where: { project },
      orderBy: { createdAt: "desc" },
      include: { conditions: true },
    });
    headers = [
      "id", "source", "kind", "project", "type", "completedBy",
      "dateTime", "medicalAttention", "lostTime", "failedConditions", "createdAt",
    ];
    rows = data.map((r) => [
      r.id, r.source, r.kind, r.project, r.type, r.completedBy,
      r.dateTime, r.medicalAttention, r.lostTime,
      r.conditions.filter((c) => c.result === "fail").length,
      r.createdAt.toISOString(),
    ]);
  } else {
    return new Response("Unknown export store", { status: 404 });
  }

  const csv = toCsv(headers, rows);
  const suffix = project ? "-" + project.replace(/[^a-z0-9]+/gi, "_") : "";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sacredops-${store}${suffix}.csv"`,
    },
  });
}

import { prisma } from "./prisma";

// A "projector" decomposes a portal localStorage key (a JSON document) into
// typed, queryable relational rows — and reconstructs that same JSON value on
// read. This keeps the portals working unchanged while giving specific,
// high-value stores real SQL-backed storage and reporting.
//
// A key with a projector is NOT stored in AppState; the relational table is its
// source of truth.
export type Projector = {
  // Reconstruct the localStorage value (the shape the portal expects).
  read: () => Promise<unknown>;
  // Persist the localStorage value into relational rows.
  write: (value: unknown) => Promise<void>;
};

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : v == null ? undefined : String(v);
}

export const projectors: Record<string, Projector> = {
  // Form submissions — { id, project, formTitle, worker, date, spec }
  sacredops_submissions: {
    read: async () => {
      const rows = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        project: r.project,
        formTitle: r.formTitle,
        worker: r.worker ?? undefined,
        date: r.date ?? undefined,
        spec: r.spec ?? undefined,
      }));
    },
    write: async (value) => {
      const items = asArray(value);
      // Upsert-only (no delete): submissions accrue and are never removed from
      // the portal UI, and this keeps concurrent submissions from two devices
      // from clobbering each other.
      for (const s of items) {
        const id = str(s.id);
        if (!id) continue;
        const data = {
          project: str(s.project) ?? "",
          formTitle: str(s.formTitle) ?? str(s.title) ?? "Untitled",
          worker: str(s.worker) ?? str(s.by) ?? null,
          date: str(s.date) ?? null,
          spec: (s.spec ?? s) as never,
        };
        await prisma.submission.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });
      }
    },
  },
};

// Inspections — { id, type, proj, date, by, status, items:[[label,result]], note, ... }
projectors.sacredops_inspections = {
  read: async () => {
    const rows = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { position: "asc" } } },
    });
    return rows.map((r) => {
      const extra =
        r.details && typeof r.details === "object" && !Array.isArray(r.details)
          ? (r.details as Record<string, unknown>)
          : {};
      return {
        id: r.id,
        type: r.type,
        proj: r.project,
        date: r.date ?? undefined,
        by: r.by ?? undefined,
        status: r.status,
        items: r.items.map((it) => [it.label, it.result]),
        note: r.note ?? undefined,
        ...extra,
      };
    });
  },
  write: async (value) => {
    const items = asArray(value);
    // Upsert-only across inspections (they accrue); an inspection's checklist
    // items are replaced wholesale when that inspection is (re)written.
    for (const ins of items) {
      const id = str(ins.id);
      if (!id) continue;

      const { id: _id, type, proj, date, by, status, note, items: checks, ...rest } = ins;
      void _id;
      const hasExtra = Object.keys(rest).length > 0;
      const data = {
        project: str(proj) ?? "",
        type: str(type) ?? "",
        by: str(by) ?? null,
        date: str(date) ?? null,
        status: str(status) ?? "",
        note: str(note) ?? null,
        details: (hasExtra ? rest : null) as never,
      };
      const checkRows = (Array.isArray(checks) ? checks : []).map(
        (pair: unknown, idx: number) => {
          const p = pair as unknown[];
          return {
            inspectionId: id,
            label: str(p?.[0]) ?? "",
            result: str(p?.[1]) ?? "",
            position: idx,
          };
        }
      );

      await prisma.$transaction([
        prisma.checklistItem.deleteMany({ where: { inspectionId: id } }),
        prisma.inspection.upsert({ where: { id }, update: data, create: { id, ...data } }),
        prisma.checklistItem.createMany({ data: checkRows }),
      ]);
    }
  },
};

function int(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

// Custom projects — { id, name, loc, div, contract, owner, role, crew, pct, openInsp, status }
projectors.sacredops_custom_projects = {
  read: async () => {
    // Portal appends new projects to the end, so preserve insertion order.
    const rows = await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((r) => {
      const extra =
        r.details && typeof r.details === "object" && !Array.isArray(r.details)
          ? (r.details as Record<string, unknown>)
          : {};
      return {
        id: r.id,
        name: r.name,
        loc: r.loc ?? "",
        div: r.div ?? "",
        contract: r.contract ?? "",
        owner: r.owner ?? "",
        role: r.role ?? "GC",
        crew: r.crew,
        pct: r.pct,
        openInsp: r.openInsp,
        status: r.status ?? "ok",
        ...extra,
      };
    });
  },
  write: async (value) => {
    const items = asArray(value);
    for (const p of items) {
      const id = str(p.id);
      if (!id) continue;
      const {
        id: _id,
        name,
        loc,
        div,
        contract,
        owner,
        role,
        crew,
        pct,
        openInsp,
        status,
        ...rest
      } = p;
      void _id;
      const data = {
        name: str(name) ?? "",
        loc: str(loc) ?? null,
        div: str(div) ?? null,
        contract: str(contract) ?? null,
        owner: str(owner) ?? null,
        role: str(role) ?? null,
        crew: int(crew),
        pct: int(pct),
        openInsp: int(openInsp),
        status: str(status) ?? null,
        details: (Object.keys(rest).length ? rest : null) as never,
      };
      await prisma.project.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
  },
};

export function isProjectedKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(projectors, key);
}

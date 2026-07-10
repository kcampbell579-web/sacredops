import { prisma } from "./prisma";

// A "projector" decomposes a portal localStorage key (a JSON document) into
// typed, queryable relational rows — and reconstructs that same JSON value on
// read. This keeps the portals working unchanged while giving specific,
// high-value stores real SQL-backed storage and reporting.
//
// Every operation is scoped to a companyId (the logged-in user's tenant). A key
// with a projector is NOT stored in AppState; the relational table is its
// source of truth. Rows use a composite (companyId, id) primary key so a
// client-generated id from one company can never overwrite another's.
export type Projector = {
  // Reconstruct the localStorage value (the shape the portal expects).
  read: (companyId: string) => Promise<unknown>;
  // Persist the localStorage value into relational rows. Upsert-only: rows
  // accrue and are never removed by a normal write (safe for stores shared
  // across devices). Use clear() to empty the store.
  write: (companyId: string, value: unknown) => Promise<void>;
  // Empty the projected store's table(s) for this company (child rows cascade).
  clear: (companyId: string) => Promise<void>;
};

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : v == null ? undefined : String(v);
}

function int(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export const projectors: Record<string, Projector> = {
  // Form submissions — { id, project, formTitle, worker, date, spec }
  sacredops_submissions: {
    read: async (companyId) => {
      const rows = await prisma.submission.findMany({
        where: { companyId },
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
    write: async (companyId, value) => {
      const items = asArray(value);
      await Promise.all(
        items.map((s) => {
          const id = str(s.id);
          if (!id) return Promise.resolve();
          const data = {
            project: str(s.project) ?? "",
            formTitle: str(s.formTitle) ?? str(s.title) ?? "Untitled",
            worker: str(s.worker) ?? str(s.by) ?? null,
            date: str(s.date) ?? null,
            spec: (s.spec ?? s) as never,
          };
          return prisma.submission.upsert({
            where: { companyId_id: { companyId, id } },
            update: data,
            create: { companyId, id, ...data },
          });
        })
      );
    },
    clear: async (companyId) => {
      await prisma.submission.deleteMany({ where: { companyId } });
    },
  },

  // Inspections — { id, type, proj, date, by, status, items:[[label,result]], note, ... }
  sacredops_inspections: {
    read: async (companyId) => {
      const rows = await prisma.inspection.findMany({
        where: { companyId },
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
    write: async (companyId, value) => {
      const items = asArray(value);
      await Promise.all(
        items.map((ins) => {
          const id = str(ins.id);
          if (!id) return Promise.resolve();
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
          const checkRows = (Array.isArray(checks) ? checks : []).map((pair: unknown, idx: number) => {
            const p = pair as unknown[];
            return { companyId, inspectionId: id, label: str(p?.[0]) ?? "", result: str(p?.[1]) ?? "", position: idx };
          });

          return prisma.$transaction([
            prisma.checklistItem.deleteMany({ where: { companyId, inspectionId: id } }),
            prisma.inspection.upsert({
              where: { companyId_id: { companyId, id } },
              update: data,
              create: { companyId, id, ...data },
            }),
            prisma.checklistItem.createMany({ data: checkRows }),
          ]);
        })
      );
    },
    clear: async (companyId) => {
      await prisma.inspection.deleteMany({ where: { companyId } });
    },
  },

  // Custom projects — { id, name, loc, div, contract, owner, role, crew, pct, openInsp, status }
  sacredops_custom_projects: {
    read: async (companyId) => {
      // Portal appends new projects to the end, so preserve insertion order.
      const rows = await prisma.project.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } });
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
    write: async (companyId, value) => {
      const items = asArray(value);
      await Promise.all(
        items.map((p) => {
          const id = str(p.id);
          if (!id) return Promise.resolve();
          const { id: _id, name, loc, div, contract, owner, role, crew, pct, openInsp, status, ...rest } = p;
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
          return prisma.project.upsert({
            where: { companyId_id: { companyId, id } },
            update: data,
            create: { companyId, id, ...data },
          });
        })
      );
    },
    clear: async (companyId) => {
      await prisma.project.deleteMany({ where: { companyId } });
    },
  },

  // Incidents — quick reports and full investigation reports. Shape:
  // { id, source, kind, project, projectNumber, type, completedBy, dateTime,
  //   reportedWhen, medicalAttention, lostTime, conditions:[[label,result]], ...narrative }
  sacredops_incidents: {
    read: async (companyId) => {
      const rows = await prisma.incident.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        include: { conditions: { orderBy: { position: "asc" } } },
      });
      return rows.map((r) => {
        const extra =
          r.details && typeof r.details === "object" && !Array.isArray(r.details)
            ? (r.details as Record<string, unknown>)
            : {};
        return {
          id: r.id,
          source: r.source,
          kind: r.kind,
          project: r.project,
          projectNumber: r.projectNumber ?? undefined,
          type: r.type ?? undefined,
          completedBy: r.completedBy ?? undefined,
          dateTime: r.dateTime ?? undefined,
          reportedWhen: r.reportedWhen ?? undefined,
          medicalAttention: r.medicalAttention ?? undefined,
          lostTime: r.lostTime ?? undefined,
          conditions: r.conditions.map((c) => [c.label, c.result]),
          ...extra,
        };
      });
    },
    write: async (companyId, value) => {
      const items = asArray(value);
      await Promise.all(
        items.map((inc) => {
          const id = str(inc.id);
          if (!id) return Promise.resolve();
          const {
            id: _id,
            source,
            kind,
            project,
            projectNumber,
            type,
            completedBy,
            dateTime,
            reportedWhen,
            medicalAttention,
            lostTime,
            conditions,
            ...rest
          } = inc;
          void _id;
          const data = {
            source: str(source) ?? "supervisor",
            kind: str(kind) ?? "report",
            project: str(project) ?? "",
            projectNumber: str(projectNumber) ?? null,
            type: str(type) ?? null,
            completedBy: str(completedBy) ?? null,
            dateTime: str(dateTime) ?? null,
            reportedWhen: str(reportedWhen) ?? null,
            medicalAttention: str(medicalAttention) ?? null,
            lostTime: str(lostTime) ?? null,
            details: (Object.keys(rest).length ? rest : null) as never,
          };
          const condRows = (Array.isArray(conditions) ? conditions : [])
            .map((pair: unknown, idx: number) => {
              const p = pair as unknown[];
              return { companyId, incidentId: id, label: str(p?.[0]) ?? "", result: str(p?.[1]) ?? "", position: idx };
            })
            .filter((c) => c.label && c.result);

          return prisma.$transaction([
            prisma.incidentCondition.deleteMany({ where: { companyId, incidentId: id } }),
            prisma.incident.upsert({
              where: { companyId_id: { companyId, id } },
              update: data,
              create: { companyId, id, ...data },
            }),
            prisma.incidentCondition.createMany({ data: condRows }),
          ]);
        })
      );
    },
    clear: async (companyId) => {
      await prisma.incident.deleteMany({ where: { companyId } });
    },
  },
};

export function isProjectedKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(projectors, key);
}

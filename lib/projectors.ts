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

export function isProjectedKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(projectors, key);
}

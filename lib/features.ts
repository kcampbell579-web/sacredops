// Per-company feature flags & plan tiers. The platform owner sets each
// company's plan (and optional per-feature overrides) from /companies; the
// server returns the effective flags in /api/auth/me and the portals hide any
// module that's turned off. Features NOT listed here are always on (core).

export type FeatureKey =
  | "scheduler"
  | "reports"
  | "payroll"
  | "expenses"
  | "subcontractors"
  | "dailylog";

export const FEATURE_LIST: { key: FeatureKey; label: string; blurb: string }[] = [
  { key: "scheduler", label: "Scheduler", blurb: "6-week look-ahead & Gantt PDF" },
  { key: "reports", label: "Reports Dashboard", blurb: "Cross-project reporting & CSV export" },
  { key: "payroll", label: "Payroll Register", blurb: "Hours, wages & certified payroll" },
  { key: "expenses", label: "Expense Tracker", blurb: "Job-cost expenses with receipts" },
  { key: "subcontractors", label: "Subcontractor Manager", blurb: "Sub directory & COI tracking" },
  { key: "dailylog", label: "Daily Log", blurb: "Project daily notes" },
];

export type PlanKey = "starter" | "pro" | "enterprise";

// Which flagged features each plan turns on by default. (Core features — sign-in,
// toolbox talks, inspections, forms, safety locations — are always available.)
export const PLANS: Record<PlanKey, { label: string; features: Record<FeatureKey, boolean> }> = {
  starter: {
    label: "Starter",
    features: { scheduler: false, reports: false, payroll: false, expenses: false, subcontractors: false, dailylog: false },
  },
  pro: {
    label: "Pro",
    features: { scheduler: true, reports: true, payroll: true, expenses: true, subcontractors: true, dailylog: true },
  },
  enterprise: {
    label: "Enterprise",
    features: { scheduler: true, reports: true, payroll: true, expenses: true, subcontractors: true, dailylog: true },
  },
};

// Merge a plan's defaults with per-company overrides into the effective flags.
export function effectiveFeatures(
  plan: string | null | undefined,
  overrides: unknown
): Record<string, boolean> {
  const base = (PLANS[(plan as PlanKey)] || PLANS.starter).features;
  const eff: Record<string, boolean> = { ...base };
  if (overrides && typeof overrides === "object") {
    for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
      if (typeof v === "boolean") eff[k] = v;
    }
  }
  return eff;
}

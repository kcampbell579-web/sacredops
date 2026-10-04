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

export type PlanKey = "starter" | "pro" | "business" | "enterprise";

// Terminal state set by the Stripe webhook when a subscription ends or goes
// unpaid. Not a PlanKey: /api/auth/me reports active:false for it so the
// portals lock behind a reactivate screen, and every feature flag is off.
export const CANCELLED_PLAN = "cancelled";

// Which flagged features each plan turns on by default. Cumulative ladder:
// Starter = core only · Pro adds day-to-day ops · Business adds oversight ·
// Enterprise adds subcontractor management. (Core features — both portals,
// forms→PDF, SDS, OSHA board, toolbox talks, sign-ins, inspections — are always
// available on every plan.)
export const PLANS: Record<PlanKey, { label: string; features: Record<FeatureKey, boolean> }> = {
  starter: {
    label: "Starter",
    features: { scheduler: false, reports: false, payroll: false, expenses: false, subcontractors: false, dailylog: false },
  },
  pro: {
    label: "Pro",
    features: { scheduler: true, reports: true, payroll: false, expenses: true, subcontractors: false, dailylog: true },
  },
  business: {
    label: "Business",
    features: { scheduler: true, reports: true, payroll: true, expenses: true, subcontractors: false, dailylog: true },
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
  // A cancelled / unpaid subscription turns every flagged module off (the
  // portal itself is locked by PortalGate via active:false).
  if (plan === CANCELLED_PLAN) {
    const off: Record<string, boolean> = {};
    for (const f of FEATURE_LIST) off[f.key] = false;
    return off;
  }
  // No plan (legacy / demo companies created before paid signup) → full access.
  // New companies always arrive with a plan from their paid checkout, and a
  // plan RESTRICTS features once assigned. Per-company overrides below still
  // win for QC / manual tuning.
  const base = (PLANS[(plan as PlanKey)] || PLANS.enterprise).features;
  const eff: Record<string, boolean> = { ...base };
  if (overrides && typeof overrides === "object") {
    for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
      if (typeof v === "boolean") eff[k] = v;
    }
  }
  return eff;
}

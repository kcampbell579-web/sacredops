"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Brand palette (matches the portals' dark industrial theme)
const BG0 = "#0D0D0D";
const AC = "#04A466"; // brand green — single hue for magnitude
const SU = "#29C46D"; // status: good
const WN = "#F4B400"; // status: warning
const DN = "#E53935"; // status: critical
const TX = "#F4F7F5";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const glass: React.CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
  border: "1px solid " + HL,
  borderRadius: 16,
};

type Report = Record<string, any> | null;

async function getJSON(url: string): Promise<Report> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px" }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: MU, fontFamily: MONO }}>
        {String(children).toUpperCase()}
      </span>
      <div style={{ flex: 1, height: 1, background: HL }} />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color = TX,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={{ ...glass, padding: "16px 16px 15px", flex: "1 1 150px", minWidth: 140 }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: MU, fontFamily: MONO }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color, marginTop: 6, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: MU, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// Single-hue horizontal magnitude bars with a direct label + value on every row.
// (Labels on every bar means identity is never carried by color alone.)
function Bars({
  rows,
  color = AC,
}: {
  rows: { label: string; value: number; color?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) {
    return <div style={{ fontSize: 12, color: MU, padding: "6px 0" }}>No data yet.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 12, color: TX, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.label || "—"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: TX, fontFamily: MONO, flexShrink: 0 }}>
              {r.value}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div
              style={{
                width: Math.round((r.value / max) * 100) + "%",
                height: "100%",
                minWidth: r.value > 0 ? 6 : 0,
                background: r.color || color,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  title,
  exportHref,
  children,
}: {
  title: string;
  exportHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...glass, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: TX }}>{title}</div>
        {exportHref && (
          <a
            href={exportHref}
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: MU,
              textDecoration: "none",
              fontFamily: MONO,
              letterSpacing: 0.5,
              border: "1px solid " + HL,
              borderRadius: 8,
              padding: "4px 9px",
              whiteSpace: "nowrap",
            }}
          >
            CSV ↓
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

const statusColor = (s: string) =>
  /pass|ok|good|approved|compliant/i.test(s)
    ? SU
    : /fail|stop|critical/i.test(s)
    ? DN
    : /attention|open|warn|expir|reject/i.test(s)
    ? WN
    : MU;

type Bundle = { submissions: Report; inspections: Report; projects: Report; incidents: Report };

async function loadReports(project: string): Promise<Bundle> {
  const q = project ? "?project=" + encodeURIComponent(project) : "";
  const [submissions, inspections, projects, incidents] = await Promise.all([
    getJSON("/api/reports/submissions" + q),
    getJSON("/api/reports/inspections" + q),
    getJSON("/api/reports/projects" + q),
    getJSON("/api/reports/incidents" + q),
  ]);
  return { submissions, inspections, projects, incidents };
}

export default function ReportsPage() {
  const [data, setData] = useState<Bundle | null>(null);
  const [filter, setFilter] = useState("");
  const [projectList, setProjectList] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  // Monotonic request id so a slow earlier fetch can't overwrite a newer one.
  const reqSeq = useRef(0);

  useEffect(() => {
    (async () => {
      // Require a logged-in user (reports are company-scoped).
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        const user = me.ok ? (await me.json()).user : null;
        if (!user) {
          window.location.href = "/login?next=%2Freports";
          return;
        }
        // Reports is a premium module — gate by the company's plan.
        if (user.features && user.features.reports === false) {
          setLocked(true);
          return;
        }
      } catch {
        window.location.href = "/login?next=%2Freports";
        return;
      }

      const myId = ++reqSeq.current;
      const d = await loadReports("");
      if (myId !== reqSeq.current) return;
      setData(d);
      const names = new Set<string>();
      (d.submissions?.byProject ?? []).forEach((x: any) => x.project && names.add(x.project));
      (d.incidents?.byProject ?? []).forEach((x: any) => x.project && names.add(x.project));
      (d.inspections?.flaggedByProject ?? []).forEach((x: any) => x.project && names.add(x.project));
      (d.projects?.recent ?? []).forEach((x: any) => x.name && names.add(x.name));
      setProjectList([...names].sort());
    })();
  }, []);

  const select = async (name: string) => {
    setFilter(name);
    setBusy(true);
    const myId = ++reqSeq.current;
    const d = await loadReports(name);
    if (myId !== reqSeq.current) return; // a newer request superseded this one
    setData(d);
    setBusy(false);
  };

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: BG0,
    color: TX,
    fontFamily: SANS,
    padding: "22px 18px 60px",
  };

  if (locked) {
    return (
      <main style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 340, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Reports is a premium module</div>
          <p style={{ color: MU, fontSize: 13, lineHeight: 1.55 }}>
            Your plan doesn&apos;t include the Reports Dashboard. Ask your SacredOps rep to add it.
          </p>
          <Link href="/" style={{ color: AC, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>← Back home</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MU, fontFamily: MONO, fontSize: 12, letterSpacing: 1 }}>LOADING REPORTS…</span>
      </main>
    );
  }

  const sub = data.submissions || {};
  const insp = data.inspections || {};
  const proj = data.projects || {};
  const inc = data.incidents || {};

  const exp = (store: string) =>
    "/api/export/" + store + (filter ? "?project=" + encodeURIComponent(filter) : "");

  const inspItems = (insp.items && insp.items.byResult) || [];
  const flagCount = inspItems.find((x: any) => x.result === "flag")?.count ?? 0;
  const passCount = inspItems.find((x: any) => x.result === "pass")?.count ?? 0;
  const inspItemTotal = flagCount + passCount;

  return (
    <main style={wrap}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg," + AC + ",#003B22)", boxShadow: "0 0 20px " + AC + "55" }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                Sacred<span style={{ color: AC }}>Ops</span> <span style={{ color: MU, fontWeight: 700 }}>Reports</span>
              </div>
              <div style={{ fontSize: 11.5, color: MU }}>Live analytics across your decomposed operations data</div>
            </div>
          </div>
          <Link href="/" style={{ fontSize: 11.5, color: AC, textDecoration: "none", fontWeight: 700, border: "1px solid " + HL, borderRadius: 10, padding: "8px 14px" }}>
            ← Portals
          </Link>
        </div>

        {/* Project filter */}
        {projectList.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", opacity: busy ? 0.55 : 1, transition: "opacity .15s" }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: MU, fontFamily: MONO, marginRight: 2 }}>
                PROJECT
              </span>
              {[{ n: "", label: "All projects" }, ...projectList.map((n) => ({ n, label: n }))].map((c) => {
                const on = filter === c.n;
                return (
                  <button
                    key={c.n || "all"}
                    onClick={() => !on && select(c.n)}
                    style={{
                      background: on ? AC + "1e" : "rgba(255,255,255,0.05)",
                      border: "1px solid " + (on ? AC : HL),
                      color: on ? AC : MU,
                      borderRadius: 20,
                      padding: "7px 13px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: on ? "default" : "pointer",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* KPI row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <Stat label="Submissions" value={sub.total ?? 0} sub={`${(sub.byFormTitle?.length ?? 0)} form types`} color={AC} />
          <Stat label="Inspections" value={insp.total ?? 0} sub={`${flagCount} flagged item${flagCount === 1 ? "" : "s"}`} color={AC} />
          <Stat label="Projects" value={proj.total ?? 0} sub={`${proj.totalCrew ?? 0} crew · ${Math.round(proj.avgCompletion ?? 0)}% avg`} color={AC} />
          <Stat label="Incidents" value={inc.total ?? 0} sub={`${inc.withFailedConditions ?? 0} with failed conditions`} color={(inc.total ?? 0) > 0 ? WN : AC} />
        </div>

        {/* Grid of report cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {/* Submissions */}
          <Card title="Submissions by form type" exportHref={exp("submissions")}>
            <Bars rows={(sub.byFormTitle ?? []).map((r: any) => ({ label: r.formTitle, value: r.count }))} />
            <div style={{ marginTop: 16 }}>
              <Eyebrow>By project</Eyebrow>
              <Bars rows={(sub.byProject ?? []).map((r: any) => ({ label: r.project, value: r.count }))} />
            </div>
          </Card>

          {/* Inspections */}
          <Card title="Inspections" exportHref={exp("inspections")}>
            <Eyebrow>Checklist items</Eyebrow>
            <Bars
              rows={[
                { label: "Pass", value: passCount, color: SU },
                { label: "Flag", value: flagCount, color: WN },
              ]}
            />
            <div style={{ fontSize: 11, color: MU, marginTop: 6 }}>
              {inspItemTotal > 0 ? `${Math.round((flagCount / inspItemTotal) * 100)}% of items flagged` : "No checklist items yet."}
            </div>
            <div style={{ marginTop: 16 }}>
              <Eyebrow>Flagged items by project</Eyebrow>
              <Bars rows={(insp.flaggedByProject ?? []).map((r: any) => ({ label: r.project, value: r.count, color: WN }))} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Eyebrow>By status</Eyebrow>
              <Bars rows={(insp.byStatus ?? []).map((r: any) => ({ label: r.status, value: r.count, color: statusColor(r.status) }))} />
            </div>
          </Card>

          {/* Projects */}
          <Card title="Projects" exportHref={exp("projects")}>
            <Eyebrow>Crew by role</Eyebrow>
            <Bars rows={(proj.byRole ?? []).map((r: any) => ({ label: r.role || "—", value: r.crew }))} />
            <div style={{ marginTop: 16 }}>
              <Eyebrow>By status</Eyebrow>
              <Bars rows={(proj.byStatus ?? []).map((r: any) => ({ label: r.status || "—", value: r.count, color: statusColor(r.status || "") }))} />
            </div>
          </Card>

          {/* Incidents */}
          <Card title="Incidents" exportHref={exp("incidents")}>
            <Eyebrow>By type</Eyebrow>
            <Bars rows={(inc.byType ?? []).map((r: any) => ({ label: r.type || "Unspecified", value: r.count, color: DN }))} />
            <div style={{ marginTop: 16 }}>
              <Eyebrow>By source</Eyebrow>
              <Bars rows={(inc.bySource ?? []).map((r: any) => ({ label: r.source, value: r.count }))} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Eyebrow>By project</Eyebrow>
              <Bars rows={(inc.byProject ?? []).map((r: any) => ({ label: r.project, value: r.count, color: DN }))} />
            </div>
          </Card>
        </div>

        <div style={{ fontSize: 10.5, color: MU, fontFamily: MONO, letterSpacing: 0.3, textAlign: "center", marginTop: 26 }}>
          Data is projected from the portals into relational Postgres tables in real time.
        </div>
      </div>
    </main>
  );
}

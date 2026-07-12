"use client";

import { useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const DN = "#E53935";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

type Feat = { key: string; label: string; blurb: string };
type Company = {
  id: string;
  name: string;
  subdomain: string | null;
  joinCode: string;
  plan: string;
  overrides: Record<string, boolean>;
  features: Record<string, boolean>;
  users: number;
  createdAt: string;
};

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [plans, setPlans] = useState<{ key: string; label: string }[]>([]);
  const [featureList, setFeatureList] = useState<Feat[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2400); };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/owner/companies", { cache: "no-store" });
        if (res.status === 403) { setForbidden(true); setLoading(false); return; }
        const d = await res.json();
        setPlans(d.plans || []);
        setFeatureList(d.featureList || []);
        setCompanies(d.companies || []);
      } catch { setForbidden(true); }
      setLoading(false);
    })();
  }, []);

  async function save(id: string, body: { plan?: string; overrides?: Record<string, boolean> }) {
    setBusy(id);
    try {
      const res = await fetch("/api/owner/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: id, ...body }),
      });
      const d = await res.json();
      if (!res.ok) { flash(d.error || "Couldn't save."); }
      else {
        setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, plan: d.company.plan, features: d.company.features, ...(body.overrides ? { overrides: body.overrides } : {}) } : c)));
        flash("Saved.");
      }
    } catch { flash("Network error."); }
    setBusy(null);
  }

  const changePlan = (c: Company, plan: string) => save(c.id, { plan });
  const toggle = (c: Company, key: string) => {
    const next = { ...c.overrides, [key]: !c.features[key] };
    save(c.id, { overrides: next });
  };

  const page: React.CSSProperties = { minHeight: "100vh", background: "#0d0d0d", color: TX, fontFamily: SANS, padding: "26px 20px 60px" };

  if (loading) return <main style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: MU, fontFamily: MONO, fontSize: 12 }}>LOADING…</div></main>;

  if (forbidden) return (
    <main style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Owner only</div>
        <p style={{ color: MU, fontSize: 13, lineHeight: 1.5 }}>This is the customer control panel. Set <code style={{ color: AC }}>OWNER_EMAILS</code> in Vercel to your email and log in with that account.</p>
        <a href="/" style={{ color: AC, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>← Back home</a>
      </div>
    </main>
  );

  return (
    <main style={page}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <a href="/" style={{ color: MU, fontSize: 11.5, fontFamily: MONO, textDecoration: "none" }}>← SacredOps</a>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "10px 0 2px" }}>Customers</h1>
        <p style={{ color: MU, fontSize: 13, margin: "0 0 22px" }}>{companies.length} companies · set each plan and toggle modules for QC or upsell.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {companies.map((c) => (
            <div key={c.id} style={{ border: "1px solid " + HL, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 18px", opacity: busy === c.id ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MU, fontFamily: MONO, marginTop: 3 }}>
                    {c.subdomain ? c.subdomain + ".sacredops.app" : c.joinCode} · {c.users} user{c.users === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 10.5, color: MU, fontFamily: MONO }}>PLAN</label>
                  <select value={c.plan} onChange={(e) => changePlan(c, e.target.value)} disabled={busy === c.id}
                    style={{ background: "rgba(255,255,255,0.05)", color: TX, border: "1px solid " + HL, borderRadius: 9, padding: "7px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    {plans.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {featureList.map((f) => {
                  const on = c.features[f.key];
                  return (
                    <button key={f.key} onClick={() => toggle(c, f.key)} disabled={busy === c.id} title={f.blurb}
                      style={{
                        display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                        background: on ? AC + "1e" : "rgba(255,255,255,0.04)",
                        border: "1px solid " + (on ? AC : HL), color: on ? AC : MU,
                        borderRadius: 20, padding: "7px 12px", fontSize: 11.5, fontWeight: 700,
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: on ? AC : "#5c6b60" }} />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {companies.length === 0 && <div style={{ color: MU, fontSize: 13, textAlign: "center", padding: "30px 0" }}>No companies yet.</div>}
        </div>
      </div>

      {toast && <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "#18392b", color: TX, border: "1px solid " + AC + "66", borderRadius: 11, padding: "11px 18px", fontSize: 12.5, fontWeight: 600, zIndex: 50 }}>{toast}</div>}
    </main>
  );
}

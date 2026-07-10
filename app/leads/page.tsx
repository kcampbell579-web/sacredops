"use client";

import { useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

type Lead = { id: string; companyName: string; name: string; email: string; phone: string | null; createdAt: string };

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leads", { cache: "no-store" });
        if (res.status === 403) {
          setForbidden(true);
        } else {
          setLeads((await res.json()).leads || []);
        }
      } catch {
        setForbidden(true);
      }
      setLoading(false);
    })();
  }, []);

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: TX,
    fontFamily: SANS,
    padding: "26px 20px 60px",
  };

  if (loading) {
    return (
      <main style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: MU, fontFamily: MONO, fontSize: 12, letterSpacing: 1 }}>LOADING…</div>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Owner only</div>
          <p style={{ color: MU, fontSize: 13, lineHeight: 1.5 }}>
            This page shows every SacredOps signup. It's restricted to the platform owner. Set{" "}
            <code style={{ color: AC }}>OWNER_EMAILS</code> in your Vercel project to your email and
            log in with that account.
          </p>
          <a href="/" style={{ color: AC, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
            ← Back home
          </a>
        </div>
      </main>
    );
  }

  const filtered = leads.filter((l) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      l.companyName.toLowerCase().includes(s) ||
      l.name.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.phone || "").toLowerCase().includes(s)
    );
  });

  return (
    <main style={page}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <a href="/" style={{ color: MU, fontSize: 11.5, fontFamily: MONO, textDecoration: "none" }}>
          ← SacredOps
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 2px" }}>Leads</h1>
            <p style={{ color: MU, fontSize: 13, margin: 0 }}>
              {leads.length} signup{leads.length === 1 ? "" : "s"} · newest first
            </p>
          </div>
          <a
            href="/api/leads?format=csv"
            style={{ background: AC, color: "#04231a", textDecoration: "none", borderRadius: 10, padding: "10px 16px", fontSize: 11.5, fontWeight: 800 }}
          >
            EXPORT CSV
          </a>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, name, email, phone…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 16,
            marginBottom: 16,
            background: "rgba(255,255,255,0.05)",
            color: TX,
            border: "1px solid " + HL,
            borderRadius: 11,
            padding: "11px 13px",
            fontSize: 13,
            outline: "none",
          }}
        />

        {filtered.length === 0 ? (
          <div style={{ color: MU, fontSize: 13, padding: "30px 0", textAlign: "center" }}>
            {leads.length === 0 ? "No signups yet — leads land here as people create accounts." : "No matches."}
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid " + HL, borderRadius: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: "left", color: MU, fontFamily: MONO, fontSize: 10, letterSpacing: 0.5 }}>
                  <th style={th}>DATE</th>
                  <th style={th}>COMPANY</th>
                  <th style={th}>NAME</th>
                  <th style={th}>EMAIL</th>
                  <th style={th}>PHONE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} style={{ background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td style={{ ...td, color: MU, whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{l.companyName}</td>
                    <td style={td}>{l.name}</td>
                    <td style={td}>
                      <a href={`mailto:${l.email}`} style={{ color: AC, textDecoration: "none" }}>{l.email}</a>
                    </td>
                    <td style={td}>
                      {l.phone ? (
                        <a href={`tel:${l.phone}`} style={{ color: AC, textDecoration: "none" }}>{l.phone}</a>
                      ) : (
                        <span style={{ color: MU }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const th: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid " + HL };
const td: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid " + HL };

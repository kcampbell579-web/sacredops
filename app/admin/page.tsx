"use client";

import { useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const DN = "#E53935";
const WN = "#F4B400";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

type Member = {
  id: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "WORKER";
  email: string | null;
  loginType: "email" | "pin";
  createdAt: string;
};

const ROLE_META: Record<string, { label: string; color: string; blurb: string }> = {
  ADMIN: { label: "Admin", color: AC, blurb: "Full access · manage members & roles" },
  SUPERVISOR: { label: "Supervisor", color: WN, blurb: "Supervisor Portal · projects, forms, reports" },
  WORKER: { label: "Worker", color: MU, blurb: "Worker Portal only" },
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [company, setCompany] = useState<{ name: string; joinCode: string }>({ name: "", joinCode: "" });
  const [meId, setMeId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2600);
  };

  async function load() {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCompany(data.company);
      setMeId(data.me?.id || "");
      setMembers(data.users || []);
    } catch {
      flash("Couldn't load members.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id: string, role: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Couldn't update role.");
      } else {
        setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role: role as Member["role"] } : m)));
        flash("Role updated.");
      }
    } catch {
      flash("Network error.");
    }
    setBusy(null);
  }

  async function resetPin(m: Member) {
    const pin = window.prompt(`Set a new 4-digit PIN for ${m.name}:`, "");
    if (pin == null) return;
    if (!/^\d{4}$/.test(pin)) {
      flash("PIN must be 4 digits.");
      return;
    }
    setBusy(m.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: m.id, action: "reset-pin", pin }),
      });
      const data = await res.json();
      flash(res.ok ? `PIN reset for ${m.name}.` : data.error || "Couldn't reset PIN.");
    } catch {
      flash("Network error.");
    }
    setBusy(null);
  }

  async function remove(m: Member) {
    if (!window.confirm(`Remove ${m.name} from ${company.name}? They'll lose access.`)) return;
    setBusy(m.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: m.id, action: "remove" }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Couldn't remove member.");
      } else {
        setMembers((ms) => ms.filter((x) => x.id !== m.id));
        flash(`${m.name} removed.`);
      }
    } catch {
      flash("Network error.");
    }
    setBusy(null);
  }

  function copyCode() {
    try {
      navigator.clipboard?.writeText(company.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

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
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Admins only</div>
          <p style={{ color: MU, fontSize: 13, lineHeight: 1.5 }}>
            This page is for company admins. Ask your admin to change your role, or log in with an
            admin account.
          </p>
          <a href="/" style={{ color: AC, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
            ← Back home
          </a>
        </div>
      </main>
    );
  }

  const counts = members.reduce<Record<string, number>>((a, m) => ({ ...a, [m.role]: (a[m.role] || 0) + 1 }), {});

  return (
    <main style={page}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <a href="/" style={{ color: MU, fontSize: 11.5, fontFamily: MONO, textDecoration: "none" }}>
          ← SacredOps
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "10px 0 2px" }}>Team & Roles</h1>
        <p style={{ color: MU, fontSize: 13, margin: "0 0 22px" }}>
          {company.name} · {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
          {counts.ADMIN || 0} admin, {counts.SUPERVISOR || 0} supervisor, {counts.WORKER || 0} worker
        </p>

        {/* Company code card */}
        <div
          style={{
            border: "1px solid " + AC + "44",
            background: "rgba(4,164,102,0.08)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 9.5, fontWeight: 800, color: AC, letterSpacing: 1, fontFamily: MONO, marginBottom: 6 }}>
            COMPANY CODE — SHARE WITH WORKERS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, letterSpacing: 2, color: TX }}>
              {company.joinCode}
            </div>
            <button
              onClick={copyCode}
              style={{
                background: AC,
                color: "#04231a",
                border: "none",
                borderRadius: 9,
                padding: "8px 14px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {copied ? "COPIED ✓" : "COPY"}
            </button>
          </div>
          <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>
            Workers log in at your SacredOps site with this code, their name, and a 4-digit PIN they
            choose on first login. New joiners start as <b>Workers</b> — promote them below.
          </p>
        </div>

        {/* Member list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m) => {
            const meta = ROLE_META[m.role];
            const isMe = m.id === meId;
            return (
              <div
                key={m.id}
                style={{
                  border: "1px solid " + HL,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  padding: "14px 15px",
                  opacity: busy === m.id ? 0.55 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</span>
                      {isMe && (
                        <span style={{ fontSize: 9, color: AC, fontFamily: MONO, border: "1px solid " + AC + "55", borderRadius: 20, padding: "1px 7px" }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: MU, marginTop: 3 }}>
                      {m.email ? m.email : "PIN login"} · {meta.blurb}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 9.5,
                      fontWeight: 800,
                      fontFamily: MONO,
                      letterSpacing: 0.5,
                      color: meta.color,
                      background: meta.color + "1e",
                      border: "1px solid " + meta.color + "55",
                      borderRadius: 20,
                      padding: "3px 9px",
                    }}
                  >
                    {meta.label.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <label style={{ fontSize: 10.5, color: MU, fontFamily: MONO }}>ROLE</label>
                  <select
                    value={m.role}
                    disabled={busy === m.id}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: TX,
                      border: "1px solid " + HL,
                      borderRadius: 9,
                      padding: "7px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <option value="WORKER">Worker</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  <div style={{ flex: 1 }} />

                  {m.loginType === "pin" && (
                    <button
                      onClick={() => resetPin(m)}
                      disabled={busy === m.id}
                      style={ghost}
                    >
                      Reset PIN
                    </button>
                  )}
                  {!isMe && (
                    <button
                      onClick={() => remove(m)}
                      disabled={busy === m.id}
                      style={{ ...ghost, color: DN, borderColor: DN + "44" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 22,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#18392b",
            color: TX,
            border: "1px solid " + AC + "66",
            borderRadius: 11,
            padding: "11px 18px",
            fontSize: 12.5,
            fontWeight: 600,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

const ghost: React.CSSProperties = {
  background: "transparent",
  color: MU,
  border: "1px solid " + HL,
  borderRadius: 9,
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

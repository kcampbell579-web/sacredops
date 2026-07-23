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

type Invite = { id: string; name: string; email: string; role: string; token: string };

const ROLE_META: Record<string, { label: string; color: string; blurb: string }> = {
  ADMIN: { label: "Admin", color: AC, blurb: "Full access · manage members & roles" },
  SUPERVISOR: { label: "Supervisor", color: WN, blurb: "Supervisor Portal · projects, forms, reports" },
  WORKER: { label: "Worker", color: MU, blurb: "Worker Portal only" },
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [company, setCompany] = useState<{ name: string; joinCode: string; subdomain: string; plan: string; hasSubscription: boolean; billingConfigured: boolean }>({ name: "", joinCode: "", subdomain: "", plan: "starter", hasSubscription: false, billingConfigured: false });
  const [billBusy, setBillBusy] = useState(false);
  const [subEdit, setSubEdit] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const [subBusy, setSubBusy] = useState(false);
  const [codeEdit, setCodeEdit] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [meId, setMeId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inv, setInv] = useState<{ name: string; email: string; role: string }>({ name: "", email: "", role: "SUPERVISOR" });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copiedToken, setCopiedToken] = useState("");

  const inviteLink = (token: string) =>
    (typeof window !== "undefined" ? window.location.origin : "") + "/invite/" + token;

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
      try {
        const ir = await fetch("/api/admin/invites", { cache: "no-store" });
        if (ir.ok) setInvites((await ir.json()).invites || []);
      } catch {
        /* ignore */
      }
    } catch {
      flash("Couldn't load members.");
    }
    setLoading(false);
  }

  async function sendInvite() {
    const email = inv.email.trim();
    const name = inv.name.trim();
    if (!name || !email) {
      flash("Enter a name and email.");
      return;
    }
    setInviteBusy(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: inv.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Couldn't create invite.");
      } else {
        setInvites((xs) => [data.invite, ...xs.filter((x) => x.email !== data.invite.email)]);
        setInv({ name: "", email: "", role: "SUPERVISOR" });
        copyInvite(data.invite.token);
        flash("Invite link created & copied — send it to them.");
      }
    } catch {
      flash("Network error.");
    }
    setInviteBusy(false);
  }

  function copyInvite(token: string) {
    try {
      navigator.clipboard?.writeText(inviteLink(token));
      setCopiedToken(token);
      window.setTimeout(() => setCopiedToken(""), 1800);
    } catch {
      /* ignore */
    }
  }

  async function revokeInvite(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: id }),
      });
      if (res.ok) {
        setInvites((xs) => xs.filter((x) => x.id !== id));
        flash("Invite revoked.");
      } else {
        flash("Couldn't revoke invite.");
      }
    } catch {
      flash("Network error.");
    }
    setBusy(null);
  }

  useEffect(() => {
    load();
    const b = new URLSearchParams(window.location.search).get("billing");
    if (b === "success") {
      flash("Payment received — your plan updates within a minute.");
      window.setTimeout(load, 4000);
    } else if (b === "cancel") {
      flash("Checkout canceled — no charge.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function billing(path: "checkout" | "portal", body?: Record<string, string>) {
    setBillBusy(true);
    try {
      const res = await fetch("/api/billing/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      flash(data.error || "Billing isn't available yet.");
    } catch {
      flash("Network error.");
    }
    setBillBusy(false);
  }

  async function saveJoinCode() {
    const code = codeDraft.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (code.length < 4) {
      flash("Code must be at least 4 characters.");
      return;
    }
    setCodeBusy(true);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Couldn't save that code.");
      } else {
        setCompany((c) => ({ ...c, joinCode: data.joinCode }));
        setCodeEdit(false);
        flash("Company code updated.");
      }
    } catch {
      flash("Network error.");
    }
    setCodeBusy(false);
  }

  async function saveSubdomain() {
    const slug = subDraft.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (slug.length < 2) {
      flash("Use at least 2 letters or numbers.");
      return;
    }
    setSubBusy(true);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Couldn't save that address.");
      } else {
        setCompany((c) => ({ ...c, subdomain: data.subdomain }));
        setSubEdit(false);
        flash("Login address updated.");
      }
    } catch {
      flash("Network error.");
    }
    setSubBusy(false);
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
          {codeEdit ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="SACR-OPS1-DEMO"
                style={{ background: "rgba(255,255,255,0.05)", color: TX, border: "1px solid " + HL, borderRadius: 9, padding: "9px 12px", fontSize: 15, fontFamily: MONO, letterSpacing: 1, width: 200 }}
              />
              <button onClick={saveJoinCode} disabled={codeBusy} style={{ background: AC, color: "#04231a", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", opacity: codeBusy ? 0.6 : 1 }}>
                {codeBusy ? "…" : "SAVE"}
              </button>
              <button onClick={() => setCodeEdit(false)} style={ghost}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, letterSpacing: 2, color: TX }}>
                {company.joinCode}
              </div>
              <button onClick={copyCode} style={{ background: AC, color: "#04231a", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                {copied ? "COPIED ✓" : "COPY"}
              </button>
              <button onClick={() => { setCodeDraft(company.joinCode); setCodeEdit(true); }} style={ghost}>Change</button>
            </div>
          )}
          <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>
            Workers log in at your SacredOps site with this code, their name, and a 4-digit PIN they
            choose on first login. New joiners start as <b>Workers</b> — promote them below.
          </p>
        </div>

        {/* Login address (company subdomain) */}
        <div style={{ border: "1px solid " + HL, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: MU, letterSpacing: 1, fontFamily: MONO, marginBottom: 6 }}>
            YOUR LOGIN ADDRESS
          </div>
          {company.subdomain && !subEdit ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 17, fontWeight: 800, color: AC }}>
                {company.subdomain}.sacredops.app
              </div>
              <button onClick={() => { setSubDraft(company.subdomain); setSubEdit(true); }} style={ghost}>Change</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid " + HL, borderRadius: 9, overflow: "hidden" }}>
                <input
                  value={subDraft}
                  onChange={(e) => setSubDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="acme"
                  style={{ background: "transparent", color: TX, border: "none", outline: "none", padding: "9px 4px 9px 11px", fontSize: 13, width: 120, fontFamily: MONO }}
                />
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: MU, paddingRight: 11 }}>.sacredops.app</span>
              </div>
              <button onClick={saveSubdomain} disabled={subBusy} style={{ background: AC, color: "#04231a", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", opacity: subBusy ? 0.6 : 1 }}>
                {subBusy ? "…" : "SAVE"}
              </button>
              {company.subdomain && <button onClick={() => setSubEdit(false)} style={ghost}>Cancel</button>}
            </div>
          )}
          <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>
            Give your crew a branded address — at <b>{company.subdomain || "yourname"}.sacredops.app</b> they
            just enter their name &amp; PIN, no company code. <b>Tell us</b> when you pick one so we can point the
            web address at your app (it isn&apos;t live until that&apos;s done).
          </p>
        </div>

        {/* Plan & billing */}
        <div style={{ border: "1px solid " + HL, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: MU, letterSpacing: 1, fontFamily: MONO, marginBottom: 8 }}>
            PLAN &amp; BILLING
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 800, textTransform: "capitalize" }}>{company.plan}</span>
            <span style={{ fontSize: 9.5, fontWeight: 800, fontFamily: MONO, color: company.hasSubscription ? AC : WN, background: (company.hasSubscription ? AC : WN) + "1e", border: "1px solid " + (company.hasSubscription ? AC : WN) + "55", borderRadius: 20, padding: "3px 9px" }}>
              {company.hasSubscription ? "ACTIVE" : "NO PLAN"}
            </span>
            <div style={{ flex: 1 }} />
            {company.hasSubscription ? (
              <button onClick={() => billing("portal")} disabled={billBusy} style={{ background: "transparent", color: TX, border: "1px solid " + HL, borderRadius: 9, padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                Manage billing
              </button>
            ) : (
              <>
                <button onClick={() => billing("checkout", { plan: "starter" })} disabled={billBusy} style={{ background: "transparent", color: AC, border: "1px solid " + AC + "66", borderRadius: 9, padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  Starter
                </button>
                <button onClick={() => billing("checkout", { plan: "pro" })} disabled={billBusy} style={{ background: AC, color: "#04231a", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", opacity: billBusy ? 0.6 : 1 }}>
                  Pro
                </button>
                <button onClick={() => billing("checkout", { plan: "business" })} disabled={billBusy} style={{ background: "transparent", color: AC, border: "1px solid " + AC + "66", borderRadius: 9, padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  Business
                </button>
                <a href="mailto:sales@sacredops.app?subject=Enterprise%20plan" style={{ color: MU, border: "1px solid " + HL, borderRadius: 9, padding: "9px 14px", fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}>
                  Enterprise
                </a>
              </>
            )}
          </div>
          <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>
            {company.billingConfigured
              ? "Upgrade unlocks the Scheduler, Reports, Payroll and more. Cancel anytime from Manage billing."
              : "Online upgrades are coming soon — contact your SacredOps rep to change your plan."}
          </p>
        </div>

        {/* Invite by email (supervisors / admins) */}
        <div style={{ border: "1px solid " + HL, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: MU, letterSpacing: 1, fontFamily: MONO, marginBottom: 4 }}>
            INVITE BY EMAIL
          </div>
          <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "0 0 12px" }}>
            For supervisors & admins who should log in with an <b>email + password</b>. You'll get a
            link to send them; they set their own password. (Workers don't need this — they self-join
            with the company code.)
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={inv.name}
              onChange={(e) => setInv((o) => ({ ...o, name: e.target.value }))}
              placeholder="Full name"
              style={{ ...field, flex: "1 1 140px" }}
            />
            <input
              value={inv.email}
              onChange={(e) => setInv((o) => ({ ...o, email: e.target.value }))}
              placeholder="email@company.com"
              type="email"
              style={{ ...field, flex: "1 1 170px" }}
            />
            <select
              value={inv.role}
              onChange={(e) => setInv((o) => ({ ...o, role: e.target.value }))}
              style={{ ...field, cursor: "pointer", flex: "0 0 auto" }}
            >
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={sendInvite}
              disabled={inviteBusy}
              style={{ background: AC, color: "#04231a", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 11.5, fontWeight: 800, cursor: inviteBusy ? "default" : "pointer", opacity: inviteBusy ? 0.6 : 1 }}
            >
              {inviteBusy ? "…" : "CREATE INVITE"}
            </button>
          </div>

          {invites.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: MU, letterSpacing: 1, fontFamily: MONO }}>
                PENDING INVITES
              </div>
              {invites.map((i) => (
                <div
                  key={i.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", border: "1px solid " + HL, borderRadius: 11, padding: "9px 12px", opacity: busy === i.id ? 0.5 : 1 }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 160px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {i.name}{" "}
                      <span style={{ fontSize: 9.5, color: i.role === "ADMIN" ? AC : WN, fontFamily: MONO }}>· {i.role === "ADMIN" ? "ADMIN" : "SUPERVISOR"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: MU, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.email}</div>
                  </div>
                  <button onClick={() => copyInvite(i.token)} style={ghost}>
                    {copiedToken === i.token ? "Copied ✓" : "Copy link"}
                  </button>
                  <button onClick={() => revokeInvite(i.id)} disabled={busy === i.id} style={{ ...ghost, color: DN, borderColor: DN + "44" }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
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

const field: React.CSSProperties = {
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)",
  color: TX,
  border: "1px solid " + HL,
  borderRadius: 9,
  padding: "9px 11px",
  fontSize: 12.5,
  outline: "none",
};

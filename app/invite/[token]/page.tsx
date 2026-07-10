"use client";

import { use, useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const DN = "#E53935";
const WN = "#F4B400";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const inp: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid " + HL,
  borderRadius: 11,
  fontSize: 14,
  color: TX,
  outline: "none",
  marginBottom: 10,
};

type Invite = { email: string; name: string; role: string; companyName: string; invitedBy: string | null };

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invite/${token}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setLoadErr(data.error || "This invite link is invalid.");
        } else {
          setInvite(data.invite);
          setName(data.invite.name || "");
        }
      } catch {
        setLoadErr("Couldn't load this invite. Check your connection.");
      }
      setLoading(false);
    })();
  }, [token]);

  async function accept() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't accept the invite.");
        setBusy(false);
        return;
      }
      window.location.href = data.user?.role === "WORKER" ? "/worker" : "/";
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: TX,
    fontFamily: SANS,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  };

  const roleLabel = invite?.role === "ADMIN" ? "Admin" : "Supervisor";

  return (
    <main style={wrap}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg," + AC + ",#003B22)", boxShadow: "0 0 22px " + AC + "66" }} />
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Sacred<span style={{ color: AC }}>Ops</span>
          </div>
        </div>

        {loading ? (
          <div style={{ color: MU, fontFamily: MONO, fontSize: 12, letterSpacing: 1 }}>LOADING INVITE…</div>
        ) : loadErr ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Invite unavailable</div>
            <p style={{ color: MU, fontSize: 13, lineHeight: 1.5 }}>{loadErr}</p>
            <a href="/login" style={{ color: AC, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
              Go to login →
            </a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>
              You're invited to {invite!.companyName}
            </div>
            <p style={{ color: MU, fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>
              {invite!.invitedBy ? `${invite!.invitedBy} added you` : "You've been added"} as a{" "}
              <span style={{ color: invite!.role === "ADMIN" ? AC : WN, fontWeight: 700 }}>{roleLabel}</span>. Set a
              password to finish — you'll log in with your email after this.
            </p>

            <div style={{ fontSize: 9.5, fontWeight: 800, color: AC, margin: "0 0 4px", letterSpacing: 0.8, fontFamily: MONO }}>
              EMAIL
            </div>
            <input style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }} value={invite!.email} disabled />

            <div style={{ fontSize: 9.5, fontWeight: 800, color: AC, margin: "0 0 4px", letterSpacing: 0.8, fontFamily: MONO }}>
              YOUR NAME
            </div>
            <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

            <div style={{ fontSize: 9.5, fontWeight: 800, color: AC, margin: "0 0 4px", letterSpacing: 0.8, fontFamily: MONO }}>
              CREATE PASSWORD (8+ CHARACTERS)
            </div>
            <input
              style={inp}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && accept()}
            />

            {error && <div style={{ color: DN, fontSize: 12, fontWeight: 600, margin: "2px 0 10px" }}>{error}</div>}

            <button
              onClick={accept}
              disabled={busy}
              style={{
                width: "100%",
                background: AC,
                color: "#04231a",
                border: "none",
                borderRadius: 11,
                padding: "13px",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                marginTop: 6,
                letterSpacing: 0.5,
              }}
            >
              {busy ? "…" : "ACCEPT & CREATE ACCOUNT"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

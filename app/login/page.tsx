"use client";

import { useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const DN = "#E53935";
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

type Mode = "worker" | "supervisor" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("worker");
  const [f, setF] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") || "/");
  }, []);

  const s = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));

  async function submit() {
    setError("");
    setBusy(true);
    try {
      let url = "";
      let body: Record<string, string> = {};
      if (mode === "worker") {
        url = "/api/auth/join";
        body = { joinCode: f.joinCode || "", name: f.name || "", pin: f.pin || "" };
      } else if (mode === "supervisor") {
        url = "/api/auth/login";
        body = { email: f.email || "", password: f.password || "" };
      } else {
        url = "/api/auth/signup-company";
        body = {
          companyName: f.companyName || "",
          name: f.name || "",
          email: f.email || "",
          password: f.password || "",
        };
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setBusy(false);
        return;
      }
      // New company: show the join code before continuing.
      if (mode === "signup" && data.joinCode) {
        setCreatedCode(data.joinCode);
        setBusy(false);
        return;
      }
      const role = data.user?.role;
      window.location.href = role === "WORKER" ? "/worker" : next;
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      onClick={() => {
        setMode(m);
        setError("");
      }}
      style={{
        flex: 1,
        background: mode === m ? AC + "1e" : "transparent",
        border: "1px solid " + (mode === m ? AC : HL),
        color: mode === m ? AC : MU,
        borderRadius: 10,
        padding: "9px 6px",
        fontSize: 11.5,
        fontWeight: 800,
        cursor: "pointer",
        letterSpacing: 0.3,
      }}
    >
      {label}
    </button>
  );

  const field = (
    key: string,
    label: string,
    opts: { type?: string; placeholder?: string; inputMode?: string; maxLength?: number } = {}
  ) => (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: AC, margin: "0 0 4px", letterSpacing: 0.8, fontFamily: MONO }}>
        {label.toUpperCase()}
      </div>
      <input
        style={inp}
        type={opts.type || "text"}
        placeholder={opts.placeholder || ""}
        value={f[key] || ""}
        inputMode={opts.inputMode as never}
        maxLength={opts.maxLength}
        onChange={(e) => s(key, e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
    </div>
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: TX,
        fontFamily: SANS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg," + AC + ",#003B22)", boxShadow: "0 0 22px " + AC + "66" }} />
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Sacred<span style={{ color: AC }}>Ops</span>
          </div>
        </div>

        {createdCode ? (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Company created 🎉</div>
            <p style={{ color: MU, fontSize: 13, lineHeight: 1.5 }}>
              Share this <b>company code</b> with your workers — they enter it (plus their name and a
              4-digit PIN) to log in. You can find it again in your admin settings later.
            </p>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                color: AC,
                background: "rgba(4,164,102,0.1)",
                border: "1px solid " + AC + "55",
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
                margin: "14px 0",
              }}
            >
              {createdCode}
            </div>
            <button
              onClick={() => (window.location.href = next)}
              style={{ width: "100%", background: AC, color: "#04231a", border: "none", borderRadius: 11, padding: "13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
            >
              CONTINUE
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: MU, fontSize: 12.5, margin: "0 0 18px" }}>Log in to your company.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {tab("worker", "Worker")}
              {tab("supervisor", "Supervisor")}
              {tab("signup", "New company")}
            </div>

            {mode === "worker" && (
              <>
                {field("joinCode", "Company code", { placeholder: "ACME-7F3K-9QLP" })}
                {field("name", "Your name", { placeholder: "John Rivera" })}
                {field("pin", "4-digit PIN", { type: "password", inputMode: "numeric", maxLength: 4, placeholder: "••••" })}
              </>
            )}
            {mode === "supervisor" && (
              <>
                {field("email", "Email", { type: "email", placeholder: "you@company.com" })}
                {field("password", "Password", { type: "password", placeholder: "••••••••" })}
              </>
            )}
            {mode === "signup" && (
              <>
                {field("companyName", "Company name", { placeholder: "Acme Construction" })}
                {field("name", "Your name", { placeholder: "Kelly McClure" })}
                {field("email", "Email", { type: "email", placeholder: "you@company.com" })}
                {field("password", "Password (8+ characters)", { type: "password", placeholder: "••••••••" })}
              </>
            )}

            {error && (
              <div style={{ color: DN, fontSize: 12, fontWeight: 600, margin: "2px 0 10px" }}>{error}</div>
            )}

            <button
              onClick={submit}
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
              {busy ? "…" : mode === "worker" ? "JOIN / LOG IN" : mode === "supervisor" ? "LOG IN" : "CREATE COMPANY"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

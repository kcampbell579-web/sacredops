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

type Mode = "worker" | "supervisor" | "signup" | "solo";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("worker");
  const [f, setF] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  // On worker.sacredops.app we show a worker-only sign-up (no demo, no company).
  const [workerOnly, setWorkerOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") || "/");
    const isWorkerHost = window.location.hostname.split(":")[0].startsWith("worker.");
    const wo = isWorkerHost || params.get("worker") === "1";
    setWorkerOnly(wo);
    const m = params.get("mode");
    if (m === "signup" || m === "supervisor" || m === "worker" || m === "solo") setMode(m as Mode);
    else if (wo) setMode("solo");
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
      } else if (mode === "solo") {
        url = "/api/auth/solo-signup";
        body = { name: f.name || "", email: f.email || "", password: f.password || "" };
      } else {
        url = "/api/auth/signup-company";
        body = {
          companyName: f.companyName || "",
          name: f.name || "",
          email: f.email || "",
          phone: f.phone || "",
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
            <p style={{ color: MU, fontSize: 12.5, margin: "0 0 18px" }}>
              {workerOnly ? "Your personal worker portal — track your résumé, training & certs." : "Log in to your company."}
            </p>

            <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
              {workerOnly ? (
                <>
                  {tab("solo", "Sign up")}
                  {tab("worker", "Have a code")}
                  {tab("supervisor", "Log in")}
                </>
              ) : (
                <>
                  {tab("worker", "Worker")}
                  {tab("supervisor", "Email")}
                  {tab("signup", "Company")}
                  {tab("solo", "Just me")}
                </>
              )}
            </div>

            {mode === "worker" && (
              <>
                {field("joinCode", "Company code", { placeholder: "SACR-OPS1-DEMO" })}
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
                {field("phone", "Phone number", { type: "tel", inputMode: "tel", placeholder: "(555) 123-4567" })}
                {field("password", "Password (8+ characters)", { type: "password", placeholder: "••••••••" })}
              </>
            )}
            {mode === "solo" && (
              <>
                <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "-6px 0 14px" }}>
                  Make your own portal to track your résumé, training and certs — no company code needed.
                  You can join or request a company later from your profile.
                </p>
                {field("name", "Your name", { placeholder: "John Rivera" })}
                {field("email", "Email", { type: "email", placeholder: "you@email.com" })}
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
              {busy ? "…" : mode === "worker" ? "JOIN / LOG IN" : mode === "supervisor" ? "LOG IN" : mode === "solo" ? "CREATE MY PORTAL" : "CREATE COMPANY"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

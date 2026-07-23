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

type Mode = "worker" | "supervisor" | "signup" | "solo" | "demo";

// Fire a Google Analytics 4 event if GA is loaded (see NEXT_PUBLIC_GA_ID in
// app/layout.tsx). Uses beacon transport so it survives the redirect. No-op
// when GA isn't configured.
function track(event: string, params?: Record<string, unknown>) {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (g) g("event", event, params || {});
  } catch {
    /* analytics must never break signup */
  }
  // Mirror the conversion to the Meta (Facebook) Pixel so ad campaigns can
  // optimize: demo signup -> Lead, company/worker signup -> CompleteRegistration.
  try {
    const f = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (f) {
      const fbEvent =
        event === "demo_signup" ? "Lead" : event === "sign_up" ? "CompleteRegistration" : event;
      f("track", fbEvent, params || {});
    }
  } catch {
    /* analytics must never break signup */
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("worker");
  const [f, setF] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  // On worker.sacredops.app we show a worker-only sign-up (no demo, no company).
  const [workerOnly, setWorkerOnly] = useState(false);
  // On demo.sacredops.app we default to the demo sign-up but let people log in too.
  const [demoHost, setDemoHost] = useState(false);
  // On acme.sacredops.app the login is scoped to that company (crew skip the code).
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  // A pricing button can pass ?plan=pro so we send the new admin straight to
  // Stripe checkout for that plan after they sign up.
  const [plan, setPlan] = useState<string | null>(null);

  const RESERVED = ["www", "app", "api", "admin", "demo", "worker", "workers", "staging", "dev", "sacredops"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") || "/");
    const hostParts = window.location.hostname.split(":")[0].split(".");
    const hostSub = hostParts.length >= 3 ? hostParts[0].toLowerCase() : "";
    const isWorkerHost = hostSub === "worker" || hostSub === "workers";
    const wo = isWorkerHost || params.get("worker") === "1";
    setWorkerOnly(wo);
    // demo.sacredops.app serves this page via a rewrite, so window.location keeps
    // the "/" URL and never carries ?mode=demo — detect the demo host directly.
    const isDemoHost = hostSub === "demo";
    setDemoHost(isDemoHost);

    // Company subdomain: ?company=acme, or a non-reserved host subdomain.
    const slug = params.get("company") || (hostSub && !RESERVED.includes(hostSub) ? hostSub : "");
    if (slug && !wo) {
      fetch(`/api/company/lookup?subdomain=${encodeURIComponent(slug)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.company) {
            setCompanySlug(slug);
            setCompanyName(d.company.name);
            setMode("worker");
          }
        })
        .catch(() => {});
    }

    const p = params.get("plan");
    if (p && ["starter", "pro", "business", "enterprise"].includes(p)) {
      setPlan(p);
      if (!params.get("mode")) setMode("signup");
    }

    const m = params.get("mode");
    if (m === "signup" || m === "supervisor" || m === "worker" || m === "solo" || m === "demo") setMode(m as Mode);
    else if (isDemoHost) setMode("demo");
    else if (wo) setMode("solo");
    // Demo signup: prefill the demo company code.
    if (m === "demo" || isDemoHost) setF((o) => ({ ...o, joinCode: params.get("code") || "SACR-OPS1-DEMO" }));
  }, []);

  // After signup, kick off Stripe checkout for the chosen plan (or fall through).
  async function goAfterSignup() {
    if (plan && plan !== "enterprise") {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        /* fall through to the app if billing isn't ready */
      }
    }
    window.location.href = next;
  }

  const s = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));

  async function submit() {
    setError("");
    setBusy(true);
    try {
      let url = "";
      let body: Record<string, string> = {};
      if (mode === "worker") {
        url = "/api/auth/join";
        body = companySlug
          ? { subdomain: companySlug, name: f.name || "", pin: f.pin || "" }
          : { joinCode: f.joinCode || "", name: f.name || "", pin: f.pin || "" };
      } else if (mode === "supervisor") {
        url = "/api/auth/login";
        body = { email: f.email || "", password: f.password || "" };
      } else if (mode === "solo") {
        url = "/api/auth/solo-signup";
        body = { name: f.name || "", email: f.email || "", password: f.password || "" };
      } else if (mode === "demo") {
        url = "/api/auth/demo-signup";
        body = { joinCode: f.joinCode || "", name: f.name || "", email: f.email || "", password: f.password || "" };
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
      // Fire a Google Analytics conversion for this signup (no-op if GA is off).
      if (mode === "demo") track("demo_signup", { method: "demo_code" });
      else if (mode === "signup") track("sign_up", { method: "company" });
      else if (mode === "solo") track("sign_up", { method: "worker_portal" });
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="SacredOps" width={34} height={34} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 12px rgba(0,0,0,0.55)", display: "block" }} />
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
              onClick={goAfterSignup}
              style={{ width: "100%", background: AC, color: "#04231a", border: "none", borderRadius: 11, padding: "13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
            >
              {plan && plan !== "enterprise" ? "CONTINUE TO CHECKOUT →" : "CONTINUE"}
            </button>
          </div>
        ) : (
          <>
            {companyName && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 12px", padding: "10px 12px", background: "rgba(4,164,102,0.1)", border: "1px solid " + AC + "44", borderRadius: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: AC, boxShadow: "0 0 10px " + AC }} />
                <span style={{ fontSize: 13, fontWeight: 800 }}>{companyName}</span>
                <span style={{ fontSize: 10.5, color: MU, fontFamily: MONO, marginLeft: "auto" }}>{companySlug}.sacredops.app</span>
              </div>
            )}
            <p style={{ color: MU, fontSize: 12.5, margin: "0 0 18px" }}>
              {mode === "demo"
                ? "Explore the live SacredOps demo."
                : companyName
                ? "Sign in to your crew — no company code needed."
                : workerOnly
                ? "Your personal worker portal — track your résumé, training & certs."
                : "Log in to your company."}
            </p>

            {mode !== "demo" && !demoHost && (
            <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
              {companyName ? (
                <>
                  {tab("worker", "Worker")}
                  {tab("supervisor", "Manager")}
                </>
              ) : workerOnly ? (
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
            )}

            {mode === "worker" && (
              <>
                {!companySlug && field("joinCode", "Company code", { placeholder: "SACR-OPS1-DEMO" })}
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
                {field("name", "Your name", { placeholder: "Your full name" })}
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
            {mode === "demo" && (
              <>
                <p style={{ color: MU, fontSize: 12, lineHeight: 1.5, margin: "-6px 0 12px" }}>
                  Sign up to explore the live SacredOps demo — real projects, forms, inspections and
                  reports. Takes 20 seconds.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px", padding: "10px 12px", background: "rgba(4,164,102,0.1)", border: "1px solid " + AC + "44", borderRadius: 11 }}>
                  <span style={{ fontSize: 11.5, color: MU }}>Use demo code:</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: AC }}>SACR-OPS1-DEMO</span>
                  <span style={{ fontSize: 10, color: MU, marginLeft: "auto", fontStyle: "italic" }}>already filled in</span>
                </div>
                {field("joinCode", "Demo company code", { placeholder: "SACR-OPS1-DEMO" })}
                {field("name", "Your name", { placeholder: "Your full name" })}
                {field("email", "Email", { type: "email", placeholder: "you@company.com" })}
                {field("password", "Create a password (8+ characters)", { type: "password", placeholder: "••••••••" })}
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
              {busy ? "…" : mode === "worker" ? "JOIN / LOG IN" : mode === "supervisor" ? "LOG IN" : mode === "solo" ? "CREATE MY PORTAL" : mode === "demo" ? "EXPLORE THE DEMO →" : "CREATE COMPANY"}
            </button>

            {demoHost && (
              <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: MU }}>
                {mode === "demo" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => { setMode("supervisor"); setError(""); }}
                      style={{ background: "none", border: "none", color: AC, fontWeight: 800, fontSize: 12.5, cursor: "pointer", padding: 0 }}
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button
                      onClick={() => { setMode("demo"); setError(""); }}
                      style={{ background: "none", border: "none", color: AC, fontWeight: 800, fontSize: 12.5, cursor: "pointer", padding: 0 }}
                    >
                      Sign up for the demo
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        <p style={{ marginTop: 22, fontSize: 10.5, lineHeight: 1.65, color: MU, textAlign: "center" }}>
          We improve our products and advertising by using Microsoft Clarity to see how you use
          our website. By using our site, you agree that we and Microsoft can collect and use this
          data. Our{" "}
          <a href="/privacy.html" style={{ color: AC, textDecoration: "none" }}>privacy statement</a>{" "}
          has more details.
        </p>
      </div>
    </main>
  );
}

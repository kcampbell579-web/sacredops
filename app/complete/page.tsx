"use client";

// Post-payment company setup. Stripe redirects here after checkout. Fires the
// Subscribe / purchase / Google Ads conversions, then lets the buyer set up
// their company (using the email they paid with — the signup endpoint verifies
// the payment). On success it shows their Company Code + company URL and drops
// them into their dashboard, where they can invite their team.
import { useEffect, useState } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const PANEL = "rgba(255,255,255,0.05)";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

type Done = { joinCode: string; subdomain: string | null; companyName: string };

export default function Complete() {
  const [f, setF] = useState({ companyName: "", name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    document.title = "Payment confirmed — set up SacredOps";
    const w = window as unknown as { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };
    try { w.fbq?.("track", "Subscribe"); } catch {}
    try { w.gtag?.("event", "purchase", { transaction_id: "sub_" + Date.now(), currency: "USD" }); } catch {}
    try { w.gtag?.("event", "conversion", { send_to: "AW-18341083534/2lnpCPbf29UcEI7z2qlE" }); } catch {}

    // Stripe appends ?session_id={CHECKOUT_SESSION_ID} to this redirect. Use it
    // to prefill the email they paid with — the server re-verifies it on submit.
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (sid) {
      setSessionId(sid);
      fetch(`/api/checkout/session?session_id=${encodeURIComponent(sid)}`)
        .then((r) => r.json())
        .then((d) => { if (d?.email) setF((o) => (o.email ? o : { ...o, email: d.email })); })
        .catch(() => {});
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.companyName || !f.name || !f.email || !f.password) { setError("Please fill in every field."); return; }
    if (f.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.needsPayment
            ? "We couldn't find a paid subscription for that email. Use the exact email you paid with — or choose a plan first at sacredops.app/pricing."
            : data?.error || "Something went wrong. Please try again."
        );
        setBusy(false);
        return;
      }
      setDone({ joinCode: data.joinCode, subdomain: data.subdomain, companyName: data.user?.companyName || f.companyName });
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "13px 14px", background: PANEL,
    border: "1px solid " + HL, borderRadius: 11, fontSize: 15, color: TX, outline: "none", fontFamily: SANS,
  };
  const lab: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: AC, letterSpacing: 0.8, marginBottom: 6, display: "block", fontFamily: "ui-monospace, Menlo, monospace" };

  const Logo = (
    <svg viewBox="0 0 100 100" width={48} height={48} aria-hidden="true" style={{ filter: "drop-shadow(0 0 8px rgba(4,164,102,.5))" }}>
      <circle cx="50" cy="50" r="40" fill="none" stroke={AC} strokeWidth={4} />
      <g stroke={AC} strokeWidth={4} strokeLinecap="round"><line x1="50" y1="4" x2="50" y2="96" /><line x1="4" y1="50" x2="96" y2="50" /></g>
      <ellipse cx="50" cy="50" rx="30" ry="13" fill="none" stroke={AC} strokeWidth={3.4} transform="rotate(32 50 50)" />
      <ellipse cx="50" cy="50" rx="30" ry="13" fill="none" stroke={AC} strokeWidth={3.4} transform="rotate(-32 50 50)" />
      <circle cx="50" cy="50" r="6" fill="#eafff0" />
    </svg>
  );

  const wrap: React.CSSProperties = {
    minHeight: "100vh", background: "#0d0d0d", color: TX, fontFamily: SANS,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  };

  if (done) {
    const url = done.subdomain ? `${done.subdomain}.sacredops.app` : "demo.sacredops.app";
    return (
      <main style={wrap}>
        <div style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>{Logo}</div>
          <div style={{ width: 60, height: 60, borderRadius: 30, margin: "0 auto 18px", background: "rgba(4,164,102,0.14)", border: "2px solid " + AC, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke={AC} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 6" /></svg>
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 800, margin: "0 0 8px" }}>You&apos;re all set 🎉</h1>
          <p style={{ color: MU, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px" }}>
            <b style={{ color: TX }}>{done.companyName}</b> is live. Share the two things below with your crew and team.
          </p>

          <div style={{ background: PANEL, border: "1px solid " + HL, borderRadius: 14, padding: "18px 18px", marginBottom: 14, textAlign: "left" }}>
            <div style={lab}>YOUR COMPANY CODE</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1.5, color: AC, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 6 }}>{done.joinCode}</div>
            <div style={{ fontSize: 12.5, color: MU }}>Workers enter this on the login page to join — just their phone, no app store.</div>
          </div>

          <div style={{ background: PANEL, border: "1px solid " + HL, borderRadius: 14, padding: "18px 18px", marginBottom: 22, textAlign: "left" }}>
            <div style={lab}>YOUR COMPANY URL</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TX, marginBottom: 6, wordBreak: "break-all" }}>{url}</div>
            <div style={{ fontSize: 12.5, color: MU }}>Your team logs in here anytime.</div>
          </div>

          <a href="/admin" style={{ display: "block", background: AC, color: "#04231a", textDecoration: "none", borderRadius: 12, padding: "15px", fontSize: 14, fontWeight: 800, letterSpacing: 0.4 }}>
            GO TO YOUR ADMIN — INVITE YOUR TEAM →
          </a>
          <a href="/supervisor" style={{ display: "block", marginTop: 12, color: MU, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            Or open the Supervisor dashboard →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
          {Logo}
          <div style={{ fontSize: 12, fontWeight: 800, color: AC, letterSpacing: 1, fontFamily: "ui-monospace, Menlo, monospace" }}>PAYMENT CONFIRMED ✓</div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3, margin: "6px 0 6px" }}>Set up your company</h1>
        <p style={{ color: MU, fontSize: 14, lineHeight: 1.55, margin: "0 0 20px" }}>
          One quick step. Use the <b style={{ color: TX }}>same email you paid with</b> — that&apos;s how we match your subscription.
        </p>

        {error && (
          <div style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.5)", color: "#f0b3b1", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, marginBottom: 16 }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 13 }}><label style={lab}>COMPANY NAME</label><input style={inp} value={f.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Construction" autoComplete="organization" /></div>
          <div style={{ marginBottom: 13 }}><label style={lab}>YOUR NAME</label><input style={inp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" autoComplete="name" /></div>
          <div style={{ marginBottom: 13 }}><label style={lab}>EMAIL (THE ONE YOU PAID WITH)</label><input style={inp} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" autoComplete="email" /></div>
          <div style={{ marginBottom: 13 }}><label style={lab}>PHONE (OPTIONAL)</label><input style={inp} type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 555-5555" autoComplete="tel" /></div>
          <div style={{ marginBottom: 18 }}><label style={lab}>CREATE A PASSWORD</label><input style={inp} type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" /></div>
          <button type="submit" disabled={busy} style={{ width: "100%", background: AC, color: "#04231a", border: "none", borderRadius: 12, padding: "15px", fontSize: 14, fontWeight: 800, letterSpacing: 0.4, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Setting up…" : "CREATE MY COMPANY →"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12.5, color: MU, textAlign: "center" }}>
          Haven&apos;t paid yet? <a href="https://www.sacredops.app/pricing" style={{ color: AC, textDecoration: "none" }}>See plans →</a>
        </p>
      </div>
    </main>
  );
}

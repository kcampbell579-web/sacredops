"use client";

// Post-subscription completion / thank-you page. Point your Stripe Payment
// Links' "After payment -> Redirect" here (e.g. https://www.sacredops.app/complete).
// Fires the Meta Pixel 'Subscribe' conversion and a GA 'purchase' event.
// (The Meta Pixel base code loads in app/layout.tsx when NEXT_PUBLIC_FB_PIXEL_ID
// is set, so fbq is available here.)
import { useEffect } from "react";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export default function Complete() {
  useEffect(() => {
    document.title = "Subscription confirmed — SacredOps";
    try {
      const f = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
      if (f) f("track", "Subscribe");
    } catch {
      /* tracking must never break the page */
    }
    try {
      const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
      if (g) g("event", "purchase", { transaction_id: "sub_" + Date.now(), currency: "USD" });
    } catch {
      /* noop */
    }
  }, []);

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
        textAlign: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <svg viewBox="0 0 100 100" width={54} height={54} aria-hidden="true" style={{ filter: "drop-shadow(0 0 8px rgba(4,164,102,.5))" }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke={AC} strokeWidth={4} />
            <g stroke={AC} strokeWidth={4} strokeLinecap="round"><line x1="50" y1="4" x2="50" y2="96" /><line x1="4" y1="50" x2="96" y2="50" /></g>
            <ellipse cx="50" cy="50" rx="30" ry="13" fill="none" stroke={AC} strokeWidth={3.4} transform="rotate(32 50 50)" />
            <ellipse cx="50" cy="50" rx="30" ry="13" fill="none" stroke={AC} strokeWidth={3.4} transform="rotate(-32 50 50)" />
            <circle cx="50" cy="50" r="6" fill="#eafff0" />
          </svg>
        </div>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            margin: "0 auto 20px",
            background: "rgba(4,164,102,0.14)",
            border: "2px solid " + AC,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke={AC} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4L19 6" />
          </svg>
        </div>
        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.3, margin: "0 0 10px" }}>
          Subscription confirmed
        </h1>
        <p style={{ color: MU, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 26px" }}>
          Welcome to SacredOps — you&apos;re all set. One quick step: create your company account
          using the <b style={{ color: TX }}>same email</b> you paid with. You&apos;ll get your
          Company Code instantly to share with your crew.
        </p>
        <a
          href="https://demo.sacredops.app/login?mode=signup"
          style={{
            display: "block",
            background: AC,
            color: "#04231a",
            textDecoration: "none",
            borderRadius: 12,
            padding: "15px",
            fontSize: 13.5,
            fontWeight: 800,
            letterSpacing: 0.4,
          }}
        >
          CREATE YOUR ACCOUNT →
        </a>
        <p style={{ marginTop: 22, fontSize: 12.5, color: MU }}>
          Questions?{" "}
          <a href="mailto:support@sacredops.app" style={{ color: AC, textDecoration: "none" }}>
            support@sacredops.app
          </a>
        </p>
        <div style={{ marginTop: 18, fontSize: 11, color: MU, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: 1, borderTop: "1px solid " + HL, paddingTop: 16 }}>
          BUILD SAFER · WORK SMARTER
        </div>
      </div>
    </main>
  );
}

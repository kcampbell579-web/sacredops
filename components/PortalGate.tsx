"use client";

import { useEffect, useState } from "react";
import { hydrate, installWriteThrough } from "@/lib/portalSync";

// Blocks rendering of a portal until (1) the visitor is authenticated and
// (2) localStorage has been hydrated from the server for their company.
// Portals read localStorage synchronously in their useState initializers, so
// their element must not mount until both steps complete.
export default function PortalGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("CHECKING SESSION…");

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) Require a logged-in user; otherwise send to /login and come back.
      let user = null;
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        user = res.ok ? (await res.json()).user : null;
      } catch {
        user = null;
      }
      if (!user) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?next=${next}`;
        return;
      }

      // A cancelled / unpaid subscription locks the portal until it's
      // reactivated — never silently show the product to a lapsed account.
      if ((user as { active?: boolean }).active === false) {
        if (alive) setLocked(true);
        return;
      }

      // Expose the company's effective feature flags so the portals can hide
      // any module the company's plan doesn't include.
      (window as unknown as { __sacredFeatures?: Record<string, boolean> }).__sacredFeatures =
        (user as { features?: Record<string, boolean> }).features || {};

      // 2) Hydrate this company's data, then enable write-through.
      if (alive) setMessage("SYNCING SACREDOPS…");
      await hydrate();
      installWriteThrough();
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (locked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
          color: "#f4f7f5",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, color: "#8fa096", fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 10 }}>
            SUBSCRIPTION INACTIVE
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Your SacredOps subscription has ended</h1>
          <p style={{ color: "#8fa096", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px" }}>
            Your company&apos;s records are safe. Reactivate to get your crew back in.
          </p>
          <a
            href="https://www.sacredops.app/pricing"
            style={{ display: "block", background: "#04A466", color: "#04231a", textDecoration: "none", borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 800, letterSpacing: 0.4 }}
          >
            REACTIVATE →
          </a>
          <a
            href="mailto:Kelly@sacredops.app?subject=Reactivate%20SacredOps"
            style={{ display: "block", marginTop: 12, color: "#8fa096", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
          >
            Or email Kelly@sacredops.app
          </a>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
          color: "#8fa096",
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 12,
          letterSpacing: 1,
        }}
      >
        {message}
      </div>
    );
  }

  return <>{children}</>;
}

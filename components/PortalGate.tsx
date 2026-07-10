"use client";

import { useEffect, useState } from "react";
import { hydrate, installWriteThrough } from "@/lib/portalSync";

// Blocks rendering of a portal until (1) the visitor is authenticated and
// (2) localStorage has been hydrated from the server for their company.
// Portals read localStorage synchronously in their useState initializers, so
// their element must not mount until both steps complete.
export default function PortalGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
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

"use client";

import { useEffect, useState } from "react";
import { hydrate, installWriteThrough } from "@/lib/portalSync";

// Blocks rendering of a portal until localStorage has been hydrated from the
// server. Portals read localStorage synchronously in their useState
// initializers, so their element must not mount until hydration completes.
export default function PortalGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
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
        SYNCING SACREDOPS…
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

// Public, no-login interactive demo. Mounts the real Supervisor / Worker
// portal with every feature unlocked and NO server write-through (PortalGate
// is bypassed), so a prospect can tap through the actual product before they
// ever sign up. The portals self-seed from their SEED_* constants when
// localStorage is empty, so a first-time visitor lands on a populated demo.
//
// Embedded as an <iframe src="/try?role=supervisor"> inside the product
// landing pages (public/supervisors.html, public/crews.html). A floating
// "Start free →" chip funnels the visitor into the real demo signup.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SupervisorPortal = dynamic(() => import("@/components/SupervisorPortal"), {
  ssr: false,
  loading: () => null,
});
const WorkerPortal = dynamic(() => import("@/components/WorkerPortal"), {
  ssr: false,
  loading: () => null,
});

const AC = "#04A466";

export default function TryDemo() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<"supervisor" | "worker">("supervisor");
  // When true we're rendered inside an <iframe> on a landing page, so the CTA
  // must break out of the frame; standalone we can navigate normally.
  const [framed, setFramed] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRole(p.get("role") === "worker" ? "worker" : "supervisor");
    // Unlock every module for the demo (portals hide a module only when its
    // flag is explicitly false; an empty object shows everything).
    (window as unknown as { __sacredFeatures?: Record<string, boolean> }).__sacredFeatures = {};
    // Optional deep-link: /try?role=worker&screen=incident opens straight to
    // that screen (the Worker portal reads window.__startScreen on mount).
    const screen = p.get("screen");
    if (screen) {
      (window as unknown as { __startScreen?: { t: string } }).__startScreen = { t: screen };
    }
    try {
      setFramed(window.self !== window.top);
    } catch {
      setFramed(true); // cross-origin access throw => we're framed
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      {role === "worker" ? <WorkerPortal /> : <SupervisorPortal />}
      <a
        href="https://demo.sacredops.app/"
        target={framed ? "_blank" : "_self"}
        rel="noopener"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 14,
          transform: "translateX(-50%)",
          zIndex: 99999,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: AC,
          color: "#04231a",
          textDecoration: "none",
          borderRadius: 999,
          padding: "11px 18px",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          letterSpacing: 0.3,
          boxShadow: "0 10px 30px rgba(0,0,0,.5), 0 0 0 1px rgba(4,164,102,.5)",
          whiteSpace: "nowrap",
        }}
      >
        Start free — no card →
      </a>
    </>
  );
}

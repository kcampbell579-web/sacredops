"use client";

// /inspect/[id] — the landing page for the QR sticker on each machine
// (printed from Supervisor → Equipment Registry, encoding
// https://sacredops.app/inspect/<EQUIP id>).
//
// A worker scans the sticker with their phone camera and lands here. We
// remember which machine was scanned, then send them into the Worker portal,
// which opens the Heavy Equipment Daily Checklist pre-filled for that machine
// (see WorkerPortal's pending-scan handling). If they aren't logged in yet,
// PortalGate bounces them to /login?next=/worker and the login page returns
// them to /worker afterwards, so the scan survives the round-trip.
import { useEffect, useState } from "react";

// Same key the Worker portal reads on mount. Survives the login round-trip
// (same origin, same browser tab).
const SCAN_KEY = "sacredops_pending_scan";

export default function InspectPage() {
  const [msg, setMsg] = useState("OPENING INSPECTION…");

  useEffect(() => {
    // Read the id from the URL directly: Next 15 makes `params` a Promise and
    // this is a client page, so this is the simplest reliable source.
    const raw = window.location.pathname.split("/").filter(Boolean).pop() || "";
    const id = decodeURIComponent(raw).trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,32}$/.test(id)) {
      setMsg("That QR code isn't a SacredOps equipment sticker.");
      return;
    }
    try {
      sessionStorage.setItem(SCAN_KEY, JSON.stringify({ id, at: Date.now() }));
    } catch {}
    window.location.replace("/worker");
  }, []);

  return (
    <main
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
        padding: 24,
        textAlign: "center",
      }}
    >
      {msg}
    </main>
  );
}

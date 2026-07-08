"use client";

import dynamic from "next/dynamic";

// The Supervisor Portal is a client-only experience: it reads and writes
// browser localStorage during render, so we disable server-side rendering.
const SupervisorPortal = dynamic(
  () => import("@/components/SupervisorPortal"),
  {
    ssr: false,
    loading: () => (
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
        LOADING SACREDOPS…
      </div>
    ),
  }
);

export default function Page() {
  return <SupervisorPortal />;
}

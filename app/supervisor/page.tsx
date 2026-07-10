"use client";

import dynamic from "next/dynamic";
import PortalGate from "@/components/PortalGate";

const SupervisorPortal = dynamic(
  () => import("@/components/SupervisorPortal"),
  { ssr: false, loading: () => null }
);

export default function SupervisorPage() {
  return (
    <PortalGate>
      <SupervisorPortal />
    </PortalGate>
  );
}

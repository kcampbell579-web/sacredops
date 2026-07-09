"use client";

import dynamic from "next/dynamic";
import PortalGate from "@/components/PortalGate";

const WorkerPortal = dynamic(() => import("@/components/WorkerPortal"), {
  ssr: false,
  loading: () => null,
});

export default function WorkerPage() {
  return (
    <PortalGate>
      <WorkerPortal />
    </PortalGate>
  );
}

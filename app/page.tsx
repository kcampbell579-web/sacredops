import Link from "next/link";
import AccountBar from "@/components/AccountBar";

const AC = "#04A466";
const TX = "#F4F7F5";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const cardBase: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  borderRadius: 18,
  padding: "26px 24px",
  border: "1px solid " + HL,
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
  color: TX,
};

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={AC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Home() {
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
      }}
    >
      <div style={{ width: "100%", maxWidth: 430 }}>
        <AccountBar />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="SacredOps"
            width={36}
            height={36}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.55)",
              display: "block",
            }}
          />
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.4 }}>
            Sacred<span style={{ color: AC }}>Ops</span>
          </div>
        </div>
        <p style={{ color: MU, fontSize: 13, margin: "0 0 26px", lineHeight: 1.5 }}>
          All-in-one construction operations. Choose your portal to continue.
        </p>

        <Link href="/supervisor" style={{ ...cardBase, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: AC, letterSpacing: 1.5, fontFamily: MONO, marginBottom: 6 }}>
                SUPERVISOR
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Supervisor Portal</div>
              <div style={{ fontSize: 12.5, color: MU, marginTop: 4 }}>
                Projects, sign-ins, inspections, schedule & forms
              </div>
            </div>
            <Arrow />
          </div>
        </Link>

        <Link href="/worker" style={cardBase}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: AC, letterSpacing: 1.5, fontFamily: MONO, marginBottom: 6 }}>
                WORKER
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Worker Portal</div>
              <div style={{ fontSize: 12.5, color: MU, marginTop: 4 }}>
                Home, schedule, alerts & your profile
              </div>
            </div>
            <Arrow />
          </div>
        </Link>

        <Link
          href="/reports"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
            textDecoration: "none",
            color: MU,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: MONO,
            letterSpacing: 0.5,
            border: "1px solid " + HL,
            borderRadius: 12,
            padding: "12px",
          }}
        >
          <span style={{ color: AC }}>▚</span> VIEW REPORTS DASHBOARD
        </Link>

        <div style={{ marginTop: 20, fontSize: 11, color: MU, fontFamily: MONO, letterSpacing: 0.3, textAlign: "center" }}>
          Data syncs securely across devices
        </div>
      </div>
    </main>
  );
}

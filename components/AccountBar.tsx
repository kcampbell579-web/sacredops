"use client";

import { useEffect, useState } from "react";

const AC = "#04A466";
const MU = "#8FA096";
const HL = "rgba(255,255,255,0.08)";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

type Me = { name: string; role: string; companyName: string } | null;

// Shows the signed-in company + a log-out control, or a log-in link.
// Also the place a not-signed-in visitor can get to the login screen.
export default function AccountBar() {
  const [me, setMe] = useState<Me | undefined>(undefined); // undefined = loading

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        setMe(res.ok ? (await res.json()).user : null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
    minHeight: 24,
    fontFamily: MONO,
    fontSize: 11,
  };

  if (me === undefined) return <div style={base} />;

  if (!me) {
    return (
      <div style={base}>
        <span style={{ color: MU }} />
        <a href="/login" style={{ color: AC, textDecoration: "none", fontWeight: 700 }}>
          Log in →
        </a>
      </div>
    );
  }

  return (
    <div style={base}>
      <span style={{ color: MU, letterSpacing: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <span style={{ color: AC }}>●</span> {me.companyName} · {me.name}
      </span>
      <button
        onClick={logout}
        style={{
          background: "transparent",
          border: "1px solid " + HL,
          color: MU,
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 10.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: MONO,
          whiteSpace: "nowrap",
        }}
      >
        Log out
      </button>
    </div>
  );
}

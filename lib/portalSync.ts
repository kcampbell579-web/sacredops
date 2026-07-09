"use client";

// Client-side sync layer that backs the portals' localStorage with the
// server (Postgres via /api/state). Both the Supervisor and Worker portals
// read/write localStorage synchronously under the "sacredops_" prefix; this
// module hydrates those keys from the server before a portal mounts and
// write-throughs every subsequent change back to the server.

const PREFIX = "sacredops_";

let writeThroughInstalled = false;
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

async function putState(key: string, rawValue: string): Promise<void> {
  try {
    await fetch(`/api/state/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: rawValue,
      keepalive: true,
    });
  } catch {
    // Offline / transient failure: localStorage still holds the value, and it
    // will be pushed up on the next hydrate() reconciliation.
  }
}

function schedulePut(key: string, rawValue: string): void {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
    void putState(key, rawValue);
  }, 400);
}

// Hydrate localStorage from the server, then reconcile local-only keys up to
// the server. Must run and complete BEFORE a portal component mounts, because
// portals read localStorage inside their useState initializers.
export async function hydrate(): Promise<void> {
  if (typeof window === "undefined") return;
  const ls = window.localStorage;

  let server: Record<string, unknown> = {};
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) server = await res.json();
  } catch {
    // No server available: fall back to whatever is already in localStorage.
    return;
  }

  const serverKeys = new Set(Object.keys(server));

  // Write server values down into localStorage (server is the shared source
  // of truth across devices). Use the raw setItem so this does not re-trigger
  // a write-through PUT.
  for (const [key, value] of Object.entries(server)) {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    try {
      ls.setItem(key, raw);
    } catch {
      /* ignore quota errors */
    }
  }

  // Push any local-only sacredops_ keys up to the server (first-run seeding
  // from a device that already had local data).
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (key && key.startsWith(PREFIX) && !serverKeys.has(key)) {
      const raw = ls.getItem(key);
      if (raw != null) void putState(key, raw);
    }
  }
}

// Intercept localStorage.setItem so every write to a sacredops_ key is mirrored
// to the server. Install AFTER hydrate() so hydration's down-writes are silent.
export function installWriteThrough(): void {
  if (writeThroughInstalled || typeof window === "undefined") return;
  writeThroughInstalled = true;

  const ls = window.localStorage;
  const original = ls.setItem.bind(ls);

  ls.setItem = function (key: string, value: string) {
    original(key, value);
    if (typeof key === "string" && key.startsWith(PREFIX)) {
      schedulePut(key, value);
    }
  };
}

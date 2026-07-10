"use client";

// Client-side sync layer that backs the portals' localStorage with the
// server (Postgres via /api/state). Both the Supervisor and Worker portals
// read/write localStorage synchronously under the "sacredops_" prefix; this
// module hydrates those keys from the server before a portal mounts and
// write-throughs every subsequent change back to the server.

const PREFIX = "sacredops_";

// Capture the native, unpatched setItem once at module load (before
// installWriteThrough() can replace it) so hydrate()'s down-writes never
// re-trigger a write-through PUT — even on a second mount after the patch is
// installed (e.g. navigating between /supervisor and /worker).
const nativeSetItem =
  typeof window !== "undefined"
    ? window.localStorage.setItem.bind(window.localStorage)
    : undefined;

let writeThroughInstalled = false;
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
// Latest not-yet-sent value per key, so a pending debounced write can be
// flushed immediately when the page is being hidden/unloaded.
const pendingValues: Record<string, string> = {};

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
  pendingValues[key] = rawValue;
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
    const v = pendingValues[key];
    delete pendingValues[key];
    if (v !== undefined) void putState(key, v);
  }, 400);
}

// Send every pending debounced write immediately (fetch keepalive lets these
// complete during unload). Called on pagehide / tab-hidden so a form submitted
// then closed within the debounce window is not lost.
function flushPending(): void {
  for (const key of Object.keys(pendingValues)) {
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);
      delete debounceTimers[key];
    }
    const v = pendingValues[key];
    delete pendingValues[key];
    if (v !== undefined) void putState(key, v);
  }
}

// Hydrate localStorage from the server, then reconcile local-only keys up to
// the server. Must run and complete BEFORE a portal component mounts, because
// portals read localStorage inside their useState initializers.
export async function hydrate(): Promise<void> {
  if (typeof window === "undefined") return;
  const ls = window.localStorage;

  let server: Record<string, unknown> = {};
  // Time-box the hydrate fetch so a hung connection can't leave the portal
  // stuck on the "SYNCING…" gate forever — fall back to cached localStorage.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("/api/state", { cache: "no-store", signal: controller.signal });
    if (res.ok) server = await res.json();
  } catch {
    // No server available / timed out: fall back to whatever is in localStorage.
    return;
  } finally {
    clearTimeout(timer);
  }

  const serverKeys = new Set(Object.keys(server));

  // Write server values down into localStorage (server is the shared source
  // of truth across devices). Use the native setItem captured at module load
  // so this does not re-trigger a write-through PUT once the patch is installed.
  for (const [key, value] of Object.entries(server)) {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    try {
      (nativeSetItem ?? ls.setItem.bind(ls))(key, raw);
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

  // Drain pending writes before the page goes away.
  window.addEventListener("pagehide", flushPending);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPending();
  });
}

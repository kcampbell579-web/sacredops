/*
 * SacredOps service worker.
 *
 * Deliberately minimal and NETWORK-FIRST: it exists so the site qualifies as an
 * installable PWA (a fetch handler is required) and so store wrappers like
 * PWABuilder / TWA see a registered worker — WITHOUT caching app HTML/JS, which
 * would risk serving a stale build after a deploy. A tiny offline fallback is
 * cached for navigations so a dropped connection shows a friendly page instead
 * of the browser error.
 */
const OFFLINE_URL = "/offline.html";
const CACHE = "sacredops-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Network-first for page navigations; fall back to the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  // Everything else: straight to network (no stale caching of app assets).
});

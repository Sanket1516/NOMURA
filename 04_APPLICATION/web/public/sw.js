// VAAKYA service worker. Caches the app shell and static assets, plus the PUBLIC lesson pages the person chose to save.
// Personal API responses and signed-in pages are never cached (FRONTEND_ARCHITECTURE §9, R1). Lesson pages (/lessons...) are built
// from a public, no-login API and contain no name, progress or session data; they are stored only after the person presses "Save lessons for offline".
const CACHE = "vaakya-shell-v1";
const LESSONS = "vaakya-lessons-v1";   // same name as components/layout/save-offline.tsx
const SHELL = ["/offline", "/icons/icon.svg", "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== LESSONS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  if (req.mode === "navigate" && (url.pathname === "/lessons" || url.pathname.startsWith("/lessons/"))) {
    // Network first; if there is no connection, the saved copy (only exists if the person saved it), else the offline page.
    e.respondWith(fetch(req).catch(() => caches.open(LESSONS).then((c) => c.match(url.pathname)).then((hit) => hit || caches.match("/offline"))));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
  }
});

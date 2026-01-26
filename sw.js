const CACHE = "notes-v1.3";

const SHELL = [
  "/Notes/",
  "/Notes/index.html",
  "/Notes/manifest.webmanifest",
  "/Notes/icon-192.png",
  "/Notes/icon-512.png",
  "/Notes/sw.js"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Navigation requests: network-first, offline fallback to shell
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("/Notes/"))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

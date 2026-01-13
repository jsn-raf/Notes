const CACHE = "notes-v3";
const SHELL = [
  "/Notes/",
  "/Notes/manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Network-first for page loads so index.html stays fresh after redeploys
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const cache = await caches.open(CACHE);
        cache.put("/Notes/", fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = await caches.match("/Notes/");
        return cached || Response.error();
      }
    })());
    return;
  }

  // Cache-first for same-origin GET assets
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    const res = await fetch(req);
    try {
      const url = new URL(req.url);
      if (req.method === "GET" && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(() => {});
      }
    } catch (_) {}
    return res;
  })());
});

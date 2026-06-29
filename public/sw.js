// HakeemCare PWA service worker — offline navigation support.
// - Assets & RSC payloads: stale-while-revalidate (served from cache offline).
// - Page navigations: network-first, fall back to a cached page when offline.
const CACHE = "hakeemcare-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase / cross-origin

  // Page navigations: try network, fall back to any cached page so the SPA
  // can boot offline and client-render from the local (RxDB) database.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match("/dashboard")) ||
            (await cache.match("/")) ||
            new Response("You are offline.", { headers: { "Content-Type": "text/plain" } })
          );
        })
    );
    return;
  }

  // Everything else (JS/CSS chunks, RSC prefetch payloads, images):
  // serve from cache instantly, refresh in the background.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          cache.put(request, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

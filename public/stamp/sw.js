const OFFLINE_URL = "/stamp/offline.html";
const CACHE_NAME = "stamp-shell-v4";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("stamp-shell-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.mode !== "navigate" || request.method !== "GET" ||
      url.origin !== self.location.origin || !["/stamp", "/stamp/"].includes(url.pathname)) return;

  // Next.js documents and chunks must come from the same build. Only the
  // standalone offline page is eligible for a Cache Storage response.
  event.respondWith((async () => {
    try {
      return await fetch(request, { cache: "no-cache" });
    } catch {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
  })());
});

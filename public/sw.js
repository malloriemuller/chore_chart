const SHELL_CACHE = "chore-board-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Data always comes from the network: never intercept API calls.
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;

  // App shell (pages, static assets, icons): stale-while-revalidate, so it still loads offline
  // after the first visit, while staying fresh whenever the network is available.
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cachedResponse);
      return cachedResponse || networkFetch;
    }),
  );
});

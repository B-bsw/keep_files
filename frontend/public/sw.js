const CACHE_NAME = "keep-files-v3";
const STATIC_ASSETS = ["/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.hostname !== self.location.hostname) return;

  // Network-first for API calls and HTML navigation — let the server handle routing
  if (
    url.pathname.startsWith("/api/") ||
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache Next.js JS/CSS chunks — they have hashed names, browser HTTP cache handles them
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first only for public static assets (icons, manifest)
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
    )
  );
});

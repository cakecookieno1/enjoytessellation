const CACHE_NAME = "tessellation-playground-v20260620-new-icon-v2";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260620-share-success-v2",
  "./app.js?v=20260620-share-success-v2",
  "./geometry-core.js?v=20260620-share-success-v2",
  "./firebase-client.js?v=20260620-firebase",
  "./manifest.webmanifest",
  "./assets/icons/favicon.ico?v=20260620-new-icon-v2",
  "./assets/icons/favicon-32.png?v=20260620-new-icon-v2",
  "./assets/icons/icon-180.png?v=20260620-new-icon-v2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/fonts/A2Z-Regular.woff2",
  "./assets/fonts/A2Z-Medium.woff2",
  "./assets/fonts/A2Z-SemiBold.woff2",
  "./assets/fonts/A2Z-Bold.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.includes("/api/")) return;
  if (url.pathname.endsWith("/cloud-config.js")) return;

  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === "opaque") {
              return response;
            }
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => {
            if (request.mode === "navigate") return caches.match("./index.html");
            return caches.match("./");
          });
      })
  );
});

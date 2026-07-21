const CACHE_NAME = "rfm-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./ui.js",
  "./quiz.js",
  "./adaptive.js",
  "./storage.js",
  "./sync.js",
  "./firebase-config.js",
  "./i18n.js",
  "./styles/main.css",
  "./texts/pt.json",
  "./texts/en.json",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((err) => console.warn("Cache error:", err))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (e.request.method !== "GET") {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

const CACHE_NAME = "teachers-hub-v12";
const APP_SHELL = [
  "/",
  "/index.html",
  "/admin.html",
  "/auth.html",
  "/auth.css?v=1",
  "/admin.css?v=1",
  "/styles.css?v=11",
  "/upgrade.css?v=2",
  "/config.js?v=2",
  "/app.js?v=6",
  "/assets/public-content.js?v=1",
  "/assets/admin.js?v=2",
  "/assets/auth.js?v=3",
  "/assets/auth-guard.js?v=2",
  "/upgrade.js?v=2",
  "/faq.js?v=3",
  "/teachers-hub-round-logo.png",
  "/hero-itqshhb.webp?v=7",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
  // Firebase Authentication serves its redirect helper under this reserved path.
  if (requestUrl.pathname.startsWith("/__/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request, { cache: "no-store" }).then((response) => {
      if (response.ok) {
        const fallbackPath = requestUrl.pathname === "/admin.html"
          ? "/admin.html"
          : requestUrl.pathname === "/auth.html" ? "/auth.html" : "/index.html";
        caches.open(CACHE_NAME).then((cache) => cache.put(fallbackPath, response.clone()));
      }
      return response;
    }).catch(() => {
      const fallbackPath = requestUrl.pathname === "/admin.html"
        ? "/admin.html"
        : requestUrl.pathname === "/auth.html" ? "/auth.html" : "/index.html";
      return caches.match(fallbackPath);
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});


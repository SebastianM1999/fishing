// Hand-written service worker: precache the app shell, cache-first for precached same-origin GETs.
const CACHE = "driftwood-cove-v3";
const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/vendor/three/three.module.js",
  "/vendor/three/three.core.js",
  "/js/main.js",
  "/js/game/content.js",
  "/js/game/rng.js",
  "/js/game/state.js",
  "/js/game/time.js",
  "/js/game/world.js",
  "/js/game/fishing.js",
  "/js/game/economy.js",
  "/js/input/input.js",
  "/js/ui/ui.js",
  "/js/ui/fishArt.js",
  "/js/render/scene.js",
  "/js/render/kit.js",
  "/js/render/models.js",
  "/js/render/environment.js",
  "/js/render/textures.js",
  "/js/persistence/save.js",
];

self.addEventListener("install", event =>
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE))));

self.addEventListener("activate", event =>
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;
  // Navigations (e.g. "/?debug") are answered with the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(caches.match("/index.html").then(cached => cached ?? fetch(request)));
    return;
  }
  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith(caches.match(url.pathname).then(cached => cached ?? fetch(request)));
});

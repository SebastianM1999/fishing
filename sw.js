// Hand-written service worker: precache the app shell, cache-first for precached same-origin GETs.
const CACHE = "driftwood-cove-v18";
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
  "/js/game/weather.js",
  "/js/game/economy.js",
  "/js/game/skills.js",
  "/js/game/orders.js",
  "/js/input/input.js",
  "/js/ui/ui.js",
  "/js/ui/fishArt.js",
  "/js/ui/icons.js",
  "/js/audio/audio.js",
  "/assets/music/cozy-farming-village.mp3",
  "/assets/music/sunlit-turnip-path.mp3",
  "/assets/music/sunlit-turnip-path-2.mp3",
  "/assets/music/cedar-hearth-loop.mp3",
  "/assets/music/cedar-hearth-loop-2.mp3",
  "/assets/music/glowspore-cavern.mp3",
  "/assets/music/glowspore-cavern-2.mp3",
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
  const range = request.headers.get("range");
  event.respondWith(caches.match(url.pathname).then(cached => {
    if (!cached) return fetch(request);
    return range ? partial(cached, range) : cached;
  }));
});

// Media elements ask for byte ranges (music); answer them from the cached file with a 206.
async function partial(response, range) {
  const buf = await response.arrayBuffer();
  const [, from, to] = /bytes=(\d*)-(\d*)/.exec(range) ?? [];
  const start = from ? Number(from) : Math.max(0, buf.byteLength - Number(to));
  const end = from && to ? Math.min(Number(to), buf.byteLength - 1) : buf.byteLength - 1;
  if (!(start <= end)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${buf.byteLength}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

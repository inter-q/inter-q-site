// IQ Kit — keeps a copy of the toolkit page so the app opens offline.
// Network first for the page itself, so a new upload to GitHub shows up the next time the app opens online.
// Live feeds and lookups (weather, news, maps, AI sites) always go straight to the network and are never stored.
const CACHE = "iqkit-v4";
const CORE = ["./", "./index.html", "./manifest.json",
  "./iqkit-32.png", "./iqkit-48.png", "./iqkit-180.png", "./iqkit-apple-512.png", "./iqkit-192.png", "./iqkit-512.png", "./iqkit-maskable-512.png"];
const QR = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    try { await c.add(new Request(QR, { mode: "no-cors" })); } catch (_) {}   // QR tool offline, if reachable now
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("iqkit-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const same = u.origin === self.location.origin;
  if (same && (r.cache === "no-store" || u.searchParams.has("iqcheck"))) return;   // "Check for update" always goes to GitHub
  if (r.mode === "navigate" && same) {
    e.respondWith((async () => {
      try {
        const res = await fetch(r, { cache: "no-cache" });   // always ask GitHub for the newest page (quick if unchanged)
        if (res && res.ok) { const c = await caches.open(CACHE); await c.put("./index.html", res.clone()); }
        return res;
      } catch (_) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }
  if (same || r.url === QR) {
    e.respondWith((async () => {
      const hit = await caches.match(r, { ignoreSearch: same });
      const net = fetch(r).then(async (res) => {
        if (res && (res.ok || res.type === "opaque")) { const c = await caches.open(CACHE); await c.put(r, res.clone()); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
  }
});

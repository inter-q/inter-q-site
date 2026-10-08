// IQ Kit — keeps a copy of the toolkit page so the app opens offline.
// Network first for the page itself, so a new upload to GitHub shows up the next time the app opens online.
// Live feeds and lookups (weather, news, maps, AI sites) always go straight to the network and are never stored.
// Bump CACHE whenever a file in CORE changes, so installed apps pick up the new copy.
const CACHE = "iqkit-v6";
const CORE = ["./index.html",   // the page is downloaded once and saved as index.html
  "./manifest.json", "./qrcode.min.js",
  "./iqkit-32.png", "./iqkit-48.png", "./iqkit-180.png", "./iqkit-apple-512.png", "./iqkit-192.png", "./iqkit-512.png", "./iqkit-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("iqkit-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// The app page is /tools/ (or /tools/index.html). Only that page may replace the saved offline copy —
// opening an icon, the manifest or this file in a tab must not overwrite it.
const isAppPage = (u) => /\/(index\.html)?$/.test(u.pathname) && u.pathname.startsWith(new URL("./", self.location).pathname);
const isHtml = (res) => (res.headers.get("content-type") || "").includes("text/html");
// Saved files are keyed without ?query, so "icon.png?v=2" and "icon.png" share one entry (bump CACHE to refresh them).
const keyOf = (u) => { const k = new URL(u.href); k.search = ""; k.hash = ""; return k.href; };

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;   // feeds, maps, AI sites: straight to the network, never stored
  if (r.cache === "no-store" || u.searchParams.has("iqcheck")) return;   // "Check for update" always goes to GitHub
  if (r.mode === "navigate") {
    // Ask GitHub for the newest page, but on a slow signal don't keep the screen blank: after 3 seconds
    // open the saved copy. The download keeps going in the background so the next open is up to date.
    const net = fetch(r, { cache: "no-cache" }).then(async (res) => {
      if (res && res.ok && isAppPage(u) && isHtml(res)) { const c = await caches.open(CACHE); await c.put("./index.html", res.clone()); }
      return res;
    });
    e.waitUntil(net.then(() => {}, () => {}));
    e.respondWith((async () => {
      const saved = isAppPage(u) ? ((await caches.match("./index.html")) || (await caches.match("./"))) : null;
      if (!saved) { try { return await net; } catch (_) { return Response.error(); } }
      const slow = new Promise((res) => setTimeout(() => res(saved), 3000));
      try { return await Promise.race([net, slow]); } catch (_) { return saved; }
    })());
    return;
  }
  const key = keyOf(u);
  const net = fetch(r).then(async (res) => {
    if (res && res.ok) { const c = await caches.open(CACHE); await c.put(key, res.clone()); }
    return res;
  });
  e.waitUntil(net.then(() => {}, () => {}));   // let the background refresh finish
  e.respondWith((async () => (await caches.match(key)) || net)());
});

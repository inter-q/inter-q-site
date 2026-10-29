// TOOLS — keeps a copy of the toolkit page so the app opens offline.
// The page opens straight from the saved copy (fast on phones and on a weak signal); the newest page is downloaded in the
// background, and the open page is told when a new build has arrived so it can offer a reload.
// Live feeds and lookups (weather, news, maps, AI sites) always go straight to the network and are never stored.
// Bump CACHE whenever a file in CORE changes, so installed apps pick up the new copy.
const CACHE = "iqkit-v23";
const CORE = ["./index.html",   // the page is downloaded once and saved as index.html
  "./manifest.json", "./qrcode.min.js", "../prompt.js", "./pdf-lib.min.js", "./csg-form-10.pdf", "./dd-form-2977.pdf",   // CSG Request for Orders and Risk Assessment fill these offline
  "./iqkit-32.png", "./iqkit-48.png", "./iqkit-home-180.png", "./iqkit-home-512.png", "./iqkit-app-192.png", "./iqkit-app-512.png", "./iqkit-app-maskable-512.png"];

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
    const app = isAppPage(u), fresh = u.searchParams.has("iqfresh");   // ?iqfresh: "Check for update" / "Reload" asks for the newest page now
    const buildOf = (t) => (String(t).match(/<meta name="iq-build" content="([^"]*)"/) || [])[1] || "";
    const net = fetch(r, { cache: "no-cache" }).then(async (res) => {
      if (res && res.ok && app && isHtml(res)) {
        const c = await caches.open(CACHE), old = await c.match("./index.html");
        const oldB = old ? buildOf(await old.text()) : "", newB = buildOf(await res.clone().text());
        await c.put("./index.html", res.clone());
        if (old && newB && newB !== oldB) (await self.clients.matchAll({ type: "window" })).forEach((cl) => cl.postMessage({ type: "iq-update", build: newB }));
      }
      return res;
    });
    e.waitUntil(net.then(() => {}, () => {}));
    e.respondWith((async () => {
      const saved = app && !fresh ? ((await caches.match("./index.html")) || (await caches.match("./"))) : null;
      if (saved) return saved;   // instant open; the download above keeps the saved copy up to date
      try { return await net; } catch (_) { const s = app ? await caches.match("./index.html") : null; return s || Response.error(); }
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

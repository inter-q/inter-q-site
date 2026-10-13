// LOGSTAT — keeps a copy of the app so it opens offline. Same design as IQ Kit's tools/sw.js.
// Network first for the page itself, so a new upload to GitHub shows up the next time the app opens online.
// The app makes no other network requests: nothing is sent anywhere.
// Bump CACHE whenever a file in CORE other than index.html changes, so installed apps pick up the new copy.
const CACHE = "logstat-v2";
const CORE = ["./index.html",   // the page is downloaded once and saved as index.html
  "./manifest.json", "./qrcode.min.js",
  "./logstat-32.png", "./logstat-48.png", "./logstat-180.png", "./logstat-apple-512.png", "./logstat-192.png", "./logstat-512.png", "./logstat-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("logstat-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// The app page is /logstat/ or /logstat/index.html — exactly. /logstat/install/ is a separate forwarding page and must
// never replace the saved app.
const SCOPE = new URL("./", self.location).pathname;
const isAppPage = (u) => u.pathname === SCOPE || u.pathname === SCOPE + "index.html";
const isHtml = (res) => (res.headers.get("content-type") || "").includes("text/html");
const keyOf = (u) => { const k = new URL(u.href); k.search = ""; k.hash = ""; return k.href; };

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.cache === "no-store" || u.searchParams.has("lscheck")) return;   // "Check for update" always goes to GitHub
  if (r.mode === "navigate") {
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
    if (res && res.ok && CORE.some((p) => key === new URL(p, self.location).href)) { const c = await caches.open(CACHE); await c.put(key, res.clone()); }
    return res;
  });
  e.waitUntil(net.then(() => {}, () => {}));
  e.respondWith((async () => (await caches.match(key)) || net)());
});

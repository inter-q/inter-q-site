// REMOVE — keeps a copy of the app so it opens instantly and offline.
// The saved copy opens right away; a fresh copy is fetched in the background, and if it's a newer build the app
// shows "A new version is ready" with a Reload button. The app makes no other network requests: your progress is never sent anywhere.
// Bump CACHE whenever a file in CORE other than index.html changes, so installed apps pick up the new copy.
const CACHE = "iqremove-v2";
const CORE = ["./index.html",   // the page is downloaded once and saved as index.html
  "./manifest.json", "./iqr.svg", "../prompt.js",
  "./iqr-32.png", "./iqr-48.png", "./iqr-180.png", "./iqr-192.png", "./iqr-512.png", "./iqr-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })));   // straight from the site, not a stale browser copy
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("iqremove-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// The app page is /remove/ or /remove/index.html — exactly. /remove/install/ is a separate forwarding page and must
// never replace the saved app.
const SCOPE = new URL("./", self.location).pathname;
const isAppPage = (u) => u.pathname === SCOPE || u.pathname === SCOPE + "index.html";
const isHtml = (res) => (res.headers.get("content-type") || "").includes("text/html");
const keyOf = (u) => { const k = new URL(u.href); k.search = ""; k.hash = ""; return k.href; };
const buildOf = (t) => { const m = /<meta name="iqr-build" content="([^"]*)"/.exec(t || ""); return m ? m[1] : ""; };

async function refreshPage() {
  try {
    const res = await fetch("./index.html", { cache: "no-cache" });
    if (!res || !res.ok || !isHtml(res)) return;
    const text = await res.clone().text();
    const c = await caches.open(CACHE);
    const old = await c.match("./index.html");
    const oldBuild = old ? buildOf(await old.text()) : "";
    const newBuild = buildOf(text);
    if (!newBuild || newBuild === oldBuild) return;
    await c.put("./index.html", new Response(text, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
    if (oldBuild) for (const cl of await self.clients.matchAll({ type: "window" })) cl.postMessage({ type: "iqr-updated", build: newBuild });
  } catch (_) { /* offline: keep the saved copy */ }
}

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.cache === "no-store" || u.searchParams.has("iqrcheck")) return;   // "Check for update" always asks the site
  if (r.mode === "navigate") {
    if (!isAppPage(u)) return;   // install page and anything else: straight to the network
    e.respondWith((async () => {
      const saved = await (await caches.open(CACHE)).match("./index.html");
      if (saved) { e.waitUntil(refreshPage()); return saved; }
      try {
        const res = await fetch(r);
        if (res && res.ok && isHtml(res)) { const c = await caches.open(CACHE); await c.put("./index.html", res.clone()); }
        return res;
      } catch (_) { return Response.error(); }
    })());
    return;
  }
  const key = keyOf(u);
  if (!CORE.some((p) => key === new URL(p, self.location).href)) return;
  e.respondWith((async () => {
    const hit = await (await caches.open(CACHE)).match(key);
    const net = fetch(r, { cache: "no-cache" }).then(async (res) => {
      if (res && res.ok) { const c = await caches.open(CACHE); await c.put(key, res.clone()); }
      return res;
    });
    if (hit) { e.waitUntil(net.then(() => {}, () => {})); return hit; }
    return net;
  })());
});

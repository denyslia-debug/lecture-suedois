/* Service worker — Svenska Läsaren (PWA).
   Cache-first for the app shell and data/*.json, network fallback.
   Bump VERSION whenever index.html or the data files change: old caches are deleted on activate. */
"use strict";

const VERSION = "lecture-v1";
const SHELL_CACHE = VERSION + "-shell";
const FONT_CACHE = VERSION + "-fonts";

const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];
const DATA = [
  "data/catalog.json",
  "data/a1.json", "data/a2.json",
  "data/b1.json", "data/b2.json",
  "data/c1.json", "data/c2.json",
];
// Google Fonts stylesheet already referenced by index.html (best effort; the app has local fallbacks).
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Schibsted+Grotesk:wght@400..900&display=swap";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/** Only complete, successful responses are ever stored. */
function cacheable(res) {
  return !!res && res.status === 200 && (res.type === "basic" || res.type === "cors" || res.type === "default");
}

async function putSafe(cacheName, req, res) {
  try {
    if (!cacheable(res)) return;
    const c = await caches.open(cacheName);
    await c.put(req, res);
  } catch { /* quota or storage blocked: ignore */ }
}

async function precache(cacheName, urls, required) {
  const c = await caches.open(cacheName);
  await Promise.all(urls.map(async (u) => {
    try {
      const res = await fetch(new Request(u, { cache: "reload" }));
      if (!cacheable(res)) throw new Error("HTTP " + res.status + " " + u);
      await c.put(u, res);
    } catch (e) {
      if (required) throw e; // shell must be complete, otherwise the install is retried later
    }
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      await precache(SHELL_CACHE, SHELL, true);
      await precache(SHELL_CACHE, DATA, false);
      try {
        const res = await fetch(new Request(FONT_CSS, { mode: "cors", credentials: "omit" }));
        await putSafe(FONT_CACHE, FONT_CSS, res);
      } catch { /* offline or blocked: fonts fall back to system fonts */ }
      await self.skipWaiting();
    } catch (e) {
      // Re-throw so the browser discards this install and keeps the previous worker.
      throw e;
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("lecture-") && !k.startsWith(VERSION + "-")).map((k) => caches.delete(k)));
    } catch { /* ignore */ }
    try { await self.clients.claim(); } catch { /* ignore */ }
  })());
});

/** Cache first; on a hit, refresh the copy in the background (same origin only). */
async function cacheFirst(event, req, cacheName, matchOpts) {
  let hit = null;
  try { hit = await caches.match(req, matchOpts); } catch { hit = null; }
  const network = (async () => {
    try {
      const res = await fetch(req);
      await putSafe(cacheName, req, res.clone());
      return res;
    } catch { return null; }
  })();
  if (hit) {
    event.waitUntil(network.then(() => undefined, () => undefined));
    return hit;
  }
  const res = await network;
  return res || offlineResponse(req);
}

function offlineResponse(req) {
  const isJson = /\.json(\?|$)/.test(new URL(req.url).pathname);
  return new Response(isJson ? '{"error":"offline"}' : "Hors ligne", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": isJson ? "application/json" : "text/plain; charset=utf-8" },
  });
}

async function handleNavigation(event) {
  try {
    const shell = (await caches.match("index.html")) || (await caches.match("./"));
    if (shell) {
      event.waitUntil((async () => {
        try { const res = await fetch("index.html", { cache: "no-cache" }); await putSafe(SHELL_CACHE, "index.html", res); } catch { /* offline */ }
      })());
      return shell;
    }
  } catch { /* fall through */ }
  try { return await fetch(event.request); } catch { return offlineResponse(event.request); }
}

async function handleFont(event, req) {
  // The page requests the stylesheet in no-cors mode (opaque, status 0): re-fetch it with CORS so it can be cached.
  const isCss = new URL(req.url).hostname === "fonts.googleapis.com";
  const key = req.url;
  try {
    const hit = await caches.match(key);
    if (hit) return hit;
  } catch { /* ignore */ }
  try {
    const res = await fetch(isCss ? new Request(key, { mode: "cors", credentials: "omit" }) : req);
    await putSafe(FONT_CACHE, key, res.clone());
    return res;
  } catch {
    try { return await fetch(req); } catch { return new Response("", { status: 503, statusText: "Offline" }); }
  }
}

self.addEventListener("fetch", (event) => {
  try {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);

    if (FONT_HOSTS.includes(url.hostname)) {
      event.respondWith(handleFont(event, req));
      return;
    }
    if (url.origin !== self.location.origin) return; // anything else external: browser default

    const scope = new URL(self.registration.scope);
    if (!url.pathname.startsWith(scope.pathname)) return;

    if (req.mode === "navigate") {
      event.respondWith(handleNavigation(event));
      return;
    }
    const rel = url.pathname.slice(scope.pathname.length);
    if (/^data\/[a-z0-9_-]+\.json$/i.test(rel)) {
      event.respondWith(cacheFirst(event, req, SHELL_CACHE, { ignoreSearch: true }));
      return;
    }
    if (rel === "" || SHELL.includes(rel)) {
      event.respondWith(cacheFirst(event, req, SHELL_CACHE, { ignoreSearch: true }));
    }
  } catch { /* let the browser handle the request normally */ }
});

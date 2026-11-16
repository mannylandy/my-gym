// Service worker: a small helper the browser runs in the background.
// It keeps a copy of the app on the phone, so My Gym opens even with no internet.
//
// Strategy: "network first". With internet you always get the newest version
// (no more stale files after an update). Without internet the saved copy is used.

const CACHE = "mygym-v2";

const APP_FILES = [
  "./",
  "index.html",
  "style.css",
  "exercises.js",
  "bodymap.js",
  "plan.js",
  "app.js",
  "manifest.json",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

// First install: save all app files. "reload" skips the browser's own cache,
// so an old file can never sneak in next to new ones.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_FILES.map((file) => new Request(file, { cache: "reload" }))))
  );
  self.skipWaiting();
});

// Remove copies saved by older versions of this file
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isOwnFile = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!isOwnFile && !isFont) return;

  event.respondWith(
    // For our own files, "no-cache" asks the server whether the file changed,
    // so you always get the newest version when you have internet
    fetch(request, isOwnFile ? { cache: "no-cache" } : undefined)
      .then((response) => {
        // Got it from the internet: update the saved copy for next time
        if (response.ok || response.type === "opaque") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        // No internet: use the saved copy (the app page itself if nothing else matches)
        caches.match(request, { ignoreSearch: true }).then((saved) => {
          if (saved) return saved;
          if (request.mode === "navigate") return caches.match("index.html");
          return Response.error();
        })
      )
  );
});

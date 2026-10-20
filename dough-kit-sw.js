// Change VERSION whenever any app asset changes.
const VERSION = '2026-10-20-v2-2';
// Scope-specific caches also keep separate deployments on one origin isolated.
const PREFIX = 'dough-kit:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const APP = new URL('./도우컨디셔너_진단키트_v2.html', self.location).href;
const ASSETS = [APP, './도우컨디셔너_진단키트.html', './', './index.html', './dough-kit.webmanifest', './dough-kit-pwa.js',
  './dough-kit-icons/icon-192.png', './dough-kit-icons/icon-512.png',
  './dough-kit-icons/maskable-512.png', './dough-kit-icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(new URL(path, self.location), {cache: 'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'APPLY_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const owned = ASSETS.map(path => new URL(path, self.location).href);
  if (event.request.method !== 'GET' || !owned.includes(url.origin + url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Each worker serves one complete version, avoiding mixed HTML/JS offline.
    const cached = await cache.match(url.origin + url.pathname);
    return cached || fetch(event.request);
  })());
});

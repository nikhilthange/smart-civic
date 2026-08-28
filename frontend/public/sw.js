/**
 * ─── BMC Smart Civic Progressive Web App (PWA) Service Worker ─────────────────
 * Implements:
 * 1. Self-destroying stale caches and immediate client take-over (skipWaiting + clients.claim).
 * 2. Strict cache-bypassing for HTML documents and navigation requests.
 * 3. Cache-First strategy with stale-while-revalidate for OSM map tiles & images only.
 * 4. Background queue synchronization when connection is restored.
 */

const CACHE_NAME = "smart-civic-v3"

// Install Event - Force immediate activation
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

// Activate Event - Purge all old caches and take over all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event
self.addEventListener("fetch", (event) => {
  // STRICT GUARD 1: Bypass all non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  const url = new URL(event.request.url)

  // STRICT GUARD 2: Completely bypass API routes, WebSocket gateways, and remote backend hosts
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/socket.io") ||
    url.hostname.includes("onrender.com") ||
    url.hostname.includes("localhost:5000") ||
    url.port === "5000"
  ) {
    return
  }

  // 1. Navigation / HTML Document -> ALWAYS Bypass Cache & Fetch Direct from Network
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // 2. JavaScript / CSS / Asset Bundles -> Network-First (Never hold stale chunks)
  if (
    url.pathname.startsWith("/assets/") ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // 3. OpenStreetMap Tiles & Static Images -> Cache-First with Stale-While-Revalidate
  if (url.hostname.includes("tile.openstreetmap.org") || event.request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone())
            }
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      })
    )
    return
  }

  // 4. Default fallback: Network direct
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Native Background Sync Event
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-civic-tickets") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_OFFLINE_QUEUE" })
        })
      })
    )
  }
})

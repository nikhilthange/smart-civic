/**
 * ─── BMC Smart Civic Progressive Web App (PWA) Service Worker ─────────────────
 * Implements:
 * 1. Network-First strategy for HTML navigation & script chunks to guarantee fresh builds.
 * 2. Cache-First strategy with stale-while-revalidate for OSM map tiles & images.
 * 3. Immediate cache invalidation on activation for smooth continuous deployments.
 * 4. Native `sync` background queue sync when connection is restored.
 */

const CACHE_NAME = "bmc-smart-civic-v2"

// Install Event - Activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

// Activate Event - Clear all outdated caches
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
  // STRICT GUARD 1: Bypass all non-GET requests (POST, PUT, DELETE, PATCH, OPTIONS)
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

  // 1. Navigation / HTML Document -> Strict Network-First (Never serve stale index.html with outdated chunk hashes)
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          return cached || caches.match("/index.html")
        })
    )
    return
  }

  // 2. JavaScript / CSS / Asset Bundles -> Network-First (Ensure new hashed chunks load immediately)
  if (
    url.pathname.startsWith("/assets/") ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
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

  // 4. Default fallback: Network with cache fallback
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

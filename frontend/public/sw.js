/**
 * ─── BMC Smart Civic Progressive Web App (PWA) Service Worker ─────────────────
 * Implements:
 * 1. Cache-first strategy with stale-while-revalidate for static assets & OSM map tiles.
 * 2. Network-first strategy with offline fallbacks for dynamic `/api/*` endpoints.
 * 3. Native `sync` background queue sync when connection is restored.
 */

const CACHE_NAME = "bmc-smart-civic-v1"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
]

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch Event
self.addEventListener("fetch", (event) => {
  // STRICT GUARD 1: Bypass all non-GET requests (POST, PUT, DELETE, PATCH, OPTIONS)
  // Ensures authentication, grievance mutations, and payments never touch cache
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

  // 2. OpenStreetMap Tiles & Static Assets -> Cache-First with Stale-While-Revalidate
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

  // 3. Default fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
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

/**
 * ─── BMC Smart Civic Progressive Web App (PWA) Service Worker ─────────────────
 * Implements:
 * 1. Self-destroying stale caches and immediate client take-over (skipWaiting + clients.claim).
 * 2. Strict cache-bypassing for API endpoints, remote backends, and non-GET requests.
 * 3. Network-First / Stale-While-Revalidate caching with guaranteed valid Response returns.
 * 4. Background queue synchronization when connection is restored.
 */

const CACHE_NAME = "smart-civic-v4"

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

  let url
  try {
    url = new URL(event.request.url)
  } catch {
    return
  }

  // STRICT GUARD 2: Completely bypass API routes, WebSocket gateways, and remote backend hosts
  if (
    url.pathname.includes("/api/") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/socket.io") ||
    url.hostname.includes("onrender.com") ||
    url.hostname.includes("localhost:5000") ||
    url.port === "5000" ||
    (url.origin !== self.location.origin && !url.hostname.includes("tile.openstreetmap.org"))
  ) {
    return
  }

  // Helper to safely match cache or return a valid error Response
  const matchCacheOrError = async (request) => {
    try {
      const match = await caches.match(request)
      if (match) return match
    } catch {
      // ignore cache lookup errors
    }
    return Response.error()
  }

  // 1. Navigation / HTML Document -> ALWAYS Bypass Cache & Fetch Direct from Network
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request).catch(() => matchCacheOrError(event.request))
    )
    return
  }

  // 2. JavaScript / CSS / Asset Bundles -> Network-First
  if (
    url.pathname.startsWith("/assets/") ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      fetch(event.request).catch(() => matchCacheOrError(event.request))
    )
    return
  }

  // 3. OpenStreetMap Tiles & Static Images -> Cache-First with Stale-While-Revalidate
  if (url.hostname.includes("tile.openstreetmap.org") || event.request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        let cached = null
        try {
          cached = await cache.match(event.request)
        } catch {
          // ignore cache read failure
        }

        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone()).catch(() => {})
            }
            return response
          })
          .catch(() => cached || Response.error())

        return cached || networkFetch
      }).catch(() => matchCacheOrError(event.request))
    )
    return
  }

  // 4. Default fallback: Network direct with safe response error fallback
  event.respondWith(
    fetch(event.request).catch(() => matchCacheOrError(event.request))
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


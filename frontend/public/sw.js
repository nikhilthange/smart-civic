/**
 * ─── BMC Smart Civic Progressive Web App (PWA) Service Worker ─────────────────
 * Implements:
 * 1. Immediate client takeover & skipWaiting via lifecycle & postMessage.
 * 2. Pre-caching critical application shell and offline fallbacks.
 * 3. SPA Route Navigation fallback to /index.html when offline.
 * 4. Stale-While-Revalidate for JS/CSS assets and Cache-First for map tiles/images.
 * 5. Strict cache-bypassing for live API mutations and WebSockets.
 * 6. Native Background Sync for offline grievance queues.
 */

const CACHE_NAME = "smart-civic-pwa-v5"

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icons/pwa-192x192.png",
  "/icons/pwa-512x512.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/geo.json"
]

// ─── Install Event: Precache Application Shell ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Precache skipped for ${url}:`, err.message)
          })
        )
      )
    }).then(() => self.skipWaiting())
  )
})

// ─── Activate Event: Purge Old Caches & Take Over Immediately ─────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing outdated cache:", key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// ─── Fetch Event ──────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Guard 1: Bypass all non-GET requests (POST, PUT, DELETE)
  if (event.request.method !== "GET") {
    return
  }

  let url
  try {
    url = new URL(event.request.url)
  } catch {
    return
  }

  // Guard 2: Bypass API routes, WebSocket gateways, dev assets, and remote auth endpoints
  if (
    url.pathname.includes("/api/") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/socket.io") ||
    url.pathname.includes("/@") ||
    url.pathname.includes("/src/") ||
    url.pathname.includes("node_modules") ||
    url.pathname.includes("_vercel") ||
    url.pathname.includes("sso-api") ||
    url.hostname === "vercel.live" ||
    url.hostname.endsWith(".vercel.live") ||
    url.hostname.includes("onrender.com") ||
    (url.hostname === "localhost" && url.port === "5000") ||
    url.port === "5000" ||
    (url.origin !== self.location.origin && !url.hostname.includes("tile.openstreetmap.org"))
  ) {
    return
  }

  // Helper: safe cache match
  const safeCacheMatch = async (req) => {
    try {
      const match = await caches.match(req)
      if (match) return match
    } catch {
      // cache match failed
    }
    return null
  }

  // 1. Navigation / Document Requests (SPA Route Fallback)
  // Try network first; if offline or fails, return cached index.html
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloneForRoute = response.clone()
            const cloneForIndex = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloneForRoute).catch(() => {})
              cache.put("/index.html", cloneForIndex).catch(() => {})
            })
          }
          return response
        })
        .catch(async () => {
          const cachedRoute = await safeCacheMatch(event.request)
          if (cachedRoute) return cachedRoute

          const cachedShell = await safeCacheMatch("/index.html")
          if (cachedShell) return cachedShell

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <title>Smart Civic - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                  h1 { font-size: 20px; color: #10b981; margin-bottom: 12px; }
                  p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                  button { background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 16px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>📶 Smart Civic Offline</h1>
                  <p>You are currently offline. Any grievance reports queued in the mobile app will be automatically synchronized with BMC servers as soon as your connection is restored.</p>
                  <button onclick="window.location.reload()">Retry Connection</button>
                </div>
              </body>
            </html>`,
            { headers: { "Content-Type": "text/html" } }
          )
        })
    )
    return
  }

  // 2. JavaScript / CSS / Static Bundles (Stale-While-Revalidate)
  if (
    url.pathname.startsWith("/assets/") ||
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request)
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {})
            }
            return networkResponse
          })
          .catch(() => cachedResponse || new Response(null, { status: 204 }))

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // 3. OpenStreetMap Tiles & Static Images (Cache-First)
  if (url.hostname.includes("tile.openstreetmap.org") || event.request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) {
          // Revalidate in background
          fetch(event.request)
            .then((res) => {
              if (res && res.status === 200) cache.put(event.request, res.clone()).catch(() => {})
            })
            .catch(() => {})
          return cached
        }

        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone()).catch(() => {})
            }
            return response
          })
          .catch(() => new Response(null, { status: 204 }))
      })
    )
    return
  }

  // 4. Default Fallback
  event.respondWith(
    fetch(event.request).catch(async () => {
      const match = await safeCacheMatch(event.request)
      return match || new Response(null, { status: 204 })
    })
  )
})

// ─── Native Background Sync Event ─────────────────────────────────────────────
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

// ─── Listen for SKIP_WAITING from Client ──────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

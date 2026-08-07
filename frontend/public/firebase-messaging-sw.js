// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// This file MUST be in the /public root so the browser can register it at /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js")

// This will be replaced by the actual config at runtime via postMessage
// The SW config is injected via the getToken VAPID call — no secrets exposed here
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || "your_firebase_api_key",
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || "your-project.firebaseapp.com",
  projectId:         self.FIREBASE_PROJECT_ID         || "your_firebase_project_id",
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || "your-project.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| "your_messaging_sender_id",
  appId:             self.FIREBASE_APP_ID             || "your_firebase_app_id",
})

const messaging = firebase.messaging()

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background FCM message:", payload)

  const { title, body } = payload.notification || {}
  const actionUrl = payload.data?.actionUrl || "/"

  self.registration.showNotification(title || "Smart Civic AI", {
    body: body || "You have a new notification",
    icon: "/logo.png",
    badge: "/badge.png",
    tag: payload.data?.type || "smart-civic",
    requireInteraction: true,
    data: { url: actionUrl },
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  })
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "dismiss") return

  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

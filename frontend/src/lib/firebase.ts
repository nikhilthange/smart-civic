/**
 * firebase.ts
 * Initialize Firebase app + Firebase Authentication.
 * Configured specifically for Smart Civic platform authentication.
 * Firestore and Storage are intentionally excluded per requirements.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCXwkjyqoMg_i-baAqu05Gk6y-fQr2Jj6k",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-civic-277e9.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-civic-277e9",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-civic-277e9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "526927598138",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:526927598138:web:5d7511199478ce13581b03",
}

// Initialize Firebase App (singleton pattern for Vite HMR)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase Authentication
const auth: Auth = getAuth(app)

// Google Auth Provider configured to always prompt account selection
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: "select_account",
})

export function getFirebaseAuth(): Auth {
  return auth
}

export function getGoogleProvider(): GoogleAuthProvider {
  return googleProvider
}

export { auth, googleProvider }

export {
  app,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
}

export type { FirebaseUser }

/**
 * Dynamically listen for foreground FCM push notifications without static import overhead.
 */
export async function onForegroundMessage(callback: (payload: any) => void): Promise<(() => void) | undefined> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return undefined
  }
  try {
    const { getMessaging, onMessage } = await import("firebase/messaging")
    const messaging = getMessaging(app)
    return onMessage(messaging, callback)
  } catch {
    return undefined
  }
}

/**
 * Helper to request notification permission and retrieve the FCM token dynamically.
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null
  }

  const rawVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  const isKeyConfigured =
    rawVapidKey &&
    rawVapidKey.trim().length > 30 &&
    !rawVapidKey.includes("YourFirebaseVapid") &&
    !rawVapidKey.includes("your_vapid")

  if (!isKeyConfigured) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const { getMessaging, getToken } = await import("firebase/messaging")
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: rawVapidKey.trim(),
    })
    return token || null
  } catch (err: any) {
    console.debug("ℹ️ FCM token registration skipped:", err?.message || err)
    return null
  }
}

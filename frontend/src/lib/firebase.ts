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
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth"
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"

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
const googleProvider = new GoogleAuthProvider()

// Messaging is only initialized in supported browser environments
let messaging: Messaging | null = null
try {
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("your_firebase_api_key")
  ) {
    messaging = getMessaging(app)
  }
} catch {
  // Gracefully bypass if service workers or push notifications are unsupported
}

export {
  app,
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  messaging,
  getToken,
  onMessage,
}

export type { FirebaseUser }

/**
 * Helper to request notification permission and retrieve the FCM token.
 */
export async function requestFCMToken(): Promise<string | null> {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })
    return token || null
  } catch (err) {
    console.warn("FCM token error:", err)
    return null
  }
}

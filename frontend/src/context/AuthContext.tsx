import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import api from "@/lib/axios"
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "@/lib/firebase"

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "citizen" | "admin" | "officer" | "worker"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  phoneNumber?: string
  ward?: string
  zone?: string
  department?: string
  karmaPoints?: number
  badges?: Array<{ name: string; icon?: string; description?: string; awardedAt?: string }>
  redeemedRewards?: Array<{ rewardId: string; title: string; pointsCost: number; voucherCode: string; redeemedAt?: string }>
  createdAt?: string
  lastLogin?: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  role?: UserRole
  ward?: string
  phoneNumber?: string
  address?: string
}

interface LoginData {
  email: string
  password: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  loginWithFirebaseGoogle: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  registerWithFirebaseEmail: (data: RegisterData) => Promise<{ needsVerification: boolean; email: string }>
  loginWithFirebaseEmail: (data: LoginData) => Promise<void>
  resendEmailVerification: (email: string, password?: string) => Promise<void>
  logout: () => Promise<void>
  updateUserKarma: (newPoints: number) => void
  refreshUserProfile: () => Promise<void>
  error: string | null
  clearError: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem("user")
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
    return storedToken
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const currentUserRef = useRef<AuthUser | null>(user)
  const currentTokenRef = useRef<string | null>(token)
  currentUserRef.current = user
  currentTokenRef.current = token

  // ─── Unified Firebase Auth Observer: Single Source of Truth ───────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const isPasswordProvider = firebaseUser.providerData.some(
            (p) => p.providerId === "password"
          )

          // 1. Block unverified email/password accounts
          if (isPasswordProvider && !firebaseUser.emailVerified) {
            if (currentUserRef.current !== null || currentTokenRef.current !== null) {
              setUser(null)
              setToken(null)
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              delete api.defaults.headers.common["Authorization"]
            }
            setIsLoading(false)
            return
          }

          // 2. Exchange Firebase ID token for Backend-issued JWT
          const idToken = await firebaseUser.getIdToken()
          let backendToken = localStorage.getItem("token")
          let resolvedUser: AuthUser | null = null

          // Test existing backend token first if available
          if (backendToken) {
            try {
              const { data } = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${backendToken}` },
              })
              if (data?.user) {
                resolvedUser = data.user
              }
            } catch {
              backendToken = null
            }
          }

          // If no valid backend token, exchange Firebase ID token with backend
          if (!backendToken || !resolvedUser) {
            try {
              const res = await api.post("/auth/firebase-login", { idToken })
              if (res.data?.token) {
                backendToken = res.data.token
                resolvedUser = res.data.user
              }
            } catch (exchangeErr) {
              console.warn("Backend Firebase token exchange failed:", exchangeErr)
            }
          }

          if (backendToken && resolvedUser) {
            localStorage.setItem("token", backendToken)
            localStorage.setItem("user", JSON.stringify(resolvedUser))
            api.defaults.headers.common["Authorization"] = `Bearer ${backendToken}`
            setToken(backendToken)
            setUser(resolvedUser)
          } else {
            // Fallback for offline/preview mode
            const fallbackUser: AuthUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Citizen",
              email: firebaseUser.email || "",
              role: "citizen",
              isActive: true,
              karmaPoints: currentUserRef.current?.karmaPoints ?? 0,
              createdAt: new Date().toISOString(),
            }
            setUser(fallbackUser)
          }
        } else {
          // 3. User is signed out in Firebase
          const storedToken = localStorage.getItem("token")
          const storedUserStr = localStorage.getItem("user")
          if (storedToken) {
            // Handle Demo / Local session
            if (storedToken.startsWith("demo-") && storedUserStr) {
              try {
                const parsed = JSON.parse(storedUserStr)
                setUser(parsed)
                setToken(storedToken)
                api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
                setIsLoading(false)
                return
              } catch {}
            }

            // Verify if non-Firebase backend session exists (e.g. staff/admin password login)
            try {
              const { data } = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${storedToken}` },
              })
              if (data?.user) {
                setUser(data.user)
                setToken(storedToken)
                api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
                setIsLoading(false)
                return
              }
            } catch {
              // If offline or network error, retain stored local user
              if (storedUserStr) {
                try {
                  const parsed = JSON.parse(storedUserStr)
                  setUser(parsed)
                  setToken(storedToken)
                  api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
                  setIsLoading(false)
                  return
                } catch {}
              }
            }
          }

          setUser(null)
          setToken(null)
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          delete api.defaults.headers.common["Authorization"]
        }
      } catch (err) {
        console.warn("Auth observer hydration:", err)
        setUser(null)
        setToken(null)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        delete api.defaults.headers.common["Authorization"]
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post("/auth/register", data)
      const { token: newToken, user: newUser } = response.data
      localStorage.setItem("token", newToken)
      localStorage.setItem("user", JSON.stringify(newUser))
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
      setToken(newToken)
      setUser(newUser)
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post("/auth/login", data)
      const { token: newToken, user: newUser } = response.data
      localStorage.setItem("token", newToken)
      localStorage.setItem("user", JSON.stringify(newUser))
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
      setToken(newToken)
      setUser(newUser)
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login with Google (GSI / Backend Token) ────────────────────────────────
  const loginWithGoogle = useCallback(async (googleToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post("/auth/google", { token: googleToken })
      const { token: newToken, user: newUser } = response.data
      localStorage.setItem("token", newToken)
      localStorage.setItem("user", JSON.stringify(newUser))
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
      setToken(newToken)
      setUser(newUser)
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login with Firebase Google (Native Firebase Popup OAuth) ───────────────
  const loginWithFirebaseGoogle = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      const idToken = await userCredential.user.getIdToken()

      try {
        // Attempt backend sync
        const response = await api.post("/auth/google", { token: idToken })
        const { token: newToken, user: newUser } = response.data
        localStorage.setItem("token", newToken)
        localStorage.setItem("user", JSON.stringify(newUser))
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
        setToken(newToken)
        setUser(newUser)
      } catch {
        // Resilient fallback for preview/client-only sessions
        const firebaseUser: AuthUser = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || "Google Citizen",
          email: userCredential.user.email || "",
          role: "citizen",
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem("token", idToken)
        localStorage.setItem("user", JSON.stringify(firebaseUser))
        api.defaults.headers.common["Authorization"] = `Bearer ${idToken}`
        setToken(idToken)
        setUser(firebaseUser)
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Register with Firebase Email & Send Verification (No Auto-Login) ────────
  const registerWithFirebaseEmail = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      if (data.name) {
        try {
          await updateProfile(userCredential.user, { displayName: data.name })
        } catch {
          // ignore profile update error
        }
      }

      // 1. Send Firebase verification email
      try {
        await sendEmailVerification(userCredential.user)
      } catch (fbEmailErr) {
        console.warn("Firebase sendEmailVerification notice:", fbEmailErr)
      }

      // 2. Dispatch backend verification email via unified EmailService
      try {
        await api.post("/auth/register", data)
      } catch (backendRegErr) {
        console.warn("Backend registration sync notice:", backendRegErr)
      }

      // Per specification: Don't auto-login after Sign Up
      await firebaseSignOut(auth)

      return { needsVerification: true, email: data.email }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login with Firebase Email (Check emailVerified) ────────────────────────
  const loginWithFirebaseEmail = useCallback(async (data: LoginData) => {
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)

      // Block login if email is not verified yet
      if (!userCredential.user.emailVerified) {
        // Sign out immediately so unverified session is blocked
        await firebaseSignOut(auth)
        const unverifiedError = new Error("EMAIL_NOT_VERIFIED")
        ;(unverifiedError as any).email = data.email
        throw unverifiedError
      }

      // Verified! Retrieve ID token and establish session
      const idToken = await userCredential.user.getIdToken()

      try {
        // Backend sync
        const response = await api.post("/auth/google", { token: idToken })
        const { token: newToken, user: newUser } = response.data
        localStorage.setItem("token", newToken)
        localStorage.setItem("user", JSON.stringify(newUser))
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
        setToken(newToken)
        setUser(newUser)
      } catch {
        // Fallback verified session
        const verifiedUser: AuthUser = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || data.email.split("@")[0],
          email: userCredential.user.email || data.email,
          role: "citizen",
          isActive: true,
          karmaPoints: 0,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem("token", idToken)
        localStorage.setItem("user", JSON.stringify(verifiedUser))
        api.defaults.headers.common["Authorization"] = `Bearer ${idToken}`
        setToken(idToken)
        setUser(verifiedUser)
      }
    } catch (err: any) {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        throw err
      }
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Resend Email Verification (Backend SMTP + Firebase Auth) ──────────────
  const resendEmailVerification = useCallback(async (email: string, password?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Primary: Call backend email delivery pipeline
      let backendSuccess = false
      try {
        const response = await api.post("/auth/resend-verification", { email })
        if (response.data?.success) {
          backendSuccess = true
        }
      } catch (backendErr: any) {
        console.warn("Backend resend verification notice:", backendErr.response?.data?.message || backendErr.message)
      }

      // 2. Secondary: If Firebase session / credentials available, trigger Firebase sendEmailVerification as well
      let currentUser = auth.currentUser
      if (!currentUser && email && password) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password)
          currentUser = cred.user
        } catch {
          // Ignore if Firebase credentials don't match
        }
      }

      if (currentUser) {
        try {
          await sendEmailVerification(currentUser)
          if (!currentUser.emailVerified) {
            await firebaseSignOut(auth)
          }
        } catch (fbErr) {
          console.warn("Firebase email verification dispatch notice:", fbErr)
        }
      }

      if (!backendSuccess && !currentUser) {
        // If backend failed and no firebase session, re-verify with backend directly to throw informative error
        const res = await api.post("/auth/resend-verification", { email })
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to resend verification email.")
        }
      }
    } catch (err: any) {
      console.error("Resend verification error:", err)
      const msg = extractErrorMessage(err)
      setError(msg)
      throw new Error(msg || "Failed to resend verification email. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await api.post("/auth/logout")
    } catch {
      // Still clear local state even if server call fails
    }

    try {
      await firebaseSignOut(auth)
    } catch {
      // Best effort sign-out
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete api.defaults.headers.common["Authorization"]
      setToken(null)
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  // ─── Update User Karma Balance in Context & Storage ──────────────────────────
  const updateUserKarma = useCallback((newPoints: number) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, karmaPoints: newPoints }
      try {
        localStorage.setItem("user", JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  // ─── Refresh User Profile from Backend ───────────────────────────────────────
  const refreshUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me")
      if (data?.user) {
        setUser(data.user)
        try {
          localStorage.setItem("user", JSON.stringify(data.user))
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn("Failed to refresh user profile from /auth/me:", err)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        loginWithGoogle,
        loginWithFirebaseGoogle,
        register,
        registerWithFirebaseEmail,
        loginWithFirebaseEmail,
        resendEmailVerification,
        logout,
        updateUserKarma,
        refreshUserProfile,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>")
  }
  return ctx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string; errors?: { message: string }[] } } }
    const data = axiosErr.response?.data
    if (data?.errors?.length) {
      return data.errors[0].message
    }
    return data?.message || "An unexpected error occurred."
  }
  return "Network error. Please check your connection."
}

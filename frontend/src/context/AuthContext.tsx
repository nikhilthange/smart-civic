import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import api from "@/lib/axios"
import {
  auth,
  googleProvider,
  signInWithPopup,
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

  // ─── On mount: validate stored token and re-hydrate user ────────────────────
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      const storedToken = localStorage.getItem("token")
      if (!storedToken) {
        if (isMounted) setIsLoading(false)
        return
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`

      try {
        const { data } = await api.get("/auth/me")
        if (isMounted && data?.user) {
          setUser(data.user)
          setToken(storedToken)
          localStorage.setItem("user", JSON.stringify(data.user))
        }
      } catch (err: any) {
        // Only invalidate if the server explicitly rejects the token with 401
        if (err?.response?.status === 401) {
          console.warn("⚠️ Stale token detected on /auth/me. Clearing session.")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          delete api.defaults.headers.common["Authorization"]
          if (isMounted) {
            setToken(null)
            setUser(null)
          }
        } else {
          console.warn("⚠️ Network/Server unreachable during /auth/me check. Retaining offline session.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
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

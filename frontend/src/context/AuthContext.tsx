import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import api from "@/lib/axios"

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "citizen" | "admin" | "officer" | "worker"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
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
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  clearError: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  )
  const [isLoading, setIsLoading] = useState<boolean>(true) // Start loading to check stored token
  const [error, setError] = useState<string | null>(null)

  // ─── On mount: validate stored token and re-hydrate user ────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token")
      if (!storedToken) {
        setIsLoading(false)
        return
      }
      try {
        const { data } = await api.get("/auth/me")
        setUser(data.user)
        setToken(storedToken)
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post("/auth/register", data)
      const { token: newToken, user: newUser } = response.data
      localStorage.setItem("token", newToken)
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

  // ─── Login with Google ───────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async (googleToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post("/auth/google", { token: googleToken })
      const { token: newToken, user: newUser } = response.data
      localStorage.setItem("token", newToken)
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

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await api.post("/auth/logout")
    } catch {
      // Still clear local state even if server call fails
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setToken(null)
      setUser(null)
      setIsLoading(false)
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
        register,
        logout,
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

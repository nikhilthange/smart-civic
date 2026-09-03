import axios from "axios"
import { auth } from "./firebase"

/**
 * Normalizes the API URL to guarantee that every outbound request has a clean `/api` prefix,
 * preventing 404s when environment variables omit the trailing `/api` segment.
 */
export function getNormalizedApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim()
  const cleaned = raw.replace(/\/+$/, "")
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`
}

export function getNormalizedBaseUrl(): string {
  return getNormalizedApiUrl().replace(/\/api\/?$/, "")
}

const api = axios.create({
  baseURL: getNormalizedApiUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Request Interceptor: Auto-attach Backend JWT Bearer token ───────────────
api.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Handle 401 with Silent Firebase Re-Auth Handshake ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = (originalRequest.url || "").toString()
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/firebase-login") ||
        requestUrl.includes("/auth/google")

      // If Firebase user is active, attempt a single silent handshake to refresh backend JWT
      if (!isAuthEndpoint && auth.currentUser) {
        originalRequest._retry = true
        try {
          const freshIdToken = await auth.currentUser.getIdToken(true)
          const exchangeUrl = `${getNormalizedApiUrl()}/auth/firebase-login`
          const res = await axios.post(exchangeUrl, { idToken: freshIdToken })

          if (res.data?.token) {
            const newBackendToken = res.data.token
            localStorage.setItem("token", newBackendToken)
            if (res.data.user) {
              localStorage.setItem("user", JSON.stringify(res.data.user))
            }
            api.defaults.headers.common["Authorization"] = `Bearer ${newBackendToken}`
            originalRequest.headers.Authorization = `Bearer ${newBackendToken}`
            return api(originalRequest)
          }
        } catch (refreshErr) {
          console.warn("Silent Firebase re-auth exchange failed:", refreshErr)
        }
      }

      // If /auth/me or core auth failed, clean up invalid tokens
      if (requestUrl.includes("/auth/me") || requestUrl.includes("/auth/logout")) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        delete api.defaults.headers.common["Authorization"]
      } else if (!requestUrl.includes("/notifications")) {
        console.warn("⚠️ Unauthorized request (401) on endpoint:", requestUrl)
      }
    } else if (!error.response && error.message === "Network Error") {
      console.warn("⚠️ Network connection offline. Request queued or failed gracefully.")
    }

    return Promise.reject(error)
  }
)

export default api

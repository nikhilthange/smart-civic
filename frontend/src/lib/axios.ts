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

// ─── Request Interceptor: Auto-attach Firebase Bearer token ──────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      } else {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`
        }
      }
    } catch (e) {
      console.warn("Could not retrieve Firebase token for request", e)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Handle 401 & Network Failures gracefully ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ""
      const isAuthValidationEndpoint = requestUrl.includes("/auth/me")

      // Only invalidate token in storage if core /auth/me endpoint explicitly rejected it
      if (isAuthValidationEndpoint) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        delete api.defaults.headers.common["Authorization"]
      } else {
        console.warn("⚠️ Unauthorized request (401) on endpoint:", requestUrl)
      }
    } else if (!error.response && error.message === "Network Error") {
      console.warn("⚠️ Network connection offline. Request queued or failed gracefully.")
    }
    return Promise.reject(error)
  }
)

export default api

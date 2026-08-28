import axios from "axios"

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

// ─── Request Interceptor: Auto-attach Bearer token ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

      // Only invalidate session if the core authentication validator (/auth/me) fails
      if (isAuthValidationEndpoint) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        if (typeof window !== "undefined" && window.location.pathname !== "/auth" && window.location.pathname !== "/login") {
          window.location.href = "/auth"
        }
      } else {
        console.warn("⚠️ Unauthorized request (401) on non-critical endpoint:", requestUrl)
      }
    } else if (!error.response && error.message === "Network Error") {
      console.warn("⚠️ Network connection offline. Request queued or failed gracefully.")
    }
    return Promise.reject(error)
  }
)

export default api

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

// ─── Response Interceptor: Handle 401 & Network Failures globally ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token from storage
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Only redirect if not already on auth page
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth"
      }
    } else if (!error.response && error.message === "Network Error") {
      console.warn("⚠️ Network connection offline. Request queued or failed gracefully.");
    }
    return Promise.reject(error)
  }
)

export default api

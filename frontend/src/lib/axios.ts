import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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

// ─── Response Interceptor: Handle 401 globally ───────────────────────────────
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
    }
    return Promise.reject(error)
  }
)

export default api

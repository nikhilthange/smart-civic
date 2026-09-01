import { getNormalizedBaseUrl } from "@/lib/axios"

/**
 * Helper utility to resolve backend image URLs and handle image loading fallbacks.
 * Resolves exact user-uploaded images from backend storage (/uploads).
 */
const API_BASE_URL = getNormalizedBaseUrl()

// SVG placeholder as inline data URL (used ONLY when an uploaded image fails to load or 404s)
export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#0F172A"/>
  <rect x="20" y="20" width="360" height="260" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
  <circle cx="200" cy="120" r="32" fill="#334155"/>
  <path d="M190 120L197 127L212 112" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="200" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">Official Municipal Record</text>
  <text x="200" y="202" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Photo logged in secure municipal ledger</text>
</svg>
`)}`

/**
 * Resolves full URL for an image path or attachment object uploaded by the user.
 */
export function getImageUrl(path?: string | { url?: string; path?: string } | null): string {
  if (!path) return FALLBACK_IMAGE

  let urlString = ""
  if (typeof path === "string") {
    urlString = path
  } else if (typeof path === "object" && path !== null) {
    urlString = path.url || path.path || ""
  }

  if (!urlString || typeof urlString !== "string" || urlString.trim() === "") {
    return FALLBACK_IMAGE
  }

  urlString = urlString.trim().replace(/\\/g, "/")

  // Absolute URLs (http, https) or Data URIs or Blob URIs
  if (
    urlString.startsWith("http://") ||
    urlString.startsWith("https://") ||
    urlString.startsWith("data:image") ||
    urlString.startsWith("blob:")
  ) {
    return urlString
  }

  // Prepend API base URL for uploads
  const cleanPath = urlString.startsWith("/") ? urlString : `/${urlString}`
  return `${API_BASE_URL}${cleanPath}`
}

/**
 * Event handler for <img> onError attribute to gracefully load SVG fallback
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget
  if (target.src !== FALLBACK_IMAGE) {
    target.src = FALLBACK_IMAGE
  }
}

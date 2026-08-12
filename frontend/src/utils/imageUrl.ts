/**
 * Helper utility to resolve backend image URLs and handle image loading fallbacks.
 * Resolves exact user-uploaded images from backend storage (/uploads).
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "")

// SVG placeholder as inline data URL (used ONLY when an uploaded image fails to load or 404s)
export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#F1F5F9"/>
  <rect x="140" y="80" width="120" height="90" rx="12" fill="#CBD5E1"/>
  <circle cx="175" cy="115" r="15" fill="#94A3B8"/>
  <path d="M140 155L170 130L200 155L230 135L260 170H140V155Z" fill="#94A3B8"/>
  <text x="200" y="210" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#64748B" text-anchor="middle">No Evidence Image</text>
</svg>
`)}`

/**
 * Resolves full URL for an image path or attachment object uploaded by the user.
 */
export function getImageUrl(path?: string | { url?: string } | null): string {
  if (!path) return FALLBACK_IMAGE

  let urlString = ""
  if (typeof path === "string") {
    urlString = path
  } else if (typeof path === "object" && path?.url) {
    urlString = path.url
  }

  if (!urlString || urlString.trim() === "") {
    return FALLBACK_IMAGE
  }

  // Absolute URLs (http, https) or Data URIs
  if (urlString.startsWith("http://") || urlString.startsWith("https://") || urlString.startsWith("data:image")) {
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

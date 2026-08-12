/**
 * Geolocation & Distance Matrix Utilities
 * Provides Haversine straight-line distance, live GPS position retrieval,
 * OSRM routing travel time estimation, and Google Maps navigation links.
 */

export interface LocationCoordinates {
  lat: number
  lng: number
}

export interface TravelDetails {
  distanceKm: number
  durationMins: number
  isRealTimeRoute: boolean
  userLocation: LocationCoordinates
}

// Default fallback coordinates: BMC Municipal Headquarters, Mumbai
export const DEFAULT_MUMBAI_LOCATION: LocationCoordinates = {
  lat: 19.0760,
  lng: 72.8777,
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10
}

/**
 * Estimates driving travel duration in minutes based on urban traffic speed (default 25 km/h).
 */
export function estimateDrivingMinutes(distanceKm: number, speedKmH = 25): number {
  if (distanceKm <= 0) return 1
  return Math.max(1, Math.round((distanceKm / speedKmH) * 60))
}

/**
 * Promisified wrapper for browser navigator.geolocation.getCurrentPosition.
 * Falls back gracefully to default Mumbai coordinates if permission is denied or unavailable.
 */
export function getUserLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_MUMBAI_LOCATION)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // Fallback on permission denied, timeout, or error
        resolve(DEFAULT_MUMBAI_LOCATION)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  })
}

/**
 * Queries OSRM routing API to fetch driving distance & duration with automatic Haversine fallback.
 */
export async function getTravelDetails(
  targetLat?: number,
  targetLng?: number
): Promise<TravelDetails> {
  const userLoc = await getUserLocation()

  const destLat = targetLat && targetLat !== 0 ? targetLat : 19.0596 // Default Bandra West lat
  const destLng = targetLng && targetLng !== 0 ? targetLng : 72.8295 // Default Bandra West lng

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const url = `https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${destLng},${destLat}?overview=false`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10
        const durationMins = Math.max(1, Math.round(route.duration / 60))
        return {
          distanceKm,
          durationMins,
          isRealTimeRoute: true,
          userLocation: userLoc,
        }
      }
    }
  } catch {
    // OSRM failed or timed out — use Haversine calculation fallback
  }

  const distanceKm = haversineDistance(userLoc.lat, userLoc.lng, destLat, destLng)
  const durationMins = estimateDrivingMinutes(distanceKm)

  return {
    distanceKm,
    durationMins,
    isRealTimeRoute: false,
    userLocation: userLoc,
  }
}

/**
 * Formats Google Maps navigation URL for a given destination coordinate set or address string.
 */
export function getGoogleMapsDirUrl(lat?: number, lng?: number, address?: string): string {
  if (lat && lng && lat !== 0 && lng !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }
  const encodedAddr = encodeURIComponent(address || "Mumbai, Maharashtra")
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}`
}

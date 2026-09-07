import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix legacy Leaflet plugins expecting global window.L, window.global, and globalThis.L
if (typeof window !== "undefined") {
  ;(window as any).L = L
  ;(window as any).global = window
  ;(globalThis as any).L = L
}

// Fix default Leaflet marker icons with Vite/Webpack asset bundling
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

try {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  L.Marker.prototype.options.icon = DefaultIcon
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  })
} catch {
  // Best-effort icon initialization
}

/**
 * Dynamically and safely loads Leaflet plugins after window.L is assigned.
 */
let pluginsPromise: Promise<void> | null = null
export async function ensureLeafletPlugins(): Promise<void> {
  if (typeof window === "undefined") return
  ;(window as any).L = L
  ;(window as any).global = window
  ;(globalThis as any).L = L

  if (!pluginsPromise) {
    pluginsPromise = (async () => {
      try {
        (window as any).L = L
        ;(globalThis as any).L = L
        await import("leaflet.markercluster")
      } catch (err) {
        console.warn("Leaflet markercluster load warning:", err)
      }
      try {
        (window as any).L = L
        ;(globalThis as any).L = L
        await import("leaflet.heat")
      } catch (err) {
        console.warn("Leaflet heat load warning:", err)
      }
    })()
  }
  return pluginsPromise
}

export default L
export { L }


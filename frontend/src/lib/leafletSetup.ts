import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix legacy Leaflet plugins expecting global window.L
if (typeof window !== "undefined") {
  ;(window as any).L = L
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

export default L
export { L }

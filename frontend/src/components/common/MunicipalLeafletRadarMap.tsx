import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  subtitle?: string
  status?: string
  severity?: "critical" | "warning" | "success" | "info"
  badgeText?: string
}

interface MunicipalLeafletRadarMapProps {
  center?: [number, number]
  zoom?: number
  markers: MapMarker[]
  height?: string
}

function createCustomPin(severity: string = "info") {
  let color = "#2563eb"
  if (severity === "critical") color = "#e11d48"
  else if (severity === "warning") color = "#d97706"
  else if (severity === "success") color = "#059669"

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white;"></div>
      </div>
      ${severity === "critical" ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 2px solid ${color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
    </div>
  `

  return L.divIcon({
    html,
    className: "custom-leaflet-pin",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

export default function MunicipalLeafletRadarMap({
  center = [19.0760, 72.8777], // Mumbai Center
  zoom = 11,
  markers = [],
  height = "420px",
}: MunicipalLeafletRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        scrollWheelZoom: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const layer = L.layerGroup().addTo(map)
      markersLayerRef.current = layer
      mapInstanceRef.current = map

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      })
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current)
      }

      setTimeout(() => {
        map.invalidateSize()
      }, 150)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom])

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return
    markersLayerRef.current.clearLayers()

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: createCustomPin(m.severity),
      })

      const popupContent = `
        <div style="padding: 2px; font-family: sans-serif; font-size: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="color: #0f172a;">${m.title}</strong>
            ${m.badgeText ? `<span style="background: #fee2e2; color: #991b1b; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${m.badgeText}</span>` : ""}
          </div>
          ${m.subtitle ? `<p style="color: #475569; margin: 4px 0 0 0; font-size: 11px;">${m.subtitle}</p>` : ""}
          ${m.status ? `<p style="color: #64748b; margin: 4px 0 0 0; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 2px;">Status: ${m.status}</p>` : ""}
        </div>
      `

      marker.bindPopup(popupContent)
      markersLayerRef.current?.addLayer(marker)
    })
  }, [markers])

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%", zIndex: 1 }}
      className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm"
    />
  )
}

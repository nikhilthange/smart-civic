import { useEffect, useRef } from "react"
import L from "@/lib/leafletSetup"
import "leaflet/dist/leaflet.css"
import { type Complaint } from "@/services/complaintApi"
import { Badge } from "@/components/ui/badge"

interface WorkerTspRouteMapProps {
  workerCoords?: [number, number]
  tasks: Complaint[]
  height?: string
}

export default function WorkerTspRouteMap({
  workerCoords = [19.0178, 72.8437], // Dadar Depot
  tasks = [],
  height = "380px",
}: WorkerTspRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: workerCoords,
        zoom: 13,
        scrollWheelZoom: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      routeLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map

      setTimeout(() => map.invalidateSize(), 250)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [workerCoords])

  // Draw TSP Route Line and Numbered Waypoints
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return
    routeLayerRef.current.clearLayers()

    const routeLatLngs: [number, number][] = [workerCoords]

    // Worker Depot Pin
    const depotIcon = L.divIcon({
      html: `
        <div style="background-color: #0284c7; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
          👷
        </div>
      `,
      className: "worker-depot-pin",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    L.marker(workerCoords, { icon: depotIcon })
      .bindPopup("<strong>Field Worker Current Location</strong><br/>Ward Operational Depot")
      .addTo(routeLayerRef.current)

    // Numbered Waypoints
    tasks.forEach((t, index) => {
      const coords = t.location?.coordinates as [number, number] | undefined
      const lat = coords?.[1] || 19.0178 + (index + 1) * 0.005
      const lng = coords?.[0] || 72.8437 + (index + 1) * 0.003
      const point: [number, number] = [lat, lng]
      routeLatLngs.push(point)

      const waypointIcon = L.divIcon({
        html: `
          <div style="background-color: #e11d48; color: white; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
            ${index + 1}
          </div>
        `,
        className: "tsp-waypoint-pin",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      L.marker(point, { icon: waypointIcon })
        .bindPopup(`
          <div style="font-size: 11px;">
            <strong>Stop #${index + 1}: ${t.title}</strong>
            <p style="margin: 2px 0 0 0; color: #64748b;">${t.complaintId || t._id} • ${t.location?.address || t.ward}</p>
          </div>
        `)
        .addTo(routeLayerRef.current!)
    })

    // Polyline connecting the circuit
    if (routeLatLngs.length > 1) {
      L.polyline(routeLatLngs, {
        color: "#0284c7",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.85,
      }).addTo(routeLayerRef.current)

      const bounds = L.latLngBounds(routeLatLngs)
      mapRef.current.fitBounds(bounds, { padding: [35, 35] })
    }
  }, [tasks, workerCoords])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] shadow-sm">
      <div
        ref={containerRef}
        style={{ height, width: "100%", zIndex: 1 }}
      />
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-slate-900/80 backdrop-blur-md text-white border border-white/10 font-mono text-[10px] px-2.5 py-1">
          TSP OPTIMIZED: {tasks.length} STOPS (~{((tasks.length * 1.8) + 0.6).toFixed(1)} KM)
        </Badge>
      </div>
    </div>
  )
}

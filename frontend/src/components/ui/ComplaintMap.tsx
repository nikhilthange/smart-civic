import React, { useEffect, useState, useRef } from "react"
import { Building2, ExternalLink, MapPin } from "lucide-react"
import { departmentApi, type Department } from "@/services/departmentApi"
import L from "@/lib/leafletSetup"
import "leaflet/dist/leaflet.css"

interface ComplaintMapProps {
  lat: number
  lng: number
  userLat?: number
  userLng?: number
  address?: string
}

const mapPinIcon = new L.DivIcon({
  html: `<div style="background:#4f46e5;color:white;padding:7px;border-radius:50%;box-shadow:0 0 14px rgba(79,70,229,0.8);border:2.5px solid white;display:flex;align-items:center;justify-content:center;">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: "custom-complaint-pin",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const userPinIcon = new L.DivIcon({
  html: `<div style="background:#0284c7;color:white;padding:7px;border-radius:50%;box-shadow:0 0 14px rgba(2,132,199,0.8);border:2.5px solid white;display:flex;align-items:center;justify-content:center;position:relative;">
    <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #38bdf8;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
  </div>`,
  className: "custom-user-pin",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

function ComplaintMapComponent({ lat, lng, userLat, userLng, address }: ComplaintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const [nearbyDepts, setNearbyDepts] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  // Initialize Leaflet mini-map with route polyline & auto-fit
  useEffect(() => {
    if (!mapContainerRef.current || isNaN(lat) || isNaN(lng)) return

    // Teardown previous map if coordinates changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || window.innerWidth < 768)
      const hasUserCoords = typeof userLat === "number" && typeof userLng === "number" && !isNaN(userLat) && !isNaN(userLng)

      const mapOptions: L.MapOptions = {
        center: [lat, lng],
        zoom: hasUserCoords ? 13 : 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
        preferCanvas: false,
        touchZoom: true,
        dragging: !isTouch,
      }

      const map = L.map(mapContainerRef.current, mapOptions)

      if (isTouch) {
        map.on("click", () => {
          map.dragging.enable()
        })
      }

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      // Target Incident Marker
      const targetMarker = L.marker([lat, lng], {
        icon: mapPinIcon,
        interactive: true,
        bubblingMouseEvents: true,
      }).addTo(map)

      targetMarker.bindPopup(
        `<div style="font-family:system-ui,sans-serif;font-size:12px;padding:3px 0;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;">🚨 Grievance Incident Site</strong>
          <span style="color:#64748b;font-size:11px;display:block;margin-bottom:3px;">${address || "Reported Location"}</span>
          <span style="color:#4f46e5;font-family:monospace;font-size:10px;font-weight:bold;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
        </div>`,
        { autoPan: true, closeButton: true }
      )

      // If user location is available, add user pin and fetch OSRM route
      if (hasUserCoords && (userLat !== lat || userLng !== lng)) {
        const userMarker = L.marker([userLat, userLng], {
          icon: userPinIcon,
          interactive: true,
        }).addTo(map)

        userMarker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:12px;padding:3px 0;">
            <strong style="color:#0284c7;display:block;margin-bottom:2px;">📍 You Are Here</strong>
            <span style="color:#64748b;font-size:11px;">Current GPS Position</span>
          </div>`
        )

        // Fetch live route polyline from OSRM
        const fetchRoute = async () => {
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${lng},${lat}?overview=full&geometries=geojson`
            const res = await fetch(url)
            if (res.ok) {
              const data = await res.json()
              if (data.routes && data.routes.length > 0) {
                const route = data.routes[0]
                const coords: [number, number][] = route.geometry.coordinates.map(
                  ([lon, la]: [number, number]) => [la, lon]
                )

                if (routePolylineRef.current) {
                  routePolylineRef.current.remove()
                }

                const polyline = L.polyline(coords, {
                  color: "#4f46e5",
                  weight: 4,
                  opacity: 0.85,
                  dashArray: "6, 8",
                  lineCap: "round",
                  lineJoin: "round",
                }).addTo(map)

                routePolylineRef.current = polyline
                map.fitBounds(polyline.getBounds(), { padding: [30, 30] })
                return
              }
            }
          } catch {
            // fallback bounds fitting
          }

          const group = L.featureGroup([targetMarker, userMarker])
          map.fitBounds(group.getBounds(), { padding: [35, 35] })
        }

        fetchRoute()
      }

      mapInstanceRef.current = map

      const resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 250)

      return () => {
        clearTimeout(resizeTimer)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    } catch {
      // Fallback handled gracefully
    }
  }, [lat, lng, userLat, userLng, address])

  useEffect(() => {
    let isMounted = true
    const fetchNearby = async () => {
      try {
        setLoadingDepts(true)
        const depts = await departmentApi.getNearby(lat, lng)
        if (isMounted) setNearbyDepts(depts)
      } catch {
        // silently ignore
      } finally {
        if (isMounted) setLoadingDepts(false)
      }
    }
    fetchNearby()
    return () => {
      isMounted = false
    }
  }, [lat, lng])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <div className="space-y-3">
      {/* Mini Map Container */}
      <div
        ref={mapContainerRef}
        className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 z-0"
        style={{ height: "240px", minHeight: "240px" }}
      />

      {/* Coordinates + Open in Maps link */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          Open Google Maps Directions ↗
        </a>
      </div>

      {/* Nearby Departments */}
      {(nearbyDepts.length > 0 || loadingDepts) && (
        <div className="pt-1">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            Nearby Municipal Wards & Departments
          </h4>
          {loadingDepts ? (
            <p className="text-xs text-slate-400">Locating municipal ward centers...</p>
          ) : (
            <ul className="space-y-1">
              {nearbyDepts.slice(0, 3).map((dept) => (
                <li key={dept._id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-200 text-[10px]">
                    {dept.code}
                  </span>
                  <span className="truncate">{dept.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(ComplaintMapComponent)


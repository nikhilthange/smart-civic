import React, { useEffect, useState, useRef } from "react"
import { Building2, ExternalLink, MapPin } from "lucide-react"
import { departmentApi, type Department } from "@/services/departmentApi"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface ComplaintMapProps {
  lat: number
  lng: number
}

const mapPinIcon = new L.DivIcon({
  html: `<div style="background:#4f46e5;color:white;padding:6px;border-radius:50%;box-shadow:0 0 12px rgba(79,70,229,0.7);border:2px solid white;display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: "custom-complaint-pin",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function ComplaintMapComponent({ lat, lng }: ComplaintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [nearbyDepts, setNearbyDepts] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  // Initialize Leaflet mini-map with canvas & cleanup
  useEffect(() => {
    if (!mapContainerRef.current || isNaN(lat) || isNaN(lng)) return

    // Teardown previous map if coordinates changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      const mapOptions: L.MapOptions & { tap?: boolean } = {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
        preferCanvas: false,
        // Disable Leaflet's legacy tap listener on touch devices to avoid iOS touch event interception conflicts
        tap: false,
        touchZoom: true,
      }

      const map = L.map(mapContainerRef.current, mapOptions)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([lat, lng], {
        icon: mapPinIcon,
        interactive: true,
        bubblingMouseEvents: true,
      }).addTo(map)

      marker.bindPopup(
        `<div style="font-family:system-ui,sans-serif;font-size:12px;padding:2px 0;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;">📍 Grievance Incident Site</strong>
          <span style="color:#64748b;font-family:monospace;font-size:11px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
        </div>`,
        {
          autoPan: true,
          closeButton: true,
        }
      )

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
  }, [lat, lng])

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

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="space-y-3">
      {/* Mini Map Container */}
      <div
        ref={mapContainerRef}
        className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 z-0"
        style={{ height: "220px", minHeight: "220px" }}
      />

      {/* Coordinates + Open in Maps link */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono flex items-center gap-1">
          <MapPin className="h-3 w-3 text-indigo-500" />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Google Maps
        </a>
      </div>

      {/* Nearby Departments */}
      {(nearbyDepts.length > 0 || loadingDepts) && (
        <div>
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Nearby Departments
          </h4>
          {loadingDepts ? (
            <p className="text-xs text-slate-400">Loading...</p>
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


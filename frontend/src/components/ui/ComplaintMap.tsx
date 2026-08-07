import { useEffect, useState } from "react"
import { Building2, ExternalLink } from "lucide-react"
import { departmentApi, type Department } from "@/services/departmentApi"

interface ComplaintMapProps {
  lat: number
  lng: number
}

export default function ComplaintMap({ lat, lng }: ComplaintMapProps) {
  const [nearbyDepts, setNearbyDepts] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        setLoadingDepts(true)
        const depts = await departmentApi.getNearby(lat, lng)
        setNearbyDepts(depts)
      } catch {
        // silently ignore - no departments with location data yet
      } finally {
        setLoadingDepts(false)
      }
    }
    fetchNearby()
  }, [lat, lng])

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className="space-y-3">
      {/* Map container */}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100" style={{ height: "220px" }}>
        {mapsApiKey && mapsApiKey !== "your_google_maps_api_key_here" ? (
          /* Google Maps Embed */
          <iframe
            title="Complaint Location"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${lat},${lng}&zoom=15`}
            allowFullScreen
          />
        ) : (
          /* OpenStreetMap fallback — free, no key needed */
          <iframe
            title="Complaint Location"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
            allowFullScreen
          />
        )}
      </div>

      {/* Coordinates + Open in Maps link */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono">
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
          <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Nearby Departments
          </h4>
          {loadingDepts ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : (
            <ul className="space-y-1">
              {nearbyDepts.map((dept) => (
                <li key={dept._id} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-slate-100 font-mono font-semibold text-slate-700 text-[10px]">
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

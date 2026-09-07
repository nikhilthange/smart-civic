import { useState, useEffect, useRef } from "react"
import { Truck, Phone, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import L from "@/lib/leafletSetup"
import "leaflet/dist/leaflet.css"
import api from "@/lib/axios"

interface LiveWorkerTrackingModalProps {
  isOpen: boolean
  ticketId: string
  onClose: () => void
}

const workerIcon = new L.DivIcon({
  html: `<div style="background:#0284c7;color:white;padding:6px;border-radius:50%;box-shadow:0 0 14px rgba(2,132,199,0.8);border:2px solid white;display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
  </div>`,
  className: "custom-worker-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const incidentIcon = new L.DivIcon({
  html: `<div style="background:#e11d48;color:white;padding:6px;border-radius:50%;box-shadow:0 0 14px rgba(225,29,72,0.8);border:2px solid white;display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: "custom-incident-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export function LiveWorkerTrackingModal({
  isOpen,
  ticketId,
  onClose,
}: LiveWorkerTrackingModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [telemetry, setTelemetry] = useState<any>({
    crewName: "BMC Ward H-West Quick Response Crew #3",
    crewLeader: "Suresh Gaikwad (Junior Road Inspector)",
    phone: "+91 98200 44122",
    vehicleType: "JETPATCHER_TRUCK",
    vehiclePlate: "MH-02-BQ-9104",
    workerLocation: [72.8315, 19.0540],
    incidentLocation: [72.8347, 19.0596],
    distanceKm: "0.85",
    etaMinutes: 4,
    etaText: "Arriving in ~4 mins (0.8 km away)",
    speedKmph: 26,
    status: "EN_ROUTE",
  })

  useEffect(() => {
    if (isOpen) {
      api.get(`/worker/track/${ticketId}`).then((res) => {
        if (res.data.data) setTelemetry(res.data.data)
      }).catch(() => {})
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    const workerPos: [number, number] = [telemetry.workerLocation[1], telemetry.workerLocation[0]]
    const incidentPos: [number, number] = [telemetry.incidentLocation[1], telemetry.incidentLocation[0]]

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: workerPos,
        zoom: 15,
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      L.marker(workerPos, { icon: workerIcon })
        .bindPopup(`<strong>${telemetry.crewName}</strong><br/>Vehicle: ${telemetry.vehiclePlate}`)
        .addTo(map)

      L.marker(incidentPos, { icon: incidentIcon })
        .bindPopup(`<strong>Incident Site</strong><br/>Ticket #${ticketId}`)
        .addTo(map)

      L.polyline([workerPos, incidentPos], {
        color: "#0284c7",
        weight: 4,
        dashArray: "6, 6",
      }).addTo(map)

      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 200)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, telemetry, ticketId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-sky-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Live Field Crew Dispatch Radar
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Real-time GPS vehicle telemetry for Ticket #{ticketId}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Live ETA Stats Banner */}
        <div className="p-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-300 uppercase block font-bold">Estimated Arrival</span>
              <div className="text-lg font-black font-mono text-white">
                {telemetry.etaMinutes} MINS <span className="text-xs text-slate-400">({telemetry.distanceKm} km)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-1">
              SPEED: {telemetry.speedKmph} KM/H
            </Badge>
            <Badge className="bg-sky-600 text-white font-mono text-xs px-2.5 py-1">
              {telemetry.vehiclePlate}
            </Badge>
          </div>
        </div>

        {/* Leaflet Live Map */}
        <div ref={mapContainerRef} className="h-72 w-full relative z-0" />

        {/* Crew Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{telemetry.crewLeader}</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">{telemetry.crewName}</div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${telemetry.phone}`}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Call Crew</span>
            </a>
            <Button size="sm" onClick={onClose} className="rounded-xl text-xs">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

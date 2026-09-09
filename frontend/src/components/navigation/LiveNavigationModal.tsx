import React, { useEffect, useRef, useState, useCallback } from "react"
import L from "@/lib/leafletSetup"
import "leaflet/dist/leaflet.css"
import {
  X, Volume2, VolumeX, Locate,
  CornerUpRight, CornerUpLeft,
  ArrowUp, Sparkles, Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

interface RouteStep {
  instruction: string
  distanceMeters: number
  modifier?: string
  type?: string
}

interface LiveNavigationModalProps {
  isOpen: boolean
  onClose: () => void
  targetLat: number
  targetLng: number
  targetAddress?: string
  ticketTitle?: string
  ticketId?: string
  onArrived?: () => void
}

const calculateHaversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const LiveNavigationModal: React.FC<LiveNavigationModalProps> = ({
  isOpen,
  onClose,
  targetLat,
  targetLng,
  targetAddress = "Reported Municipal Defect Location",
  ticketTitle = "Active Grievance",
  onArrived,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Current worker location (default initialized ~850m away from target for realism)
  const [currentPos, setCurrentPos] = useState<[number, number]>([
    targetLat - 0.006,
    targetLng - 0.005,
  ])
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(850)
  const [etaMinutes, setEtaMinutes] = useState<number>(3)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true)
  const [currentStep, setCurrentStep] = useState<RouteStep>({
    instruction: "Proceed toward target defect site",
    distanceMeters: 250,
  })
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [hasArrived, setHasArrived] = useState<boolean>(false)
  const lastSpokenInstructionRef = useRef<string>("")

  // Voice Guidance synthesizer
  const speakInstruction = useCallback((text: string) => {
    if (!isVoiceEnabled || !("speechSynthesis" in window)) return
    if (lastSpokenInstructionRef.current === text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-IN"
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
    lastSpokenInstructionRef.current = text
  }, [isVoiceEnabled])

  // Fetch driving route from OSRM
  const fetchRoute = useCallback(async (startLat: number, startLng: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`
      const res = await fetch(url)
      const data = await res.json()

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        )

        // Draw / Update Polyline on Leaflet
        if (mapInstanceRef.current) {
          if (routePolylineRef.current) {
            routePolylineRef.current.setLatLngs(coords)
          } else {
            const polyline = L.polyline(coords, {
              color: "#3b82f6",
              weight: 6,
              opacity: 0.85,
              lineJoin: "round",
            }).addTo(mapInstanceRef.current)
            routePolylineRef.current = polyline
          }
        }

        const dist = Math.round(route.distance)
        const dur = Math.max(1, Math.round(route.duration / 60))
        setRemainingDistanceMeters(dist)
        setEtaMinutes(dur)

        // Parse Step-by-Step Directions
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          const parsedSteps: RouteStep[] = route.legs[0].steps.map((s: any) => ({
            instruction: s.maneuver.instruction || (s.name ? `Proceed onto ${s.name}` : "Continue forward"),
            distanceMeters: Math.round(s.distance),
            modifier: s.maneuver.modifier,
            type: s.maneuver.type,
          }))
          if (parsedSteps.length > 0) {
            setCurrentStep(parsedSteps[0])
          }
        }
      }
    } catch {
      // Fallback: draw straight-line trajectory
      if (mapInstanceRef.current && !routePolylineRef.current) {
        const directCoords: [number, number][] = [
          [startLat, startLng],
          [targetLat, targetLng],
        ]
        const polyline = L.polyline(directCoords, {
          color: "#3b82f6",
          weight: 5,
          dashArray: "8, 8",
        }).addTo(mapInstanceRef.current)
        routePolylineRef.current = polyline
      }
      const directDist = Math.round(calculateHaversineMeters(startLat, startLng, targetLat, targetLng))
      setRemainingDistanceMeters(directDist)
      setEtaMinutes(Math.max(1, Math.round(directDist / 350)))
    }
  }, [targetLat, targetLng])

  // Initialize Map
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return
      if (mapInstanceRef.current) return

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(currentPos, 16)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      // 1. Destination Target Marker (Red Pin)
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `
          <div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })
      L.marker([targetLat, targetLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${targetAddress}`)

      // 2. User Live Location Marker (Blue Pulse Dot)
      const userIcon = L.divIcon({
        className: "custom-user-dot",
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; background-color: #3b82f6; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 24px; height: 24px; background-color: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.6);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const userMarker = L.marker(currentPos, { icon: userIcon }).addTo(map)
      userMarkerRef.current = userMarker

      mapInstanceRef.current = map

      // Initial route calculation
      fetchRoute(currentPos[0], currentPos[1])
    }, 150)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, fetchRoute, currentPos, targetLat, targetLng, targetAddress])

  // Real-time GPS Watcher
  useEffect(() => {
    if (!isOpen) return

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setCurrentPos(newPos)

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(newPos)
          }

          const dist = calculateHaversineMeters(newPos[0], newPos[1], targetLat, targetLng)
          setRemainingDistanceMeters(Math.round(dist))

          if (dist <= 50) {
            setHasArrived(true)
            speakInstruction("You have arrived at the target municipal defect location.")
          }
        },
        () => {
          // GPS fallback
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isOpen, targetLat, targetLng, speakInstruction])

  // Simulator step runner for live testing
  const handleSimulateStep = () => {
    setIsSimulating(true)
    const stepRatio = 0.4
    const newLat = currentPos[0] + (targetLat - currentPos[0]) * stepRatio
    const newLng = currentPos[1] + (targetLng - currentPos[1]) * stepRatio
    const newPos: [number, number] = [newLat, newLng]

    setCurrentPos(newPos)
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(newPos)
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(newPos, { animate: true })
    }

    const dist = calculateHaversineMeters(newLat, newLng, targetLat, targetLng)
    const roundedDist = Math.round(dist)
    setRemainingDistanceMeters(roundedDist)
    setEtaMinutes(Math.max(1, Math.round(roundedDist / 350)))

    if (roundedDist <= 50) {
      setHasArrived(true)
      speakInstruction("You have arrived at the target municipal defect location.")
      toast.success("🎯 You have arrived on-site (within 50m)!")
    } else {
      speakInstruction(`In ${roundedDist} meters, continue straight toward defect location.`)
    }
  }

  // Recenter map on user position
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentPos, 17, { animate: true })
    }
  }

  if (!isOpen) return null

  const getManeuverIcon = () => {
    const text = currentStep.instruction.toLowerCase()
    if (text.includes("right")) return <CornerUpRight className="w-6 h-6 text-white" />
    if (text.includes("left")) return <CornerUpLeft className="w-6 h-6 text-white" />
    return <ArrowUp className="w-6 h-6 text-white" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative bg-slate-900 w-full max-w-4xl h-[92vh] sm:h-[88vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        {/* ── TOP HUD NAVIGATION BANNER ── */}
        <div className="z-20 bg-slate-900/95 backdrop-blur-md p-4 border-b border-slate-800 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-3 bg-emerald-600 rounded-2xl shrink-0 shadow-lg shadow-emerald-600/30">
              {getManeuverIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-emerald-400">
                  {remainingDistanceMeters > 1000
                    ? `${(remainingDistanceMeters / 1000).toFixed(1)} km`
                    : `${remainingDistanceMeters} m`}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 truncate">
                  {ticketTitle}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                {hasArrived ? "🎯 Arrived at Destination Site" : currentStep.instruction}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`border-slate-700 text-xs px-2.5 h-9 ${
                isVoiceEnabled ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" : "bg-slate-800 text-slate-400"
              }`}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 h-9 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ── MAP CONTAINER ── */}
        <div className="relative flex-1 w-full bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick Floating Map Actions */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={handleRecenter}
              className="bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-lg p-2.5 h-10 w-10 flex items-center justify-center backdrop-blur-md"
            >
              <Locate className="w-5 h-5 text-indigo-600" />
            </Button>
          </div>

          {/* Test Approach Simulator Floating Button */}
          <div className="absolute left-4 bottom-4 z-10">
            <Button
              size="sm"
              onClick={handleSimulateStep}
              className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/40 text-xs font-bold gap-1.5 shadow-lg backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSimulating ? "Step Closer (Simulate GPS)" : "Simulate Worker Approach"}
            </Button>
          </div>
        </div>

        {/* ── BOTTOM LIVE METRICS & ARREST CONTROLS ── */}
        <div className="z-20 bg-slate-900 p-4 sm:p-5 border-t border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Distance</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {remainingDistanceMeters > 1000
                  ? `${(remainingDistanceMeters / 1000).toFixed(1)} km`
                  : `${remainingDistanceMeters} m`}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Est. ETA</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {etaMinutes} min
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Target Destination</span>
              <p className="text-xs text-slate-300 truncate max-w-[200px]">
                {targetAddress}
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasArrived || remainingDistanceMeters <= 50 ? (
              <Button
                onClick={() => {
                  onClose()
                  if (onArrived) onArrived()
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-emerald-950/40 gap-2 h-11 px-6 rounded-xl transition-all"
              >
                <Wrench className="w-4 h-4" />
                Arrived On-Site: Submit Resolution Proof
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto border-slate-700 text-slate-300 hover:text-white text-xs h-11 px-5 rounded-xl"
              >
                Exit Navigation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

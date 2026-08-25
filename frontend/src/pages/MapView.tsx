import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.heat"
import {
  Filter, MapPin, Layers, RefreshCw, Flame,
  Search, Eye, AlertTriangle, Building2, Radio
} from "lucide-react"
import { complaintApi, type Complaint, CATEGORY_LABELS, STATUS_CONFIG } from "@/services/complaintApi"
import { getImageUrl, handleImageError, FALLBACK_IMAGE } from "@/utils/imageUrl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IotTelemetrySimulatorModal } from "@/components/common/IotTelemetrySimulatorModal"

import { useSocket } from "@/context/SocketContext"

// Map default center: Mumbai BMC Civic Center
const MUMBAI_CENTER: [number, number] = [19.0760, 72.8777]

// Ward Coordinates fallback dictionary
const WARD_COORDINATES: Record<string, [number, number]> = {
  "Ward A": [18.9322, 72.8277], // Colaba / Fort
  "Ward H-West": [19.0596, 72.8347], // Bandra West
  "Ward G-South": [19.0178, 72.8427], // Worli / Parel
  "Ward K-East": [19.1136, 72.8697], // Andheri East
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  critical: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", fill: "#dc2626" },
  high: { bg: "#ffedd5", border: "#f97316", text: "#9a3412", fill: "#ea580c" },
  medium: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", fill: "#d97706" },
  low: { bg: "#dcfce7", border: "#22c55e", text: "#166534", fill: "#16a34a" },
}

import toast from "react-hot-toast"

export default function MapView() {
  const { lastEvent } = useSocket()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter & Layer States
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedWard, setSelectedWard] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"map" | "grid">("map")
  const [mapLayerMode, setMapLayerMode] = useState<"clusters" | "heatmap">("clusters")

  const [activeHotspotAlert, setActiveHotspotAlert] = useState<{
    ward?: string
    lat?: number
    lng?: number
    count?: number
    message?: string
  } | null>(null)
  const [isIotSimulatorOpen, setIsIotSimulatorOpen] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)

  // Fetch Complaints
  const fetchComplaints = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await complaintApi.getAll({ limit: 100 })
      setComplaints(data.complaints || [])
    } catch {
      if (!silent) setError("Failed to load map complaint markers. Please try again.")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComplaints()

    // Real-time polling synchronization fallback (every 15s)
    const interval = setInterval(() => {
      fetchComplaints(true)
    }, 15000)

    const onFocus = () => fetchComplaints(true)
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [fetchComplaints])

  // Instant reactive WebSocket event refresh & Hotspot Radar
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === "HOTSPOT_ALERT" || (lastEvent as any).event === "HOTSPOT_ALERT") {
        const payload = (lastEvent as any).payload || lastEvent
        setActiveHotspotAlert({
          ward: payload.ward,
          lat: payload.lat,
          lng: payload.lng,
          count: payload.count,
          message: payload.message,
        })
        toast.error(`🌊 EMERGENCY: Active Monsoon Flood Hotspot detected in ${payload.ward || "Mumbai"}!`, {
          duration: 7000,
          icon: "🚨",
        })
      }
      fetchComplaints(true)
    }
  }, [lastEvent, fetchComplaints])

  // Filter Logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false
      if (selectedWard !== "all" && (item.ward || "Ward A") !== selectedWard) return false
      if (selectedSeverity !== "all" && item.priority !== selectedSeverity) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchId = item.complaintId.toLowerCase().includes(q)
        const matchAddr = item.location?.address?.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchAddr) return false
      }
      return true
    })
  }, [complaints, selectedCategory, selectedStatus, selectedWard, selectedSeverity, searchQuery])

  // Initialize Leaflet Map and Marker Cluster Group once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: MUMBAI_CENTER,
      zoom: 12,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Smart Civic GIS',
      maxZoom: 19,
    }).addTo(map)

    // Dynamic Severity-aware Cluster Group
    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: function (cluster: any) {
        const markers = cluster.getAllChildMarkers()
        const count = markers.length

        let hasCritical = false
        let hasHigh = false
        let hasMedium = false

        markers.forEach((m: any) => {
          const p = m.options?.priority || "medium"
          if (p === "critical") hasCritical = true
          else if (p === "high") hasHigh = true
          else if (p === "medium") hasMedium = true
        })

        let clusterColor = "#22c55e" // Low (Green)
        let clusterBg = "rgba(34, 197, 94, 0.25)"
        let clusterBorder = "#16a34a"

        if (hasCritical) {
          clusterColor = "#dc2626" // Critical (Red)
          clusterBg = "rgba(220, 38, 38, 0.35)"
          clusterBorder = "#b91c1c"
        } else if (hasHigh || hasMedium) {
          clusterColor = "#f59e0b" // High / Medium (Amber/Orange)
          clusterBg = "rgba(245, 158, 11, 0.30)"
          clusterBorder = "#d97706"
        }

        return L.divIcon({
          html: `
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: ${clusterBg};
              border: 1.5px solid ${clusterBorder};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            ">
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${clusterColor};
                color: #ffffff;
                font-weight: 800;
                font-size: 13px;
                font-family: system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #ffffff;
                box-shadow: inset 0 1px 2px rgba(255,255,255,0.4);
              ">
                ${count}
              </div>
            </div>
          `,
          className: "custom-cluster-marker",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })
      },
    })

    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      clusterGroupRef.current = null
    }
  }, [])

  // Update Markers or Heatmap on Filter, Mode, or Complaints change
  useEffect(() => {
    const map = mapInstanceRef.current
    const clusterGroup = clusterGroupRef.current
    if (!map) return

    // Clear existing heatLayer if any
    if (heatLayerRef.current) {
      if (map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current)
      }
      heatLayerRef.current = null
    }

    // Clear cluster group
    if (clusterGroup) {
      clusterGroup.clearLayers()
    }

    const bounds: L.LatLngExpression[] = []
    const heatPoints: [number, number, number][] = []

    filteredComplaints.forEach((c) => {
      let lat = c.location?.coordinates?.coordinates?.[1]
      let lng = c.location?.coordinates?.coordinates?.[0]

      // Fallback to ward preset coordinates if missing
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const preset = WARD_COORDINATES[c.ward || "Ward A"] || MUMBAI_CENTER
        lat = preset[0] + (Math.random() - 0.5) * 0.02
        lng = preset[1] + (Math.random() - 0.5) * 0.02
      }

      bounds.push([lat, lng])

      // Calculate intensity for heatmap (0.2 to 1.0)
      const intensity = c.priority === "critical" ? 1.0 : c.priority === "high" ? 0.75 : c.priority === "medium" ? 0.5 : 0.25
      heatPoints.push([lat, lng, intensity])

      if (mapLayerMode === "clusters" && clusterGroup) {
        const color = SEVERITY_COLORS[c.priority] || SEVERITY_COLORS.medium
        const isCritical = c.priority === "critical"

        // Custom Leaflet DivIcon
        const customIcon = L.divIcon({
          className: "custom-map-marker",
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background-color: ${color.fill};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${isCritical ? `<div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                border: 2px solid ${color.fill};
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>` : ""}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

        const marker = (L.marker as any)([lat, lng], {
          icon: customIcon,
          priority: c.priority || "medium",
        })

        const categoryLabel = CATEGORY_LABELS[c.category] || c.category.replace(/_/g, " ")
        const statusLabel = STATUS_CONFIG[c.status]?.label || c.status
        const priorityBadge = SEVERITY_COLORS[c.priority] || SEVERITY_COLORS.medium
        const thumbUrl = c.attachments && c.attachments[0] ? getImageUrl(c.attachments[0]) : null

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 220px; max-width: 280px; padding: 2px;">
            ${thumbUrl ? `
              <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #f1f5f9;">
                <img src="${thumbUrl}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${FALLBACK_IMAGE}'" />
              </div>
            ` : ""}
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                ${c.complaintId || c._id.slice(-6)}
              </span>
              <span style="
                font-size: 10px;
                font-weight: 800;
                padding: 2px 6px;
                border-radius: 4px;
                background-color: ${priorityBadge.bg};
                color: ${priorityBadge.text};
                border: 1px solid ${priorityBadge.border};
                text-transform: uppercase;
              ">
                ${c.priority}
              </span>
            </div>
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3;">
              ${c.title}
            </h3>
            <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
              <div><strong>Category:</strong> ${categoryLabel}</div>
              <div><strong>Ward:</strong> ${c.ward || "Ward A"}</div>
              <div><strong>Status:</strong> ${statusLabel}</div>
              <div style="margin-top: 4px; color: #64748b; font-size: 11px;">${c.location?.address || "Mumbai, India"}</div>
            </div>
            <a href="/complaint/${c._id}/track" style="
              display: block;
              text-align: center;
              background-color: #4f46e5;
              color: #ffffff;
              font-size: 12px;
              font-weight: 600;
              padding: 6px 12px;
              border-radius: 6px;
              text-decoration: none;
              transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#4338ca'" onmouseout="this.style.backgroundColor='#4f46e5'">
              Track Complaint &rarr;
            </a>
          </div>
        `

        marker.bindPopup(popupContent)
        clusterGroup.addLayer(marker)
      }
    })

    if (mapLayerMode === "heatmap") {
      if (clusterGroup && map.hasLayer(clusterGroup)) {
        map.removeLayer(clusterGroup)
      }
      if (heatPoints.length > 0) {
        const heat = (L as any).heatLayer(heatPoints, {
          radius: 30,
          blur: 20,
          maxZoom: 16,
          gradient: {
            0.2: "#22c55e",
            0.4: "#eab308",
            0.7: "#f97316",
            1.0: "#dc2626",
          },
        })
        heat.addTo(map)
        heatLayerRef.current = heat
      }
    } else {
      if (clusterGroup && !map.hasLayer(clusterGroup)) {
        map.addLayer(clusterGroup)
      }
    }

    if (bounds.length > 0 && map) {
      try {
        map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 14 })
      } catch {
        // fallback
      }
    }
  }, [filteredComplaints, mapLayerMode])

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto w-full">
      {/* Active Monsoon Flood Emergency Radar Banner */}
      {activeHotspotAlert && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl animate-pulse gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-xl shrink-0">
              🌊
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                Active Monsoon Flood Hotspot in {activeHotspotAlert.ward || "Mumbai"}!
                <span className="bg-white/30 text-white text-[10px] uppercase font-mono px-2 py-0.5 rounded-full">
                  {activeHotspotAlert.count} Critical Reports
                </span>
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                {activeHotspotAlert.message || "Multiple high-severity drainage and waterlogging complaints clustered within 500m."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeHotspotAlert.lat && activeHotspotAlert.lng && (
              <Button
                size="sm"
                onClick={() => {
                  if (mapInstanceRef.current && activeHotspotAlert.lat && activeHotspotAlert.lng) {
                    mapInstanceRef.current.flyTo([activeHotspotAlert.lat, activeHotspotAlert.lng], 16, { animate: true, duration: 1.5 })
                  }
                }}
                className="bg-white text-red-700 hover:bg-white/90 font-extrabold text-xs shadow-md shrink-0"
              >
                🎯 Zoom to Flood Hotspot
              </Button>
            )}
            <button
              onClick={() => setActiveHotspotAlert(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Interactive Public GIS Map
            </h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Live Municipal GIS
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time spatial visualization of active civic tickets across BMC Wards
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Map Layer Switcher */}
          {activeTab === "map" && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setMapLayerMode("clusters")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                  mapLayerMode === "clusters"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Clustered Pins
              </button>
              <button
                type="button"
                onClick={() => setMapLayerMode("heatmap")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                  mapLayerMode === "heatmap"
                    ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Defect Heatmap
              </button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setIsIotSimulatorOpen(true)}
            className="gap-1.5 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
            📡 IoT Simulator
          </Button>

          <Button
            variant={activeTab === "map" ? "default" : "outline"}
            onClick={() => setActiveTab("map")}
            className="gap-2 text-xs"
          >
            <Layers className="h-4 w-4" />
            Map View
          </Button>
          <Button
            variant={activeTab === "grid" ? "default" : "outline"}
            onClick={() => setActiveTab("grid")}
            className="gap-2 text-xs"
          >
            <Eye className="h-4 w-4" />
            Grid View ({filteredComplaints.length})
          </Button>
          <Button onClick={() => fetchComplaints(false)} variant="outline" size="icon" title="Refresh Map">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* IoT Telemetry Simulator Modal */}
      <IotTelemetrySimulatorModal
        isOpen={isIotSimulatorOpen}
        onClose={() => setIsIotSimulatorOpen(false)}
        onTelemetrySent={() => fetchComplaints(true)}
      />

      {/* Filter Bar */}
      <Card className="glass-card shadow-sm border-slate-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket title, ID, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="roads_and_infrastructure">Potholes & Infrastructure</option>
                <option value="water_and_sanitation">Waterlogging & Sanitation</option>
                <option value="garbage_collection">Garbage Collection</option>
                <option value="street_lighting">Street Lighting</option>
                <option value="drainage">Drainage Issues</option>
                <option value="public_safety">Public Safety</option>
              </select>
            </div>

            {/* Ward Filter */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="all">All Wards</option>
              <option value="Ward A">Ward A (Colaba)</option>
              <option value="Ward H-West">Ward H-West (Bandra)</option>
              <option value="Ward G-South">Ward G-South (Worli)</option>
              <option value="Ward K-East">Ward K-East (Andheri)</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical Severity</option>
              <option value="high">🟠 High Severity</option>
              <option value="medium">🟡 Medium Severity</option>
              <option value="low">🟢 Low Severity</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="all">All Ticket Statuses</option>
              <option value="pending">Pending</option>
              <option value="ai_verified">AI Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Total Badge */}
            <Badge className="bg-indigo-600 text-white font-mono text-xs ml-auto">
              {filteredComplaints.length} Tickets Found
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {activeTab === "map" ? (
        <Card className="shadow-md overflow-hidden border-slate-200">
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <MapPin className="h-4 w-4 text-indigo-600" />
                Live Map View (Leaflet OpenStreetMap)
              </CardTitle>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Critical</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600"></span> Low</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-xs border-b border-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div
              ref={mapContainerRef}
              className="w-full h-[620px] bg-slate-100 z-10"
              style={{ minHeight: "500px" }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Grid Fallback View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComplaints.map((c) => {
            const color = SEVERITY_COLORS[c.priority] || SEVERITY_COLORS.medium
            return (
              <Card key={c._id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{c.complaintId}</span>
                    <Badge className="text-[10px] uppercase font-bold" style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                      {c.priority}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{c.title}</h3>
                  {c.attachments && c.attachments[0] && (
                    <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                      <img
                        src={getImageUrl(c.attachments[0])}
                        onError={handleImageError}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                      {c.ward || "Ward A"}
                    </span>
                    <Link to={`/complaint/${c._id}/track`} className="font-semibold text-indigo-600 hover:underline">
                      Track &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

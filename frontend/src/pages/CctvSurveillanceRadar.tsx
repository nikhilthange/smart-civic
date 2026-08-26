import { useState, useEffect, useCallback } from "react"
import {
  Cctv,
  RefreshCw,
  Zap,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { nextGenApi, type CctvCameraData } from "@/services/nextGenApi"
import MunicipalLeafletRadarMap from "@/components/common/MunicipalLeafletRadarMap"

export default function CctvSurveillanceRadar() {
  const [cameras, setCameras] = useState<CctvCameraData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")
  const [analyzingCameraId, setAnalyzingCameraId] = useState<string | null>(null)
  const [activeAnomaly, setActiveAnomaly] = useState<string>("DEBRIS_DUMPING")

  const fetchCameras = useCallback(async () => {
    try {
      setLoading(true)
      const res = await nextGenApi.getCctvCameras(selectedWard)
      setCameras(res.cameras || [])
    } catch {
      toast.error("Failed to load CCTV camera telemetry")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  const handleSimulateFrameGrabber = async (cameraId: string) => {
    setAnalyzingCameraId(cameraId)
    try {
      const res = await nextGenApi.analyzeCctvFrame({
        cameraId,
        simulatedAnomalyType: activeAnomaly,
        confidence: 0.94,
      })
      toast.error(res.message, { icon: "📹", duration: 7000 })
      await fetchCameras()
    } catch {
      toast.error("Failed to run frame grabber YOLO detection")
    } finally {
      setAnalyzingCameraId(null)
    }
  }

  const mapMarkers = cameras.map((c) => ({
    id: c.cameraId,
    lat: c.coordinates ? c.coordinates[1] : 19.0760,
    lng: c.coordinates ? c.coordinates[0] : 72.8777,
    title: c.cameraName,
    subtitle: c.junction,
    status: c.feedStatus,
    severity: (c.feedStatus === "ANOMALY_FLAGGED" ? "critical" : "success") as "critical" | "success",
    badgeText: c.feedStatus === "ANOMALY_FLAGGED" ? "ANOMALY DETECTED" : "LIVE STREAM",
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              CCTV Surveillance & Frame-Grabber AI
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE 4K PTZ FEEDS
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            AI frame grabber detecting illegal debris dumping, waterlogging, and encroachment with zero-touch ticket dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward G-North">Ward G-North (Dadar / Dharavi)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>

          <Button
            onClick={fetchCameras}
            variant="outline"
            size="sm"
            className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Feeds</span>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Active Camera Grid
          </span>
          <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono tabular-nums">
            {cameras.length} Feeds
          </div>
          <p className="text-xs text-zinc-400">Municipal Command Surveillance</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            AI Anomalies Flagged
          </span>
          <div className="text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400 font-mono tabular-nums">
            {cameras.filter((c) => c.feedStatus === "ANOMALY_FLAGGED").length} Incidents
          </div>
          <p className="text-xs text-zinc-400">Zero-touch tickets auto-dispatched</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Edge YOLO Confidence
          </span>
          <div className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            94.8%
          </div>
          <p className="text-xs text-zinc-400">Sub-second visual anomaly classification</p>
        </div>
      </div>

      {/* Interactive GIS Camera Map */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Live Spatial CCTV Stream Density</span>
        </h3>
        <MunicipalLeafletRadarMap markers={mapMarkers} height="360px" />
      </div>

      {/* Anomaly Simulator Controls */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
            Frame Grabber Target Anomaly:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActiveAnomaly("DEBRIS_DUMPING")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                activeAnomaly === "DEBRIS_DUMPING"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              🗑️ Debris Dumping
            </button>
            <button
              type="button"
              onClick={() => setActiveAnomaly("WATERLOGGING")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                activeAnomaly === "WATERLOGGING"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              🌊 Waterlogging
            </button>
            <button
              type="button"
              onClick={() => setActiveAnomaly("ILLEGAL_ENCROACHMENT")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                activeAnomaly === "ILLEGAL_ENCROACHMENT"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              🏬 Encroachment
            </button>
          </div>
        </div>
      </div>

      {/* CCTV Camera Stream Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cameras.map((cam) => {
          const isAnomaly = cam.feedStatus === "ANOMALY_FLAGGED"
          const isAnalyzing = analyzingCameraId === cam.cameraId

          return (
            <div
              key={cam.cameraId}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm flex flex-col"
            >
              {/* Simulated Camera Video Viewport */}
              <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden group">
                {/* Background Video Simulator Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Camera Top HUD */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90 z-10">
                  <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    REC • {cam.cameraId}
                  </span>
                  <Badge className="bg-black/60 text-white text-[9px] px-2 py-0 border-white/20">
                    4K PTZ 60FPS
                  </Badge>
                </div>

                {/* Simulated YOLO Bounding Box Overlay */}
                {isAnomaly && cam.lastDetectedAnomaly && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${cam.lastDetectedAnomaly.boundingBox[0]}%`,
                      top: `${cam.lastDetectedAnomaly.boundingBox[1]}%`,
                      width: `${cam.lastDetectedAnomaly.boundingBox[2]}%`,
                      height: `${cam.lastDetectedAnomaly.boundingBox[3]}%`,
                    }}
                    className="border-2 border-rose-500 bg-rose-500/15 rounded z-10 animate-pulse flex flex-col justify-start"
                  >
                    <span className="bg-rose-600 text-white text-[9px] font-mono font-bold px-1 py-0.5 w-max rounded-b">
                      {cam.lastDetectedAnomaly.anomalyType} ({(cam.lastDetectedAnomaly.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                )}

                <div className="text-center space-y-1 z-0">
                  <Cctv className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-[11px] font-mono text-slate-400">{cam.cameraName}</p>
                </div>

                {/* Camera Bottom HUD */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[9px] font-mono text-slate-400 z-10">
                  <span>LAT: {cam.coordinates ? cam.coordinates[1].toFixed(4) : "19.0760"}</span>
                  <span>LNG: {cam.coordinates ? cam.coordinates[0].toFixed(4) : "72.8777"}</span>
                </div>
              </div>

              {/* Feed Meta & Actions */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {cam.junction}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">{cam.ward}</span>
                  </div>

                  {cam.lastDetectedAnomaly && (
                    <div className="mt-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] space-y-0.5">
                      <div className="flex justify-between font-bold text-rose-800 dark:text-rose-200">
                        <span>🚨 {cam.lastDetectedAnomaly.anomalyType}</span>
                        <span className="font-mono">{(cam.lastDetectedAnomaly.confidence * 100).toFixed(0)}% Conf</span>
                      </div>
                      <p className="text-rose-600 dark:text-rose-400 font-mono">
                        Ticket: {cam.lastDetectedAnomaly.autoComplaintId}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSimulateFrameGrabber(cam.cameraId)}
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold py-2 gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? "Analyzing Frame..." : "Run AI Frame Grabber"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

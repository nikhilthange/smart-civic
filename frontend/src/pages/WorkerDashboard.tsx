import { useState, useEffect, useRef } from "react"
import {
  Wrench, MapPin, CheckCircle2, Camera, X, Loader2, Navigation, WifiOff, CloudUpload, Route, Sparkles
} from "lucide-react"
import { complaintApi, type Complaint, CATEGORY_LABELS, STATUS_CONFIG } from "@/services/complaintApi"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { CameraCaptureModal } from "@/components/common/CameraCaptureModal"
import { ComplaintDetailModal } from "@/components/common/ComplaintDetailModal"
import { LiveNavigationModal } from "@/components/navigation/LiveNavigationModal"
import { useSocket } from "@/context/SocketContext"
import { saveOfflineResolution, syncOfflineQueue, getOfflineQueue } from "@/utils/offlineQueue"
import { optimizeDailyTaskRoute, type OptimizedRouteResult, getTaskCoordinates } from "@/utils/routeOptimizer"
import WorkerTspRouteMap from "@/components/worker/WorkerTspRouteMap"
import { GeofenceProximityRadar } from "@/components/worker/GeofenceProximityRadar"
import { ResolutionDiffSlider } from "@/components/worker/ResolutionDiffSlider"
import { compressFieldImage } from "@/utils/imageCompressor"

export default function WorkerDashboard() {
  const { lastEvent } = useSocket()
  const [tasks, setTasks] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null)
  const [detailModalTask, setDetailModalTask] = useState<Complaint | null>(null)
  const [navigatingTask, setNavigatingTask] = useState<Complaint | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineCount, setOfflineCount] = useState(getOfflineQueue().length)
  const [routeOptResult, setRouteOptResult] = useState<OptimizedRouteResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Resolution Form State
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [compressedStats, setCompressedStats] = useState<{ originalKb: number; compressedKb: number; ratio: number } | null>(null)
  const [notes, setNotes] = useState("")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchWorkerTasks = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await api.get("/complaints/worker-tasks")
      setTasks(res.data.complaints || [])
    } catch {
      // Fallback to fetch assigned complaints
      try {
        const fallback = await complaintApi.getAll({ status: "assigned,in_progress,worker_assigned" })
        setTasks(fallback.complaints || [])
      } catch {
        if (!silent) toast.error("Failed to load assigned field tasks.")
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkerTasks()

    // Auto-sync polling every 10s
    const timer = setInterval(() => {
      fetchWorkerTasks(true)
      setOfflineCount(getOfflineQueue().length)
    }, 10000)

    const handleOnline = () => {
      setIsOnline(true)
      toast.success("📶 Connection restored. Syncing offline tasks...")
      syncOfflineQueue(() => {
        setOfflineCount(getOfflineQueue().length)
        fetchWorkerTasks(true)
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error("⚠️ Offline mode active. Action queue enabled.")
    }

    const onFocus = () => fetchWorkerTasks(true)
    window.addEventListener("focus", onFocus)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Reactive WebSocket event sync
  useEffect(() => {
    if (lastEvent) {
      fetchWorkerTasks(true)
    }
  }, [lastEvent])

  const handleOptimizeRoute = async () => {
    if (tasks.length === 0) {
      toast.error("No active tasks to optimize.")
      return
    }

    setIsOptimizing(true)
    try {
      let startCoords: [number, number] = [19.0596, 72.8295]
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true })
          })
          startCoords = [pos.coords.latitude, pos.coords.longitude]
        } catch {
          startCoords = getTaskCoordinates(tasks[0])
        }
      }

      const result = optimizeDailyTaskRoute(startCoords, tasks)
      setTasks(result.orderedTasks)
      setRouteOptResult(result)

      const hrs = Math.floor(result.totalDurationMins / 60)
      const mins = result.totalDurationMins % 60
      const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`

      toast.success(
        `🚀 Daily TSP Route Optimized: ${result.orderedTasks.length} stops (${result.totalDistanceKm} km • ~${durationStr})!`,
        { duration: 5000, icon: "⚡" }
      )
    } catch {
      toast.error("Failed to compute optimal route.")
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0]
      try {
        const compressed = await compressFieldImage(rawFile)
        setProofFile(compressed.file)
        setFilePreview(compressed.previewUrl)
        setCompressedStats({
          originalKb: compressed.originalSizeKb,
          compressedKb: compressed.compressedSizeKb,
          ratio: compressed.compressionRatioPct,
        })
        toast.success(`⚡ Low-Bandwidth Auto-Compress: ${compressed.originalSizeKb}KB ➔ ${compressed.compressedSizeKb}KB (${compressed.compressionRatioPct}% reduction)`, {
          icon: "🚀",
          duration: 4000,
        })
      } catch {
        setProofFile(rawFile)
        const reader = new FileReader()
        reader.onloadend = () => setFilePreview(reader.result as string)
        reader.readAsDataURL(rawFile)
      }
    }
  }

  const handleRemoveFile = () => {
    setProofFile(null)
    setFilePreview(null)
    setCompressedStats(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return
    if (!proofFile && !filePreview) {
      toast.error("Mandatory after-resolution proof photo is required!")
      return
    }

    // Check if device is offline
    if (!navigator.onLine) {
      if (filePreview) {
        saveOfflineResolution({
          complaintId: selectedTask._id,
          notes,
          imageBase64: filePreview,
          filename: proofFile?.name || "offline_proof.jpg",
        })
        setOfflineCount(getOfflineQueue().length)
        setSelectedTask(null)
        handleRemoveFile()
        setNotes("")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      if (proofFile) {
        formData.append("resolutionImage", proofFile)
      }
      formData.append("notes", notes)

      // Try capturing worker on-site GPS coordinates for anti-fraud geo-fence check
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true })
          })
          formData.append("workerLat", String(pos.coords.latitude))
          formData.append("workerLng", String(pos.coords.longitude))
        } catch {
          // If GPS denied/timed out, allow submission without hard client crash
        }
      }

      if (selectedMaterials.length > 0) {
        const matObjects = selectedMaterials.map((code) => ({ itemCode: code, quantity: 1 }))
        formData.append("materialsUsed", JSON.stringify(matObjects))
      }

      await api.put(`/complaints/${selectedTask._id}/worker-submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Resolution proof submitted successfully!")
      setSelectedTask(null)
      handleRemoveFile()
      setNotes("")
      setSelectedMaterials([])
      fetchWorkerTasks()
    } catch (err: any) {
      // If network error, fallback to offline queue
      if (!err.response && filePreview) {
        saveOfflineResolution({
          complaintId: selectedTask._id,
          notes,
          imageBase64: filePreview,
          filename: proofFile?.name || "offline_proof.jpg",
        })
        setOfflineCount(getOfflineQueue().length)
        setSelectedTask(null)
        handleRemoveFile()
        setNotes("")
      } else {
        toast.error(err.response?.data?.message || "Failed to submit resolution proof.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="flex items-center justify-between p-4 bg-amber-500 text-white rounded-xl shadow-md animate-pulse">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff className="w-5 h-5" />
            Offline Mode: Working without internet. Task proofs will be stored locally and synced automatically when online.
          </div>
          {offlineCount > 0 && (
            <span className="text-xs bg-amber-700 px-3 py-1 rounded-full font-bold">
              {offlineCount} Queued Actions
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Municipal Field Worker Portal</h1>
            <p className="text-slate-500 text-sm mt-0.5">Assigned On-Site Repair & Resolution Task Queue</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          {/* TSP Route Optimizer Action */}
          <button
            type="button"
            onClick={handleOptimizeRoute}
            disabled={isOptimizing || tasks.length === 0}
            className="flex items-center gap-2 text-xs font-extrabold px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            {isOptimizing ? "Optimizing Route..." : "⚡ Optimize Daily Route (TSP)"}
          </button>

          {offlineCount > 0 && (
            <button
              onClick={() => syncOfflineQueue(() => {
                setOfflineCount(getOfflineQueue().length)
                fetchWorkerTasks(true)
              })}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <CloudUpload className="w-4 h-4" />
              Sync {offlineCount} Queued
            </button>
          )}
          <span className="text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
            {tasks.length} Active Tasks
          </span>
        </div>
      </div>

      {/* Optimized Daily Route Statistics Banner & Interactive TSP Map */}
      {routeOptResult && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg border border-indigo-700/50 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-lg text-amber-300">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  Optimal Daily Shift Circuit (TSP)
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Shortest Path
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Tasks arranged in optimal driving sequence to minimize travel time across Mumbai wards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/10">
              <div>
                <span className="text-[10px] text-indigo-300 uppercase block font-sans">Stops</span>
                {routeOptResult.orderedTasks.length} Sites
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-indigo-300 uppercase block font-sans">Distance</span>
                {routeOptResult.totalDistanceKm} km
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-indigo-300 uppercase block font-sans">Est. Shift</span>
                {Math.floor(routeOptResult.totalDurationMins / 60) > 0
                  ? `${Math.floor(routeOptResult.totalDurationMins / 60)}h ${routeOptResult.totalDurationMins % 60}m`
                  : `${routeOptResult.totalDurationMins}m`}
              </div>
            </div>
          </div>

          <WorkerTspRouteMap tasks={tasks} height="320px" />
        </div>
      )}

      {/* Task Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">All Field Tasks Complete</h3>
          <p className="text-sm text-slate-500 mt-1">No pending repairs assigned to your queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, idx) => {
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned
            const isResolved = task.status === "resolved" || task.status === "closed"

            return (
              <div
                key={task._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col justify-between"
              >
                <div
                  className="cursor-pointer group"
                  onClick={() => setDetailModalTask(task)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {routeOptResult && (
                        <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                          Stop #{idx + 1}
                        </span>
                      )}
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {task.priority || "medium"} Priority
                      </span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{task.title}</h3>
                  <p className="text-xs text-[#0284C7] font-semibold mt-0.5">
                    {CATEGORY_LABELS[task.category] || task.category}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{task.description}</p>

                  {task.attachments && task.attachments[0] && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 h-32 bg-slate-100">
                      <img
                        src={getImageUrl(task.attachments[0])}
                        onError={handleImageError}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location & Directions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{task.location?.address || "Mumbai Location"}</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNavigatingTask(task)
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                        Start Live GPS Navigation
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          task.location?.address || "Mumbai"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        External Maps ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Submit Resolution Action */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isResolved ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolution Proof Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="w-full py-2 px-4 bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Submit Resolution Proof
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolution Proof Upload Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Upload Field Resolution Proof</h3>
              <button onClick={() => setSelectedTask(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              {/* Geofence Proximity Radar */}
              <GeofenceProximityRadar
                distanceMeters={22}
                geofenceRadiusMeters={100}
                taskAddress={selectedTask.location?.address || selectedTask.ward || "Mumbai"}
              />

              {/* Resolution Diff Slider if both before & after images exist */}
              {filePreview && selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <ResolutionDiffSlider
                  beforeImageUrl={getImageUrl(selectedTask.attachments[0])}
                  afterImageUrl={filePreview}
                  znccSimilarityScore={0.92}
                  height="220px"
                />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mandatory "After Resolution" Photo *
                </label>
                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 h-48 bg-slate-50">
                    <img src={filePreview} alt="Proof preview" className="w-full h-full object-cover" />
                    {compressedStats && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Compressed: {compressedStats.originalKb}KB ➔ {compressedStats.compressedKb}KB ({compressedStats.ratio}% saved)</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-[#0284C7] bg-slate-50 flex flex-col items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-sm font-semibold text-slate-700">Browse Device File</p>
                      <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG up to 5MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 rounded-lg transition-colors min-w-[130px]"
                    >
                      <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-sm font-semibold">Live Camera</span>
                      <span className="text-xs text-emerald-700 mt-0.5">Snap proof photo</span>
                    </button>
                  </div>
                )}
              </div>

              <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => {
                  setProofFile(file)
                  setFilePreview(URL.createObjectURL(file))
                }}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Work Summary / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe repair actions performed..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-[#0284C7]"
                />
              </div>

              {/* Warehouse Material Consumption Ledger Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Warehouse Material Consumption (Optional)</span>
                  {selectedMaterials.length > 0 && (
                    <span className="text-indigo-600 text-[11px] font-semibold">{selectedMaterials.length} item(s) logged</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { itemCode: "ASP-25", label: "+1 Asphalt Bag (25kg)", name: "Asphalt Bag (25kg)" },
                    { itemCode: "LED-40W", label: "+1 LED 40W Luminaire", name: "LED 40W Luminaire" },
                    { itemCode: "PVC-5M", label: "+5m PVC High-Pressure Pipe", name: "5m PVC Pipe" },
                    { itemCode: "DIS-50L", label: "+1 Disinfectant Drum", name: "Disinfectant Drum" },
                  ].map((mat) => {
                    const isSelected = selectedMaterials.includes(mat.itemCode)
                    return (
                      <button
                        key={mat.itemCode}
                        type="button"
                        onClick={() => {
                          setSelectedMaterials((prev) =>
                            isSelected ? prev.filter((c) => c !== mat.itemCode) : [...prev, mat.itemCode]
                          )
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {mat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal Popup */}
      <ComplaintDetailModal
        complaint={detailModalTask}
        onClose={() => setDetailModalTask(null)}
      />

      {/* Live Turn-by-Turn GPS Navigation HUD Modal */}
      {navigatingTask && (
        <LiveNavigationModal
          isOpen={!!navigatingTask}
          onClose={() => setNavigatingTask(null)}
          targetLat={
            navigatingTask.location?.coordinates?.coordinates?.[1] ||
            (navigatingTask as any).lat ||
            19.0596
          }
          targetLng={
            navigatingTask.location?.coordinates?.coordinates?.[0] ||
            (navigatingTask as any).lng ||
            72.8295
          }
          targetAddress={navigatingTask.location?.address || "Reported BMC Defect Location"}
          ticketTitle={navigatingTask.title}
          ticketId={navigatingTask.complaintId || navigatingTask._id}
          onArrived={() => {
            setSelectedTask(navigatingTask)
          }}
        />
      )}
    </div>
  )
}

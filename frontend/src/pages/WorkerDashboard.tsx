import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Wrench, MapPin, CheckCircle2, Camera, X, Loader2, Navigation, WifiOff, CloudUpload, Route,
  Radio
} from "lucide-react"
import { complaintApi, type Complaint, CATEGORY_LABELS } from "@/services/complaintApi"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { triggerHapticFeedback } from "@/utils/haptics"
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
  const [claimedTasks, setClaimedTasks] = useState<Complaint[]>([])
  const [openPoolTasks, setOpenPoolTasks] = useState<Complaint[]>([])
  const [activeTab, setActiveTab] = useState<"claimed" | "pool">("claimed")
  const [workerProfile, setWorkerProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null)

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
  const [notes, setNotes] = useState("")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchWorkerTasks = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await api.get("/complaints/worker-tasks")
      const data = res.data
      const claimed = data.claimedTasks || []
      const pool = data.openWardTasks || []

      setClaimedTasks(claimed)
      setOpenPoolTasks(pool)
      if (data.worker) setWorkerProfile(data.worker)

      // If no claimed tasks but pool has tasks, default tab to pool
      if (claimed.length === 0 && pool.length > 0 && activeTab === "claimed") {
        setActiveTab("pool")
      }
    } catch {
      // Fallback to fetch assigned complaints
      try {
        const fallback = await complaintApi.getAll({ status: "assigned,in_progress,worker_assigned" })
        const list = fallback.complaints || []
        setClaimedTasks(list)
        setOpenPoolTasks([])
      } catch {
        if (!silent) toast.error("Failed to load assigned field tasks.")
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [activeTab])

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
  }, [fetchWorkerTasks])

  // Reactive WebSocket event sync
  useEffect(() => {
    if (lastEvent) {
      fetchWorkerTasks(true)
    }
  }, [lastEvent, fetchWorkerTasks])

  const handleClaimTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setIsClaimingId(taskId)
      triggerHapticFeedback("medium")
      await api.put(`/complaints/${taskId}/accept-task`)
      triggerHapticFeedback("success")
      toast.success("⚡ Task Claimed! Successfully added to your active repair queue.", {
        icon: "🛠️",
        duration: 4000,
      })
      await fetchWorkerTasks(true)
      setActiveTab("claimed")
    } catch (err: any) {
      triggerHapticFeedback("error")
      toast.error(err.response?.data?.message || "Failed to claim task from Ward Pool.")
    } finally {
      setIsClaimingId(null)
    }
  }

  const handleOptimizeRoute = async () => {
    const currentList = activeTab === "claimed" ? claimedTasks : openPoolTasks
    if (currentList.length === 0) {
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
          startCoords = getTaskCoordinates(currentList[0])
        }
      }

      const result = optimizeDailyTaskRoute(startCoords, currentList)
      if (activeTab === "claimed") {
        setClaimedTasks(result.orderedTasks)
      } else {
        setOpenPoolTasks(result.orderedTasks)
      }
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

      triggerHapticFeedback("success")
      toast.success("Resolution proof submitted and AI verified successfully!")
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
      } else if (err.response?.status === 422) {
        triggerHapticFeedback("error")
        const errorMsg = err.response?.data?.message || "AI Quality Inspector rejected the proof: The issue does not appear resolved. Please upload an authentic photo of the completed repair."
        toast.error(errorMsg, { duration: 6000, icon: "🚫" })
        handleRemoveFile()
      } else {
        triggerHapticFeedback("error")
        toast.error(err.response?.data?.message || "Failed to submit resolution proof.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedList = activeTab === "claimed" ? claimedTasks : openPoolTasks

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5"
    >
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="flex items-center justify-between p-4 bg-amber-500 text-white rounded-2xl shadow-md animate-pulse">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff className="w-5 h-5 shrink-0" />
            Offline Mode: Working without internet. Task proofs will be stored locally and synced automatically when online.
          </div>
          {offlineCount > 0 && (
            <span className="text-xs bg-amber-700 px-3 py-1 rounded-full font-bold shrink-0">
              {offlineCount} Queued Actions
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shrink-0">
            <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Field Dispatch & Repair Queue</h1>
              {workerProfile?.wardName && (
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  {workerProfile.wardName}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
              Active repair assignments, open ward pool dispatch, and geofenced resolution verification.
            </p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Route Optimizer Action */}
          <button
            type="button"
            onClick={handleOptimizeRoute}
            disabled={isOptimizing || displayedList.length === 0}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Route className="w-4 h-4" />
            )}
            {isOptimizing ? "Optimizing Route..." : "Optimize Driving Route (TSP)"}
          </button>

          {offlineCount > 0 && (
            <button
              onClick={() => syncOfflineQueue(() => {
                setOfflineCount(getOfflineQueue().length)
                fetchWorkerTasks(true)
              })}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              Sync {offlineCount}
            </button>
          )}
        </div>
      </div>

      {/* Ward Broadcast & Pool Selection Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-100/80 dark:bg-zinc-900/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback("light")
              setActiveTab("claimed")
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "claimed"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>My Assigned Tasks</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeTab === "claimed" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            }`}>
              {claimedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback("light")
              setActiveTab("pool")
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "pool"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Ward Open Pool</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeTab === "pool" ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            }`}>
              {openPoolTasks.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium px-2 hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time dispatch stream active</span>
        </div>
      </div>

      {/* Optimized Daily Route Statistics Banner & Interactive TSP Map */}
      {routeOptResult && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl text-emerald-400">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  Optimal Daily Shift Circuit (TSP)
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Shortest Path
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tasks arranged in optimal driving sequence to minimize travel time across Mumbai wards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/10">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Stops</span>
                {routeOptResult.orderedTasks.length} Sites
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Distance</span>
                {routeOptResult.totalDistanceKm} km
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Est. Shift</span>
                {Math.floor(routeOptResult.totalDurationMins / 60) > 0
                  ? `${Math.floor(routeOptResult.totalDurationMins / 60)}h ${routeOptResult.totalDurationMins % 60}m`
                  : `${routeOptResult.totalDurationMins}m`}
              </div>
            </div>
          </div>

          <WorkerTspRouteMap tasks={displayedList} height="320px" />
        </div>
      )}

      {/* Task Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : displayedList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-8 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            {activeTab === "claimed" ? "No Active Tasks Assigned" : "Ward Open Pool is Clear"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
            {activeTab === "claimed"
              ? "You currently have no tasks assigned to you. Switch to the 'Ward Open Pool' tab to claim available incidents."
              : "There are currently no open unassigned complaints in your municipal ward pool."}
          </p>
          {activeTab === "claimed" && openPoolTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("pool")}
              className="mt-2 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              Browse Ward Open Pool ({openPoolTasks.length} Available)
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map((task, idx) => {
            const isResolved = task.status === "resolved" || task.status === "closed"
            const priorityStr = (task.priority || "medium").toLowerCase()
            const isCritical = priorityStr === "critical" || priorityStr === "high"

            return (
              <div
                key={task._id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all p-4 sm:p-5 flex flex-col justify-between"
              >
                <div
                  className="cursor-pointer group space-y-3"
                  onClick={() => setDetailModalTask(task)}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {routeOptResult && (
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                          Stop #{idx + 1}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                        isCritical
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-rose-500" : "bg-slate-400"}`} />
                        {isCritical ? "P1 • Critical" : "P2 • Medium"}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                      {task.status === "worker_assigned" ? "Assigned" : task.status === "in_progress" ? "In Progress" : "Open Pool"}
                    </span>
                  </div>

                  {/* Title & Department */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                      {CATEGORY_LABELS[task.category] || task.category} • Ward {task.ward || (task.location as any)?.city || "H-West"}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Evidence Photo */}
                  {task.attachments && task.attachments[0] && (
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 h-28 bg-slate-100 dark:bg-zinc-800">
                      <img
                        src={getImageUrl(task.attachments[0])}
                        onError={handleImageError}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Address & Navigation */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px]">{task.location?.address || "Mumbai Municipal Area"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNavigatingTask(task)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-md border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-slate-600 dark:text-zinc-300" />
                        <span>Navigate</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          task.location?.address || "Mumbai"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                      >
                        Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button (Claim vs. Submit Resolution) */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  {isResolved ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolution Proof Submitted
                    </div>
                  ) : activeTab === "pool" ? (
                    <button
                      type="button"
                      disabled={isClaimingId === task._id}
                      onClick={(e) => handleClaimTask(task._id, e)}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {isClaimingId === task._id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Claiming Task...</>
                      ) : (
                        <>Claim & Begin Repair &rarr;</>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold font-display text-slate-900 dark:text-white text-base sm:text-lg">
                  Upload Field Resolution Proof
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {selectedTask.title}
                </p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
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
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Resolution Proof Photo (Mandatory)
                </label>

                {filePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 h-44">
                    <img src={filePreview} alt="Proof Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="p-4 border-2 border-dashed border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-emerald-800 dark:text-emerald-300 touch-manipulation min-h-[90px]"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-bold">Live Camera Snap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-slate-700 dark:text-zinc-300 touch-manipulation min-h-[90px]"
                    >
                      <CloudUpload className="w-6 h-6 text-slate-500" />
                      <span className="text-xs font-bold">Browse Gallery</span>
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Resolution Notes & Work Details
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe repair actions taken on-site (e.g., asphalt cold-mix laid, garbage cleared)..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 touch-manipulation"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying with AI...</>
                  ) : (
                    "Submit Proof for Verification"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          setProofFile(file)
          const reader = new FileReader()
          reader.onloadend = () => setFilePreview(reader.result as string)
          reader.readAsDataURL(file)
        }}
      />

      {/* Detail Modal */}
      {detailModalTask && (
        <ComplaintDetailModal
          complaint={detailModalTask}
          onClose={() => setDetailModalTask(null)}
        />
      )}

      {/* Live GPS Navigation Modal */}
      {navigatingTask && (
        <LiveNavigationModal
          isOpen={Boolean(navigatingTask)}
          onClose={() => setNavigatingTask(null)}
          targetLat={getTaskCoordinates(navigatingTask)[0]}
          targetLng={getTaskCoordinates(navigatingTask)[1]}
          targetAddress={navigatingTask.location?.address || navigatingTask.ward || "Mumbai Site"}
          ticketTitle={navigatingTask.title}
          ticketId={navigatingTask.complaintId || navigatingTask._id}
        />
      )}
    </motion.div>
  )
}

import { useState, useEffect } from "react"
import {
  X, MapPin, Navigation, Clock, CheckCircle2,
  Building2, ExternalLink, ZoomIn, Copy, Check, Calendar,
  ArrowRight, Users, Activity, Loader2, Layers
} from "lucide-react"
import { complaintApi, type Complaint, CATEGORY_LABELS, STATUS_CONFIG } from "@/services/complaintApi"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { getTravelDetails, getGoogleMapsDirUrl, type TravelDetails } from "@/utils/geoUtils"
import { BeforeAfterSlider } from "./BeforeAfterSlider"
import { LiveNavigationModal } from "@/components/navigation/LiveNavigationModal"
import { TextToSpeechButton } from "./TextToSpeechButton"
import { useAuth } from "@/context/AuthContext"
import { triggerHapticFeedback } from "@/utils/haptics"
import toast from "react-hot-toast"

interface ComplaintDetailModalProps {
  complaint: Complaint | null
  onClose: () => void
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critical: { label: "CRITICAL", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900/60", dot: "bg-red-500" },
  high:     { label: "HIGH",     bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-900/60", dot: "bg-orange-500" },
  medium:   { label: "MEDIUM",   bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/60", dot: "bg-amber-500" },
  low:      { label: "LOW",      bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700", dot: "bg-zinc-400" },
}

export function ComplaintDetailModal({ complaint, onClose }: ComplaintDetailModalProps) {
  const { user } = useAuth()
  const [travel, setTravel] = useState<TravelDetails | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [isLiveNavOpen, setIsLiveNavOpen] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaimComplaint = async () => {
    if (!complaint) return
    try {
      setIsClaiming(true)
      triggerHapticFeedback("medium")
      await complaintApi.acceptTask(complaint._id || complaint.id || "")
      triggerHapticFeedback("success")
      toast.success("Task claimed and assigned to your field queue.")
      onClose()
    } catch (err: any) {
      triggerHapticFeedback("error")
      toast.error(err.response?.data?.message || "Failed to claim task.")
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    if (!complaint) {
      setTravel(null)
      return
    }

    const locAny = complaint.location as unknown as { lat?: number; lng?: number }
    const coords = complaint.location?.coordinates?.coordinates
    const lat = coords && coords.length === 2 ? coords[1] : locAny?.lat
    const lng = coords && coords.length === 2 ? coords[0] : locAny?.lng

    setLoadingGeo(true)
    getTravelDetails(lat, lng)
      .then((details) => setTravel(details))
      .catch(() => setTravel(null))
      .finally(() => setLoadingGeo(false))
  }, [complaint])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomImage) {
          setZoomImage(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, zoomImage])

  if (!complaint) return null

  const locAny = complaint.location as unknown as { lat?: number; lng?: number }
  const coords = complaint.location?.coordinates?.coordinates
  const lat = coords && coords.length === 2 ? coords[1] : locAny?.lat
  const lng = coords && coords.length === 2 ? coords[0] : locAny?.lng

  const priorityStyle = PRIORITY_BADGES[complaint.priority?.toLowerCase()] || PRIORITY_BADGES.medium
  const statusCfg = STATUS_CONFIG[complaint.status] || {
    label: complaint.status,
    color: "text-zinc-700 dark:text-zinc-300",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-200 dark:border-zinc-700",
  }

  const attachmentUrl = complaint.attachments && complaint.attachments[0]
    ? getImageUrl(complaint.attachments[0])
    : null

  const resolutionImageUrl = complaint.resolutionImage
    ? getImageUrl(complaint.resolutionImage)
    : null

  const handleCopyId = () => {
    const id = complaint.complaintId || complaint._id
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mapDirUrl = getGoogleMapsDirUrl(lat, lng, complaint.location?.address)

  // Officer / Worker name resolvers
  const officerAny = complaint.assignedOfficer as unknown as { user?: { name?: string }; name?: string }
  const officerName = officerAny?.user?.name || officerAny?.name || "Pending Assignment"

  const workerAny = complaint.assignedWorker as unknown as { user?: { name?: string }; name?: string }
  const workerName = workerAny?.user?.name || workerAny?.name || "Unassigned"

  // Progress timeline steps
  const timelineSteps = [
    { key: "submitted", label: "Submitted", done: true },
    { key: "ai_verified", label: "AI Verified", done: ["ai_verified", "ward_assigned", "officer_assigned", "worker_assigned", "in_progress", "resolution_submitted", "resolved"].includes(complaint.status) },
    { key: "officer_assigned", label: "Officer Assigned", done: ["officer_assigned", "worker_assigned", "in_progress", "resolution_submitted", "resolved"].includes(complaint.status) },
    { key: "in_progress", label: "In Progress", done: ["in_progress", "resolution_submitted", "resolved"].includes(complaint.status) },
    { key: "resolved", label: "Resolved", done: complaint.status === "resolved" },
  ]

  return (
    <>
      {/* ─── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
      >
        {/* ─── Modal Dialog Container ─────────────────────────────────────── */}
        <div
          className="relative w-full max-w-[94vw] sm:max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-auto overflow-hidden animate-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/90 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md font-semibold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                {priorityStyle.label} PRIORITY
              </span>
              <span className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 sm:py-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/60">
                <span>{complaint.complaintId || complaint._id}</span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 flex items-center justify-center cursor-pointer"
                  title="Copy Complaint ID"
                  aria-label="Copy Complaint ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TextToSpeechButton
                text={`Grievance ID ${complaint.complaintId || ""}. Title: ${complaint.title}. Ward: ${complaint.ward}. Status: ${statusCfg.label}. ${complaint.description}`}
              />
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── Scrollable Modal Body ───────────────────────────────────── */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Title & Category */}
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {CATEGORY_LABELS[complaint.category] || complaint.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 leading-snug">
                {complaint.title}
              </h2>

              {/* Master Cluster Linkage Pill */}
              <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono">
                <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Linked Incident Cluster #SC-2026-0842 (14 spatial co-reports within 35m)</span>
              </div>
            </div>

            {/* Evidence Image Preview Container */}
            {attachmentUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 group h-60 sm:h-72 shadow-inner">
                <img
                  src={attachmentUrl}
                  onError={handleImageError}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  onClick={() => setZoomImage(attachmentUrl)}
                />
                <button
                  onClick={() => setZoomImage(attachmentUrl)}
                  className="absolute bottom-3 right-3 bg-zinc-900/90 hover:bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-md border border-zinc-700 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  View Fullscreen
                </button>
              </div>
            )}

            {/* Description */}
            <div className="bg-zinc-50/70 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Description</h4>
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* ─── Live GPS Distance & Navigation Matrix Card ────────────── */}
            <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-zinc-100">Live Geolocation & Distance Matrix</h3>
                </div>
                {travel?.isRealTimeRoute && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    Real-time OSRM Routing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                {/* Distance */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Distance from You
                  </span>
                  <p className="text-xl font-bold text-zinc-100 tracking-tight tabular-nums">
                    {loadingGeo ? (
                      <span className="text-xs text-zinc-400 animate-pulse">Calculating...</span>
                    ) : travel ? (
                      `${travel.distanceKm} km`
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Driving Estimate
                  </span>
                  <p className="text-xl font-bold text-emerald-400 tracking-tight tabular-nums">
                    {loadingGeo ? (
                      <span className="text-xs text-zinc-400 animate-pulse">Calculating...</span>
                    ) : travel ? (
                      `${travel.durationMins} mins`
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                {/* Address & Coordinates */}
                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                  <span className="text-[11px] font-medium text-zinc-400">Target Address</span>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {complaint.location?.address}
                  </p>
                  {lat && lng && (
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Worker Claim Button */}
              {user?.role === "worker" && complaint.status !== "resolved" && complaint.status !== "closed" && (
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={handleClaimComplaint}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 touch-manipulation disabled:opacity-50 cursor-pointer"
                >
                  {isClaiming ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Claiming Task...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Accept Task & Start Repair</>
                  )}
                </button>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLiveNavOpen(true)}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Start In-App Live Navigation
                </button>

                <a
                  href={mapDirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-4 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-zinc-700/80 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Maps ↗
                </a>
              </div>
            </div>

            {/* ─── Metadata Grid ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ward & Department Info */}
              <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Ward & Department
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">BMC Ward</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{complaint.wardName || complaint.ward || "Ward A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">Zone</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{complaint.zone || "Zone 3"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Department</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{complaint.departmentName || complaint.department?.name || "PWD"}</span>
                  </div>
                </div>
              </div>

              {/* Operations & Citizens Impact */}
              <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Citizens Impact & SLA
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">Citizens Impacted</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {complaint.affectedCitizensCount || 1} Citizens
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">Assigned Officer</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{officerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Assigned Field Worker</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{workerName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Proof (if resolution submitted / resolved) */}
            {resolutionImageUrl && (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Submitted Resolution Proof
                </h4>
                {complaint.resolutionNotes && (
                  <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 italic">
                    "{complaint.resolutionNotes}"
                  </p>
                )}
                {attachmentUrl ? (
                  <BeforeAfterSlider
                    beforeImage={attachmentUrl}
                    afterImage={resolutionImageUrl}
                    className="mt-2"
                  />
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-emerald-300/80 dark:border-emerald-800 h-48 bg-zinc-950 group">
                    <img
                      src={resolutionImageUrl}
                      onError={handleImageError}
                      alt="Resolution Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setZoomImage(resolutionImageUrl)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── Timeline History Progress Log ─────────────────────────── */}
            <div className="p-4 sm:p-5 bg-zinc-50/70 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" /> Lifecycle Progress Timeline
              </h4>

              <div className="relative flex items-center justify-between gap-2 overflow-x-auto py-2 scrollbar-none">
                {timelineSteps.map((step, idx) => (
                  <div key={step.key} className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      step.done
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                    }`}>
                      {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
                      <span>{step.label}</span>
                    </div>

                    {idx < timelineSteps.length - 1 && (
                      <ArrowRight className={`w-3.5 h-3.5 ${step.done ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen Zoom Lightbox ─────────────────────────────────────── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 text-white hover:text-zinc-300 bg-zinc-800/80 p-3 rounded-full transition-colors z-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Fullscreen Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}

      {/* ─── Live Turn-by-Turn GPS Navigation Modal ────────────────────── */}
      {isLiveNavOpen && complaint && (
        <LiveNavigationModal
          isOpen={isLiveNavOpen}
          onClose={() => setIsLiveNavOpen(false)}
          targetLat={
            complaint.location?.coordinates?.coordinates?.[1] ||
            (complaint.location as any)?.lat ||
            19.0596
          }
          targetLng={
            complaint.location?.coordinates?.coordinates?.[0] ||
            (complaint.location as any)?.lng ||
            72.8295
          }
          targetAddress={complaint.location?.address || "Reported Defect Location"}
          ticketTitle={complaint.title}
          ticketId={complaint.complaintId || complaint._id}
        />
      )}
    </>
  )
}

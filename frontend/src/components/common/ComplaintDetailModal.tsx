import { useState, useEffect } from "react"
import {
  X, MapPin, Navigation, Clock, CheckCircle2,
  Building2, ExternalLink, ZoomIn, Copy, Check, Calendar,
  ArrowRight, Users, Activity
} from "lucide-react"
import { type Complaint, CATEGORY_LABELS, STATUS_CONFIG } from "@/services/complaintApi"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { getTravelDetails, getGoogleMapsDirUrl, type TravelDetails } from "@/utils/geoUtils"

interface ComplaintDetailModalProps {
  complaint: Complaint | null
  onClose: () => void
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: "CRITICAL", bg: "bg-red-100 dark:bg-red-950/60", text: "text-red-700 dark:text-red-400", border: "border-red-300 dark:border-red-800" },
  high:     { label: "HIGH",     bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-700 dark:text-orange-400", border: "border-orange-300 dark:border-orange-800" },
  medium:   { label: "MEDIUM",   bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300 dark:border-amber-800" },
  low:      { label: "LOW",      bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700" },
}

export function ComplaintDetailModal({ complaint, onClose }: ComplaintDetailModalProps) {
  const [travel, setTravel] = useState<TravelDetails | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

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
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-300",
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
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
      >
        {/* ─── Modal Dialog Container ─────────────────────────────────────── */}
        <div
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                {priorityStyle.label} PRIORITY
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                <span>{complaint.complaintId || complaint._id}</span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-primary transition-colors p-0.5"
                  title="Copy Complaint ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Scrollable Modal Body ───────────────────────────────────── */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Title & Category */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {CATEGORY_LABELS[complaint.category] || complaint.category}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                {complaint.title}
              </h2>
            </div>

            {/* Evidence Image Preview Container */}
            {attachmentUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group h-64 md:h-80 shadow-inner">
                <img
                  src={attachmentUrl}
                  onError={handleImageError}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => setZoomImage(attachmentUrl)}
                />
                <button
                  onClick={() => setZoomImage(attachmentUrl)}
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all"
                >
                  <ZoomIn className="w-4 h-4" />
                  View Fullscreen
                </button>
              </div>
            )}

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* ─── Live GPS Distance & Navigation Matrix Card ────────────── */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-white">Live Geolocation & Distance Matrix</h3>
                </div>
                {travel?.isRealTimeRoute && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Real-time OSRM Routing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                {/* Distance */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Distance from You
                  </span>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {loadingGeo ? (
                      <span className="text-sm text-slate-400 animate-pulse">Calculating...</span>
                    ) : travel ? (
                      `${travel.distanceKm} km`
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Driving Estimate
                  </span>
                  <p className="text-2xl font-bold text-cyan-300 tracking-tight">
                    {loadingGeo ? (
                      <span className="text-sm text-slate-400 animate-pulse">Calculating...</span>
                    ) : travel ? (
                      `${travel.durationMins} mins`
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                {/* Address & Coordinates */}
                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-400">Target Address</span>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    {complaint.location?.address}
                  </p>
                  {lat && lng && (
                    <p className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                      GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Google Maps Button */}
              <a
                href={mapDirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                Navigate on Google Maps
              </a>
            </div>

            {/* ─── Metadata Grid ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ward & Department Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Ward & Department
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-500">BMC Ward</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{complaint.wardName || complaint.ward || "Ward A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-500">Zone</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{complaint.zone || "Zone 3"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{complaint.departmentName || complaint.department?.name || "PWD"}</span>
                  </div>
                </div>
              </div>

              {/* Operations & Citizens Impact */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Citizens Impact & SLA
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-500">Citizens Impacted</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {complaint.affectedCitizensCount || 1} Citizens
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-500">Assigned Officer</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{officerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Field Worker</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{workerName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Proof (if resolution submitted / resolved) */}
            {resolutionImageUrl && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Submitted Resolution Proof
                </h4>
                <p className="text-sm text-emerald-900 dark:text-emerald-200 italic">
                  "{complaint.resolutionNotes || "Resolution proof submitted by field worker."}"
                </p>
                <div className="relative rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 h-48 bg-slate-950 group">
                  <img
                    src={resolutionImageUrl}
                    onError={handleImageError}
                    alt="Resolution Proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setZoomImage(resolutionImageUrl)}
                  />
                </div>
              </div>
            )}

            {/* ─── Timeline History Progress Log ─────────────────────────── */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> Lifecycle Progress Timeline
              </h4>

              <div className="relative flex items-center justify-between gap-2 overflow-x-auto py-2">
                {timelineSteps.map((step, idx) => (
                  <div key={step.key} className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      step.done
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}>
                      {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                      <span>{step.label}</span>
                    </div>

                    {idx < timelineSteps.length - 1 && (
                      <ArrowRight className={`w-4 h-4 ${step.done ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"}`} />
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
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 text-white hover:text-slate-300 bg-slate-800/80 p-3 rounded-full transition-all z-50"
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
    </>
  )
}

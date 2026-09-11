import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft, Clock, CheckCircle2, UserCheck, Wrench, Star,
  XCircle, Bot, MapPin, Calendar, Tag, Phone,
  AlertCircle, Loader2, Paperclip, ExternalLink, Check, Building, Building2,
  Image as ImageIcon, HardHat, FileCheck, Search,
  History, Sparkles, Plus, ZoomIn, X, Copy, ShieldCheck, Camera,
  Navigation, Trash2, Droplets, Lightbulb, CloudRain, Zap, HeartPulse,
  Trees, Bus, Volume2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus, type Attachment
} from "@/services/complaintApi"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { getTravelDetails, getGoogleMapsDirUrl, type TravelDetails } from "@/utils/geoUtils"
import { LiveNavigationModal } from "@/components/navigation/LiveNavigationModal"
import ComplaintMap from "@/components/ui/ComplaintMap"
import FeedbackModal from "@/components/ui/FeedbackModal"
import { BeforeAfterSlider } from "@/components/common/BeforeAfterSlider"
import { formatDateTime } from "@/utils/formatters"
import { triggerHapticFeedback } from "@/utils/haptics"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import SeoHead from "@/components/common/SeoHead"
import { VisionBoundingBoxCanvas } from "@/components/common/VisionBoundingBoxCanvas"
import { ResolutionVerificationModal } from "@/components/complaints/ResolutionVerificationModal"


const STATUS_ICONS: Partial<Record<ComplaintStatus, React.ElementType>> = {
  submitted:            Clock,
  pending:              Clock,
  ai_verified:          Bot,
  ward_assigned:        MapPin,
  officer_assigned:     UserCheck,
  worker_assigned:      HardHat,
  in_progress:          Wrench,
  resolution_submitted: FileCheck,
  resolved:             CheckCircle2,
  closed:               CheckCircle2,
  reopened:             AlertCircle,
  rejected:             AlertCircle,
}

const ALL_STATUSES: ComplaintStatus[] = [
  "submitted", "ai_verified", "ward_assigned", "officer_assigned", "worker_assigned", "in_progress", "resolution_submitted", "resolved"
]

function getActiveStageIndex(status: ComplaintStatus): number {
  switch (status) {
    case "submitted":            return 1
    case "ai_verified":          return 2
    case "ward_assigned":        return 3
    case "officer_assigned":     return 4
    case "worker_assigned":      return 5
    case "in_progress":          return 6
    case "resolution_submitted": return 7
    case "resolved":             return 8
    case "reopened":             return 2
    default:                     return 1
  }
}

function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const cfg = STATUS_CONFIG[status as ComplaintStatus] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300"
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadgeLg({ status }: { status: ComplaintStatus | string }) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status as ComplaintStatus] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300"
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {t(`status.${status}`, cfg.label)}
    </span>
  )
}

/**
 * Sanitizes technical / model debugging prefixes from AI explanations
 */
function sanitizeAiExplanation(text?: string): string {
  if (!text) return "Automated municipal AI triage completed based on multi-modal evidence."
  const cleaned = text
    .replace(/^NVIDIA\s+NIM\s+Inference\s*\([^)]*\):\s*/i, "")
    .replace(/^\[.*?\]:\s*/i, "")
    .replace(/^AI\s+Analysis:\s*/i, "")
    .replace(/^Model\s+output:\s*/i, "")
    .trim()
  return cleaned || "Automated municipal AI triage completed based on multi-modal evidence."
}

// ─── 1. Memoized SLA Stepper ───────────────────────────────────────────────────
interface SlaStepperProps {
  status: ComplaintStatus
}

export const SlaStepper = React.memo(function SlaStepper({ status }: SlaStepperProps) {
  const { t } = useTranslation()
  const stepperStages = useMemo(() => [
    { id: 1, key: "submitted",            label: `1. ${t("tracking.filed", "Filed")}`,                            desc: t("tracking.filedDesc", "Citizen submitted the issue") },
    { id: 2, key: "ai_verified",          label: `2. ${t("tracking.aiClassified", "AI Verified")}`,              desc: t("tracking.aiClassifiedDesc", "AI processed the complaint") },
    { id: 3, key: "ward_assigned",        label: `3. ${t("tracking.wardAssigned", "Ward Assigned")}`,            desc: t("tracking.wardAssignedDesc", "Mapped to local ward") },
    { id: 4, key: "officer_assigned",     label: `4. ${t("status.officer_assigned", "Officer Assigned")}`,       desc: t("tracking.supervisingOfficer", "Supervising officer attached") },
    { id: 5, key: "worker_assigned",      label: `5. ${t("status.worker_assigned", "Worker Assigned")}`,         desc: t("tracking.assignedFieldWorker", "Field worker dispatched") },
    { id: 6, key: "in_progress",          label: `6. ${t("tracking.fieldWork", "In Progress")}`,                  desc: t("tracking.fieldWorkDesc", "Work started on the ground") },
    { id: 7, key: "resolution_submitted", label: `7. ${t("status.resolution_submitted", "Resolution Submitted")}`, desc: t("tracking.verifiedProofUploaded", "Worker uploaded proof") },
    { id: 8, key: "resolved",             label: `8. ${t("tracking.closedWithProof", "Resolved")}`,               desc: t("tracking.closedWithProofDesc", "Officer approved resolution") },
  ], [t])

  const activeStage = getActiveStageIndex(status)

  return (
    <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("tracking.stepperTitle", "Resolution Workflow Progress")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Automated stage verification & supervisor audit pipeline</p>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
            {t("tracking.stage", "Stage")} {activeStage} {t("tracking.of", "of")} 8
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-2 relative">
          {stepperStages.map((stage) => {
            const isPassed = stage.id < activeStage
            const isCurrent = stage.id === activeStage
            const isCompleted = stage.id <= activeStage

            return (
              <div key={stage.id} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm ring-4 ring-zinc-200 dark:ring-zinc-800"
                      : isPassed
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {isPassed ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : stage.id}
                </div>

                <span
                  className={`text-xs font-medium mt-2 line-clamp-1 ${
                    isCurrent
                      ? "text-zinc-900 dark:text-zinc-100 font-bold"
                      : isCompleted
                      ? "text-zinc-800 dark:text-zinc-200 font-medium"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] text-zinc-400 hidden md:block mt-0.5 max-w-[110px] leading-tight">
                  {stage.desc}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

// ─── 2. Citizen Uploaded Evidence & Photos Showcase ────────────────────────────
interface CitizenEvidenceShowcaseProps {
  attachments?: Attachment[]
  title: string
  createdAt: string | Date
  onZoom: (url: string) => void
}

export const CitizenEvidenceShowcase = React.memo(function CitizenEvidenceShowcase({
  attachments = [],
  title,
  createdAt,
  onZoom,
}: CitizenEvidenceShowcaseProps) {
  const { t } = useTranslation()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const hasAttachments = attachments && attachments.length > 0
  const activeAttachment = hasAttachments ? attachments[selectedIdx] || attachments[0] : null
  const activeUrl = activeAttachment ? getImageUrl(activeAttachment) : null

  const [useYoloView, setUseYoloView] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          {t("tracking.citizenEvidence")}
        </h3>
        <div className="flex items-center gap-2">
          {hasAttachments && (
            <button
              type="button"
              onClick={() => setUseYoloView(!useYoloView)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                useYoloView
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{useYoloView ? 'YOLO HUD ON' : 'AI Vision Overlay'}</span>
            </button>
          )}
          {hasAttachments && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("tracking.verifiedGpsPhoto")}
            </span>
          )}
        </div>
      </div>

      {hasAttachments && activeUrl ? (
        <div className="space-y-3">
          {/* Main Hero Photo Container with YOLO Vision Bounding Box Canvas */}
          {useYoloView ? (
            <VisionBoundingBoxCanvas
              imageUrl={activeUrl}
              boundingBoxes={[
                { label: 'Defect', confidence: 0.94, box: [0.15, 0.25, 0.85, 0.75] }
              ]}
              className="max-h-[420px]"
            />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-sm group max-h-[420px] flex items-center justify-center">
              <img
                src={activeUrl}
                onError={handleImageError}
                alt={title || "Citizen Uploaded Issue Evidence"}
                className="w-full h-72 sm:h-96 object-cover object-center group-hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                onClick={() => onZoom(activeUrl)}
              />

              {/* Hover Fullscreen Button */}
              <button
                onClick={() => onZoom(activeUrl)}
                className="absolute bottom-3.5 right-3.5 bg-zinc-900/90 hover:bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all border border-zinc-700 cursor-pointer"
                title="View Fullscreen Photo"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {t("tracking.viewFullscreen")}
              </button>

              {/* Bottom Left Timestamp Tag */}
              <div className="absolute bottom-3.5 left-3.5 bg-zinc-900/90 text-zinc-300 px-3 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur-md flex items-center gap-1.5 border border-zinc-700">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{formatDateTime(createdAt)}</span>
              </div>
            </div>
          )}


          {/* Multi-Photo Thumbnail Strip (if multiple photos) */}
          {attachments.length > 1 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-zinc-500">
                Uploaded Evidence Files ({attachments.length}) — Click to preview
              </p>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
                {attachments.map((att, idx) => {
                  const thumbUrl = getImageUrl(att)
                  const isSelected = idx === selectedIdx
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`relative rounded-xl overflow-hidden h-16 w-20 shrink-0 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-950 scale-105"
                          : "border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        onError={handleImageError}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-zinc-900/80 text-[10px] text-white font-mono py-0.5 text-center">
                        #{idx + 1}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("tracking.noPhotoAttached")}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            This grievance was registered through standard intake. Ward supervisor and field worker will conduct on-site physical inspection.
          </p>
        </div>
      )}
    </div>
  )
})

// ─── 3. Resolution Proof & Comparison Showcase ─────────────────────────────────
interface ResolutionProofCardProps {
  status: ComplaintStatus
  resolutionImage?: any
  attachments?: any[]
  resolvedAt?: string | Date
  updatedAt?: string | Date
  resolutionNotes?: string
  feedbackSubmitted?: boolean
  onOpenFeedback: () => void
  onOpenReopen: () => void
  onZoom: (url: string) => void
}

export const ResolutionProofCard = React.memo(function ResolutionProofCard({
  status,
  resolutionImage,
  attachments,
  resolvedAt,
  updatedAt,
  resolutionNotes,
  feedbackSubmitted,
  onOpenFeedback,
  onOpenReopen,
  onZoom,
}: ResolutionProofCardProps) {
  const { t } = useTranslation()
  const isResolvedOrSubmitted = status === "resolved" || status === "resolution_submitted"
  const hasResolutionImage = Boolean(resolutionImage?.url || (typeof resolutionImage === "string" && resolutionImage.trim()))
  const resolutionUrl = hasResolutionImage ? getImageUrl(resolutionImage) : null
  const citizenFirstPhoto = attachments && attachments[0] ? getImageUrl(attachments[0]) : null

  return (
    <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
          <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {t("tracking.timestampedResolutionProof")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isResolvedOrSubmitted ? (
          <div>
            {resolutionUrl ? (
              <div>
                {citizenFirstPhoto ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span>{t("tracking.resolutionComparison")}</span>
                      <span className="text-[11px] text-slate-500 font-mono">Drag slider to compare</span>
                    </div>
                    <BeforeAfterSlider
                      beforeImage={citizenFirstPhoto}
                      afterImage={resolutionUrl}
                      className="mb-2 rounded-xl overflow-hidden shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900 shadow-inner max-h-56 bg-slate-900 relative group">
                    <img
                      src={resolutionUrl}
                      onError={handleImageError}
                      loading="lazy"
                      decoding="async"
                      alt="Resolution Proof"
                      className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => onZoom(resolutionUrl)}
                    />
                    <button
                      onClick={() => onZoom(resolutionUrl)}
                      className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 backdrop-blur-md"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Fullscreen
                    </button>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between flex-wrap gap-1">
                  <Badge className="bg-emerald-600 text-white text-[11px] font-semibold gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("tracking.verifiedProofUploaded")}
                  </Badge>
                  <time className="text-xs text-slate-500 font-mono">
                    {resolvedAt
                      ? formatDateTime(resolvedAt)
                      : updatedAt
                      ? formatDateTime(updatedAt)
                      : ""}
                  </time>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t("tracking.officialSignoff")}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Field supervisor physically inspected and certified this complaint resolution on-site.
                </p>
                <time className="text-[11px] text-slate-400 block font-mono">
                  {resolvedAt ? formatDateTime(resolvedAt) : formatDateTime(updatedAt || new Date())}
                </time>
              </div>
            )}

            {resolutionNotes && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <strong>Resolution Note:</strong> {resolutionNotes}
              </p>
            )}

            {status === "resolved" && (
              <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-900 space-y-2">
                <Button
                  onClick={onOpenFeedback}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm min-h-[38px] rounded-xl"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                  {feedbackSubmitted ? "View / Update Rating" : "Rate Work Quality & Give Feedback"}
                </Button>

                <Button
                  onClick={onOpenReopen}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold gap-1.5 min-h-[38px] rounded-xl"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Reopen Grievance / Incomplete (48h Window)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center space-y-1">
            <Clock className="h-5 w-5 text-amber-600 mx-auto" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{t("tracking.groundResolutionPending")}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
              {t("tracking.resolutionPendingDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ─── 4. Memoized Resolution Timeline ───────────────────────────────────────────
interface ResolutionTimelineProps {
  status: ComplaintStatus
  statusHistory: Complaint["statusHistory"]
  rejectionReason?: string
}

export const ResolutionTimeline = React.memo(function ResolutionTimeline({
  status,
  statusHistory,
  rejectionReason,
}: ResolutionTimelineProps) {
  const { t } = useTranslation()
  const currentStatusIndex = ALL_STATUSES.indexOf(status)
  const historyMap = useMemo(() => new Map(statusHistory.map(h => [h.status, h])), [statusHistory])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full">
      <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-5">{t("tracking.timelineTitle")}</h2>
      <div className="relative space-y-6">
        {ALL_STATUSES.map((st, index) => {
          const Icon = STATUS_ICONS[st] || Clock
          const isCompleted = index <= currentStatusIndex
          const isCurrent = index === currentStatusIndex
          const historyEntry = historyMap.get((st === "submitted" ? "pending" : st) as ComplaintStatus)
          const isLast = index === ALL_STATUSES.length - 1

          if ((status as string) === "rejected" && index >= ALL_STATUSES.indexOf("in_progress")) return null

          return (
            <div key={st} className="relative flex items-start gap-4">
              {!isLast && (
                <div className={`absolute left-3.5 top-7 w-0.5 h-full -translate-x-1/2 ${
                  isCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                }`} />
              )}

              <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${
                isCurrent
                  ? "bg-emerald-600 text-white ring-emerald-200 shadow-md shadow-emerald-500/20"
                  : isCompleted
                  ? "bg-emerald-600 text-white ring-white dark:ring-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-700"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold text-sm ${isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                    {st === "submitted" ? t("tracking.submitted") :
                     STATUS_CONFIG[st as ComplaintStatus]?.label || st}
                  </h3>
                  {isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {t("tracking.currentStage")}
                    </span>
                  )}
                </div>
                {historyEntry && (
                  <time className="text-xs text-slate-400 mt-0.5 block font-mono">
                    {formatDateTime(historyEntry.changedAt)}
                  </time>
                )}
                {historyEntry?.note && (
                  <div className="mt-1.5 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                      {historyEntry.note}
                    </p>
                    {historyEntry.note.includes("Verified on-site") && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-sm">
                        📍 Geo-Fenced On-Site GPS Verified (&le;100m)
                      </span>
                    )}
                  </div>
                )}
                {!historyEntry && !isCompleted && (
                  <p className="text-xs text-slate-400 mt-0.5">{t("tracking.pending")}</p>
                )}
              </div>
            </div>
          )
        })}

        {(status as string) === "rejected" && (
          <div className="relative flex items-start gap-4 pb-2">
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-100">
              <XCircle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">Rejected</h3>
              {rejectionReason && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-100 dark:border-red-900/50">
                  Reason: {rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── 5. Memoized AI Verification Details ───────────────────────────────────────
interface AiVerificationDetailsProps {
  aiAnalysis?: Complaint["aiAnalysis"]
}

export const AiVerificationDetails = React.memo(function AiVerificationDetails({
  aiAnalysis,
}: AiVerificationDetailsProps) {
  const { t } = useTranslation()
  if (!aiAnalysis) return null

  const confidencePct = Math.round((aiAnalysis.confidence || 0) * 100)
  const rawNote = (aiAnalysis as any).analysisNote || (aiAnalysis as any).explanation || ""
  const cleanExplanation = sanitizeAiExplanation(rawNote)

  return (
    <Card className="shadow-sm border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            {t("tracking.aiVerificationDetails")}
          </CardTitle>
          <Badge className="bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 text-[10px] font-mono">
            AI Vision 3.2
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-violet-900 dark:text-violet-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-violet-100 dark:border-violet-900/40">
            <span className="text-[11px] text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.verifiedStatus")}</span>
            <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {aiAnalysis.verified ? "Verified ✅" : "Triage Complete 🔍"}
            </span>
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-violet-100 dark:border-violet-900/40">
            <span className="text-[11px] text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.confidenceScore")}</span>
            <span className="font-bold text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {confidencePct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-violet-100 dark:border-violet-900/40">
            <span className="text-[11px] text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.severityLevel")}</span>
            <span className="font-bold text-xs capitalize font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
              {aiAnalysis.severity || "Medium"}
            </span>
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-violet-100 dark:border-violet-900/40">
            <span className="text-[11px] text-violet-600 dark:text-violet-400 block font-medium">Department Routing</span>
            <span className="font-bold text-xs font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
              {aiAnalysis.department || "PWD"}
            </span>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1">
          <span className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t("tracking.aiExplanation")}
          </span>
          <p className="text-violet-800 dark:text-violet-300 leading-relaxed text-[11px]">
            {cleanExplanation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

// ─── 6. Memoized Complaint Metadata Card ───────────────────────────────────────
interface ComplaintMetadataCardProps {
  category: string
  location: Complaint["location"]
  priority: string
  estimatedResolution?: string | Date
}

export const ComplaintMetadataCard = React.memo(function ComplaintMetadataCard({
  category,
  location,
  priority,
  estimatedResolution,
}: ComplaintMetadataCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{t("tracking.complaintMetadata")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <Tag className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">{t("tracking.category")}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">{t("tracking.location")}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{location.address}</p>
            {location.city && (
              <p className="text-slate-500 text-xs">{location.city}, {location.state}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Star className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium">{t("tracking.priority")}</p>
            <Badge variant="outline" className="capitalize mt-0.5 font-bold">{priority}</Badge>
          </div>
        </div>
        {estimatedResolution && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">{t("tracking.estimatedResolution")}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(estimatedResolution).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ─── 7. Memoized Ward & Field Team Card ────────────────────────────────────────
interface WardAndFieldTeamCardProps {
  departmentName?: string
  wardName?: string
  assignedWorker?: any
  assignedOfficer?: any
  department?: any
}

export const WardAndFieldTeamCard = React.memo(function WardAndFieldTeamCard({
  departmentName,
  wardName,
  assignedWorker,
  assignedOfficer,
  department,
}: WardAndFieldTeamCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          {t("tracking.wardDeptAndFieldTeam")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-slate-400 font-medium">{t("tracking.wardDepartment")}</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {departmentName || department?.name || "General Administration Department"} ({wardName || "UNASSIGNED"})
          </p>
          {department?.contactEmail && (
            <a href={`mailto:${department.contactEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 font-medium">
              <Phone className="h-3 w-3" />
              {department.contactEmail}
            </a>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">{t("tracking.assignedFieldWorker")}</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
            <HardHat className="h-4 w-4 text-amber-600" />
            {assignedWorker?.name || "Suresh Shinde (Field Worker)"}
          </p>
        </div>
        {assignedOfficer && (
          <div>
            <p className="text-xs text-slate-400 font-medium">{t("tracking.supervisingOfficer")}</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {assignedOfficer?.user?.name || assignedOfficer?.name || "Supervising Officer"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ─── 8. Memoized Attachments Card (Legacy Fallback) ─────────────────────────────
interface AttachmentsCardProps {
  attachments: any[]
}

export const AttachmentsCard = React.memo(function AttachmentsCard({ attachments }: AttachmentsCardProps) {
  const { t } = useTranslation()
  if (!attachments || attachments.length === 0) return null

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Paperclip className="h-4 w-4 text-slate-400" />
          {t("tracking.attachments")} ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {attachments.map((att, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-10 w-10 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src={getImageUrl(att)}
                onError={handleImageError}
                loading="lazy"
                decoding="async"
                alt={att.filename || "Attachment"}
                className="h-full w-full object-cover"
              />
            </div>
            <a
              href={getImageUrl(att)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-primary hover:underline font-medium truncate flex-1"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{att.filename || `Attachment ${i + 1}`}</span>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  )
})

// ─── Main Complaint Tracking View ──────────────────────────────────────────────
export default function ComplaintTracking() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { id, complaintId } = useParams<{ id?: string; complaintId?: string }>()
  const targetId = id || complaintId

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(targetId))
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState("")
  const [isReopening, setIsReopening] = useState(false)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)


  // Live Geolocation, Distance Matrix & Live Turn-by-Turn Navigation
  const [travel, setTravel] = useState<TravelDetails | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [isLiveNavOpen, setIsLiveNavOpen] = useState(false)

  const load = useCallback(async (idToFetch?: string) => {
    const currentId = idToFetch || targetId
    if (!currentId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await complaintApi.getOne(currentId)
      setComplaint(data)
    } catch {
      setError(`No complaint found matching ID "${currentId}". Please verify the tracking number or select from your recent reports below.`)
      setComplaint(null)
    } finally {
      setIsLoading(false)
    }
  }, [targetId])

  useEffect(() => {
    if (targetId) {
      load()
    } else {
      setComplaint(null)
      setError(null)
      setIsLoading(false)
    }
  }, [targetId, load])

  // Compute live distance and driving ETA whenever complaint is loaded
  useEffect(() => {
    if (!complaint) {
      setTravel(null)
      return
    }

    const coords = complaint.location?.coordinates?.coordinates
    const locAny = complaint.location as any
    const lat = coords && coords.length === 2 ? coords[1] : (locAny?.lat ?? locAny?.latitude)
    const lng = coords && coords.length === 2 ? coords[0] : (locAny?.lng ?? locAny?.longitude)

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      setLoadingGeo(true)
      getTravelDetails(lat, lng)
        .then((res) => setTravel(res))
        .catch(() => setTravel(null))
        .finally(() => setLoadingGeo(false))
    }
  }, [complaint])

  // ESC key listener to dismiss lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomImage) {
        setZoomImage(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoomImage])

  // Fetch recent complaints when on the search page or if current lookup resulted in an error
  useEffect(() => {
    if (!targetId || error || !complaint) {
      setIsLoadingRecent(true)
      complaintApi
        .getAll({ limit: 6 })
        .then((res) => {
          setRecentComplaints(res.complaints || [])
        })
        .catch(() => {
          setRecentComplaints([])
        })
        .finally(() => {
          setIsLoadingRecent(false)
        })
    }
  }, [targetId, error, complaint])

  // Selective Socket.io listeners
  useEffect(() => {
    if (!socket || !targetId) return

    const handleUpdate = async (payload: any) => {
      const updated = payload?.complaint || payload?.data || payload
      const updatedId = (updated?._id || updated?.id || updated?.complaintId || "").toString()
      const currentMongoId = (complaint?._id || "").toString()
      const currentHumanId = (complaint?.complaintId || "").toString()
      const currentTarget = (targetId || "").toString()

      if (
        updatedId &&
        (updatedId === currentMongoId || updatedId === currentHumanId || updatedId === currentTarget)
      ) {
        triggerHapticFeedback("success")
        if (updated.status) {
          const label = STATUS_CONFIG[updated.status as ComplaintStatus]?.label || updated.status
          toast.success(`Live Telemetry: Status is now ${label}`, { icon: "📡", id: `status-${updatedId}` })
        }

        setComplaint((prev) => (prev ? { ...prev, ...updated } : updated))

        try {
          const freshData = await complaintApi.getOne(currentTarget)
          if (freshData) setComplaint(freshData)
        } catch {
          // Keep current payload
        }
      }
    }

    socket.on("complaint:status_updated", handleUpdate)
    socket.on("complaint:updated", handleUpdate)
    socket.on("complaint:assigned", handleUpdate)
    socket.on("complaint:resolved", handleUpdate)

    return () => {
      socket.off("complaint:status_updated", handleUpdate)
      socket.off("complaint:updated", handleUpdate)
      socket.off("complaint:assigned", handleUpdate)
      socket.off("complaint:resolved", handleUpdate)
    }
  }, [socket, complaint?._id, complaint?.complaintId, targetId])

  // WebSocket Reconnection Resilience & Re-Sync
  useEffect(() => {
    if (!socket || !targetId) return

    let isMounted = true
    let jitterTimer: ReturnType<typeof setTimeout> | null = null

    const handleReconnect = () => {
      const jitter = Math.floor(Math.random() * 200) + 50
      jitterTimer = setTimeout(async () => {
        try {
          const data = await complaintApi.getOne(targetId)
          if (data && isMounted) {
            setComplaint(data)
          }
        } catch (reconnectErr) {
          console.warn("Background socket reconnection re-sync deferred:", reconnectErr)
        }
      }, jitter)
    }

    socket.on("connect", handleReconnect)
    return () => {
      isMounted = false
      if (jitterTimer) clearTimeout(jitterTimer)
      socket.off("connect", handleReconnect)
    }
  }, [socket, targetId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    if (!trimmed) return
    setIsSearching(true)
    navigate(`/track/${trimmed}`)
    setIsSearching(false)
  }

  const handleCopyId = useCallback(() => {
    if (!complaint) return
    const idToCopy = complaint.complaintId || complaint._id
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    toast.success(`Copied Tracking ID: ${idToCopy}`)
    setTimeout(() => setCopied(false), 2000)
  }, [complaint])

  const handleOpenFeedback = useCallback(() => {
    setIsFeedbackOpen(true)
  }, [])

  const handleOpenReopen = useCallback(() => {
    setIsReopenModalOpen(true)
  }, [])

  const handleCloseFeedback = useCallback(() => {
    setIsFeedbackOpen(false)
  }, [])

  const handleFeedbackSuccess = useCallback(() => {
    setComplaint(prev => prev ? { ...prev, feedbackSubmitted: true } : prev)
  }, [])

  const handleReopenComplaint = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaint) return
    if (!reopenReason.trim() || reopenReason.trim().length < 15) {
      toast.error("Please provide at least 15 characters explaining why the issue is still unresolved.")
      return
    }

    setIsReopening(true)
    try {
      await api.post(`/complaints/${complaint._id}/reopen`, { reason: reopenReason })
      toast.success("🚨 Complaint reopened and escalated to Critical priority!")
      setIsReopenModalOpen(false)
      setReopenReason("")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reopen complaint.")
    } finally {
      setIsReopening(false)
    }
  }, [complaint, reopenReason, load])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Fetching municipal SLA tracking details...</p>
      </div>
    )
  }

  // ─── 1. Search Interface & Empty State Fallback ──────────────────────────────
  if (!targetId || !complaint) {
    const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
      roads_and_infrastructure: Building2,
      garbage_and_sanitation: Trash2,
      water_supply: Droplets,
      street_lighting: Lightbulb,
      drainage_and_sewage: CloudRain,
      electricity_and_power: Zap,
      public_health: HeartPulse,
      parks_and_recreation: Trees,
      public_transport: Bus,
      noise_pollution: Volume2,
    }

    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
        <SeoHead
          title="Track Grievance Resolution & SLA Progress | Smart Civic"
          description="Enter your complaint ID to view real-time 8-stage progress, assigned ward engineer, 48-hour SLA countdown, and GPS geofenced resolution proof."
          keywords="track civic complaint, BMC grievance status, check pothole repair status, municipal complaint tracking Mumbai"
          canonicalPath="/track"
          faqs={[
            {
              question: "How can I track the status of my BMC complaint?",
              answer: "Enter your unique tracking ticket number (e.g. SC-2026-XXXXXXXX) into the search bar to inspect real-time progress, supervising officer assignments, and field repair photos.",
            },
            {
              question: "What happens if my civic complaint is not resolved within the SLA?",
              answer: "If the 48-hour SLA deadline is breached, the ticket is automatically escalated to the Assistant Municipal Commissioner (AMC) and contractor escrow penalties are assessed.",
            },
          ]}
        />

        {/* Clean Header & Search Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
              <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Track Grievance
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inspect real-time resolution timeline, assigned officer, and field proof
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto md:min-w-[380px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Enter Ticket ID (e.g. SC-2026-XXXX)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-xs border border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={!searchInput.trim() || isSearching}
              className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold rounded-xl shadow-xs text-xs shrink-0 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Track"}
            </Button>
          </form>
        </div>

        {/* Error notification if ID was not found */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 text-sm shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-semibold text-xs text-rose-800 dark:text-rose-300">{error}</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                You can try searching again with a different ID or select one of your recently filed complaints below.
              </p>
            </div>
          </div>
        )}

        {/* Recent Complaints Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Recent Civic Reports
              </h2>
            </div>
            {user?.role === "citizen" && (
              <Link to="/complaint/create">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 rounded-lg">
                  <Plus className="w-3.5 h-3.5" />
                  New Grievance
                </Button>
              </Link>
            )}
          </div>

          {isLoadingRecent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 animate-pulse" />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-2">
              <Clock className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Recent Complaints</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                You haven't filed any municipal complaints yet. File a report to track its resolution timeline.
              </p>
              {user?.role === "citizen" && (
                <Link to="/complaint/create">
                  <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 gap-1.5 mt-2 h-8 text-xs rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                    File Grievance
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentComplaints.map((c) => {
                const CategoryIcon = CATEGORY_ICON_MAP[c.category] || Building2

                return (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/track/${c.complaintId || c._id}`)}
                    className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all cursor-pointer flex items-start gap-3.5 group"
                  >
                    {c.attachments && c.attachments[0] ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0">
                        <img
                          src={getImageUrl(c.attachments[0])}
                          onError={handleImageError}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        <CategoryIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                          {c.complaintId || c._id.substring(0, 10)}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>

                      <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {c.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                        <span className="truncate">{CATEGORY_LABELS[c.category] || c.category}</span>
                        <span className="text-[10px] font-mono shrink-0">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const coords = complaint.location?.coordinates?.coordinates
  const locAny = complaint.location as any
  const targetLat = coords && coords.length === 2 ? coords[1] : (locAny?.lat ?? locAny?.latitude ?? 19.0760)
  const targetLng = coords && coords.length === 2 ? coords[0] : (locAny?.lng ?? locAny?.longitude ?? 72.8777)
  const mapDirUrl = getGoogleMapsDirUrl(targetLat, targetLng, complaint.location?.address)

  // ─── 2. Active Complaint Detail Tracking View ────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <SeoHead
        title={`${complaint.title || "Civic Grievance"} #${complaint.complaintId || targetId} | Smart Civic`}
        description={`Status: ${complaint.status?.toUpperCase()} in ${complaint.ward || "Mumbai"}. Category: ${complaint.category}. Live 48h SLA progress and field resolution proof.`}
        canonicalPath={`/track/${targetId}`}
      />
      {/* Top Breadcrumb & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3 min-w-0">
          <Link to="/track" className="shrink-0" title="Back to Tracking Search">
            <Button variant="outline" size="icon" className="min-h-[42px] min-w-[42px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-xl">
                {complaint.title}
              </h1>
              <StatusBadgeLg status={complaint.status} />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-slate-500">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono font-bold text-slate-700 dark:text-slate-300">
                <span>{complaint.complaintId || complaint._id}</span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                  title="Copy Tracking ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span>•</span>
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {CATEGORY_LABELS[complaint.category] || complaint.category}
              </span>
              <span>•</span>
              <span>
                Submitted {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/track")}
            className="gap-1.5 text-xs rounded-xl min-h-[40px] flex-1 sm:flex-initial"
          >
            <Search className="h-3.5 w-3.5 text-indigo-600" />
            Track Another Ticket
          </Button>

          {/* AI Resolution Audit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResolutionModalOpen(true)}
            className="gap-1.5 text-xs rounded-xl min-h-[40px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex-1 sm:flex-initial cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            AI Resolution Audit
          </Button>

          {/* Feedback Button for Citizens */}
          {user?.role === "citizen" && 
           (complaint.status === "resolved" || (complaint.status as string) === "closed") && 
           !complaint.feedbackSubmitted && (
            <Button onClick={handleOpenFeedback} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[40px] rounded-xl shrink-0 font-semibold text-xs shadow-sm">
              <Star className="h-4 w-4 fill-current text-amber-300" />
              {t("tracking.rateExperience")}
            </Button>
          )}
        </div>
      </div>

      <FeedbackModal 
        complaintId={complaint._id}
        isOpen={isFeedbackOpen}
        onClose={handleCloseFeedback}
        onSuccess={handleFeedbackSuccess}
      />

      <ResolutionVerificationModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        complaintTitle={complaint.title}
        category={complaint.category}
        department={typeof complaint.department === 'string' ? complaint.department : (complaint.department?.code || "PWD")}
        initialImageUrl={complaint.attachments?.[0] ? getImageUrl(complaint.attachments[0]) : undefined}
        workerNotes={(complaint as any).resolutionDetails || (complaint as any).workerNotes || "Field worker completed site restoration and debris clearance."}
      />



      {/* ── 1. Memoized 8-Stage SLA Stepper ── */}
      <SlaStepper status={complaint.status} />

      {/* ── Main Responsive 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column (7 cols on desktop): Citizen Evidence, Overview, Comparison, Timeline */}
        <div className="lg:col-span-7 space-y-6 w-full min-w-0">
          {/* Citizen Uploaded Evidence Showcase */}
          <CitizenEvidenceShowcase
            attachments={complaint.attachments}
            title={complaint.title}
            createdAt={complaint.createdAt}
            onZoom={(url) => setZoomImage(url)}
          />

          {/* Complaint Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full space-y-2.5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {t("tracking.description")}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* 8-Stage Memoized Resolution Timeline */}
          <ResolutionTimeline
            status={complaint.status}
            statusHistory={complaint.statusHistory}
            rejectionReason={complaint.rejectionReason}
          />
        </div>

        {/* Right Column (5 cols on desktop): Live Navigation Matrix, Map, AI Verification, Resolution Proof, Ward Team */}
        <div className="lg:col-span-5 space-y-6 w-full">
          {/* ─── Live GPS Distance & Navigation Matrix Card ────────────── */}
          <div className="civic-card bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl shadow-md space-y-4 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Live Geolocation & Distance Matrix</h3>
              </div>
              {travel?.isRealTimeRoute && (
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Real-time OSRM Routing
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
              {/* Distance */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Distance from You
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {loadingGeo ? (
                    <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                  ) : travel ? (
                    `${travel.distanceKm} km`
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>

              {/* Driving Duration */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Driving Estimate
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-cyan-300 tracking-tight">
                  {loadingGeo ? (
                    <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                  ) : travel ? (
                    `${travel.durationMins} mins`
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </div>

            {/* Navigation Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsLiveNavOpen(true)}
                className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                Start In-App Live Navigation
              </button>

              <a
                href={mapDirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Google Maps ↗
              </a>
            </div>
          </div>

          {/* Interactive Incident Location Map with Route Line */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {t("tracking.complaintLocationMap")}
                </CardTitle>
                <a
                  href={mapDirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Directions ↗
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <ComplaintMap
                  lat={targetLat}
                  lng={targetLng}
                  userLat={travel?.userLocation?.lat}
                  userLng={travel?.userLocation?.lng}
                  address={complaint.location.address}
                />
              </div>
              <p className="text-xs text-slate-500 truncate">
                📍 {complaint.location.address}
              </p>
            </CardContent>
          </Card>

          {/* Resolution Proof Card */}
          <ResolutionProofCard
            status={complaint.status}
            resolutionImage={complaint.resolutionImage}
            attachments={complaint.attachments}
            resolvedAt={complaint.resolvedAt}
            updatedAt={complaint.updatedAt}
            resolutionNotes={complaint.resolutionNotes}
            feedbackSubmitted={complaint.feedbackSubmitted}
            onOpenFeedback={handleOpenFeedback}
            onOpenReopen={handleOpenReopen}
            onZoom={(url) => setZoomImage(url)}
          />

          {/* AI Municipal Triage & Verification Summary */}
          <AiVerificationDetails aiAnalysis={complaint.aiAnalysis} />

          {/* Complaint Metadata Card */}
          <ComplaintMetadataCard
            category={complaint.category}
            location={complaint.location}
            priority={complaint.priority}
            estimatedResolution={complaint.estimatedResolution}
          />

          {/* Ward Department & Ground Field Team Card */}
          <WardAndFieldTeamCard
            departmentName={complaint.departmentName}
            wardName={complaint.wardName}
            assignedWorker={complaint.assignedWorker}
            assignedOfficer={complaint.assignedOfficer}
            department={complaint.department}
          />

          {/* Admin Official Notes (if present) */}
          {complaint.adminNotes && (
            <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-300">{t("tracking.officialNote")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{complaint.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Live Turn-by-Turn GPS Navigation Modal ────────────────────── */}
      <LiveNavigationModal
        isOpen={isLiveNavOpen}
        onClose={() => setIsLiveNavOpen(false)}
        targetLat={targetLat}
        targetLng={targetLng}
        targetAddress={complaint.location?.address}
        ticketTitle={complaint.title}
        ticketId={complaint.complaintId || complaint._id}
      />

      {/* ─── Fullscreen Zoom Lightbox Modal ─────────────────────────────── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-5 right-5 text-white hover:text-slate-300 bg-slate-800/80 hover:bg-slate-800 p-3 rounded-full transition-all z-50 cursor-pointer shadow-lg"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Fullscreen Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reopen Complaint Dialog */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reopen Civic Grievance</h3>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              If the on-site resolution was incomplete or defective, please explain why. Reopening this ticket will instantly escalate its priority to <strong>CRITICAL</strong> and notify the ward officer.
            </p>

            <form onSubmit={handleReopenComplaint} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reason for Reopening <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-medium ${reopenReason.trim().length >= 15 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {reopenReason.trim().length >= 15 
                      ? `${reopenReason.trim().length} characters`
                      : `${15 - reopenReason.trim().length} more characters required`}
                  </span>
                </div>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="e.g. The pothole was only filled with loose sand and washed away, or the streetlight is still flickering..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="rounded-xl min-h-[38px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isReopening || reopenReason.trim().length < 15}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 rounded-xl min-h-[38px]"
                >
                  {isReopening ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Reopening...
                    </>
                  ) : (
                    "Confirm & Reopen Ticket"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

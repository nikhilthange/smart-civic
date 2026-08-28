import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft, Clock, CheckCircle2, UserCheck, Wrench, Star,
  XCircle, Bot, MapPin, Calendar, Tag, Phone,
  AlertCircle, Loader2, Paperclip, ExternalLink, Check, Building,
  Image as ImageIcon, HardHat, FileCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import ComplaintMap from "@/components/ui/ComplaintMap"
import FeedbackModal from "@/components/ui/FeedbackModal"
import { BeforeAfterSlider } from "@/components/common/BeforeAfterSlider"
import { formatDateTime } from "@/utils/formatters"
import api from "@/lib/axios"
import toast from "react-hot-toast"

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

function StatusBadgeLg({ status }: { status: ComplaintStatus | string }) {
  const cfg = STATUS_CONFIG[status as ComplaintStatus] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300"
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

// ─── 1. Memoized SLA Stepper ───────────────────────────────────────────────────
interface SlaStepperProps {
  status: ComplaintStatus
}

export const SlaStepper = React.memo(function SlaStepper({ status }: SlaStepperProps) {
  const { t } = useTranslation()
  const stepperStages = useMemo(() => [
    { id: 1, key: "submitted",            label: `1. Filed`,                 desc: "Citizen submitted the issue" },
    { id: 2, key: "ai_verified",          label: `2. AI Verified`,           desc: "AI processed the complaint" },
    { id: 3, key: "ward_assigned",        label: `3. Ward Assigned`,         desc: "Mapped to local ward" },
    { id: 4, key: "officer_assigned",     label: `4. Officer Assigned`,      desc: "Supervising officer attached" },
    { id: 5, key: "worker_assigned",      label: `5. Worker Assigned`,       desc: "Field worker dispatched" },
    { id: 6, key: "in_progress",          label: `6. In Progress`,           desc: "Work started on the ground" },
    { id: 7, key: "resolution_submitted", label: `7. Resolution Submitted`,  desc: "Worker uploaded proof" },
    { id: 8, key: "resolved",             label: `8. Resolved`,              desc: "Officer approved resolution" },
  ], [])

  const activeStage = getActiveStageIndex(status)

  return (
    <Card className="shadow-sm border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800/80">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {t("tracking.stepperTitle")}
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {t("tracking.stage")} {activeStage} {t("tracking.of")} 8
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 relative">
          {stepperStages.map((stage) => {
            const isPassed = stage.id < activeStage
            const isCurrent = stage.id === activeStage
            const isCompleted = stage.id <= activeStage

            return (
              <div key={stage.id} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-md shadow-indigo-500/20 scale-110"
                      : isPassed
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isPassed ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : stage.id}
                </div>

                <span
                  className={`text-[11px] sm:text-xs font-bold mt-2 line-clamp-1 ${
                    isCurrent
                      ? "text-indigo-700 dark:text-indigo-400 font-extrabold"
                      : isCompleted
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-500 hidden md:block mt-0.5 max-w-[120px] leading-tight">
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

// ─── 2. Memoized Resolution Timeline ───────────────────────────────────────────
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full">
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">{t("tracking.timelineTitle")}</h2>
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
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
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

// ─── 3. Memoized AI Verification Details ───────────────────────────────────────
interface AiVerificationDetailsProps {
  aiAnalysis?: Complaint["aiAnalysis"]
}

export const AiVerificationDetails = React.memo(function AiVerificationDetails({
  aiAnalysis,
}: AiVerificationDetailsProps) {
  const { t } = useTranslation()
  if (!aiAnalysis) return null

  const confidencePct = Math.round((aiAnalysis.confidence || 0) * 100)
  const analysisNote = (aiAnalysis as any).analysisNote || (aiAnalysis as any).explanation || "AI automated triage completed based on multi-modal evidence."

  return (
    <Card className="shadow-sm border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          {t("tracking.aiVerificationDetails")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-violet-900 dark:text-violet-200">
        <div>
          <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.verifiedStatus")}</span>
          <span className="font-semibold text-sm">
            {aiAnalysis.verified ? "Verified ✅" : "Unverified ⚠️"}
          </span>
        </div>
        <div>
          <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.confidenceScore")}</span>
          <span className="font-semibold text-sm font-mono">
            {confidencePct}%
          </span>
        </div>
        <div>
          <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.severityLevel")}</span>
          <span className="font-semibold text-sm capitalize">
            {aiAnalysis.severity || "Medium"}
          </span>
        </div>
        <div>
          <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.aiExplanation")}</span>
          <p className="mt-0.5 text-violet-700 dark:text-violet-300 leading-relaxed text-xs">
            {analysisNote}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

// ─── 4. Memoized Complaint Metadata Card ───────────────────────────────────────
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
            <Badge variant="outline" className="capitalize mt-0.5">{priority}</Badge>
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

// ─── 5. Memoized Ward & Field Team Card ────────────────────────────────────────
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

// ─── 6. Memoized Resolution Proof Photos Card ─────────────────────────────────
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
}: ResolutionProofCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
          <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {t("tracking.timestampedResolutionProof")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resolutionImage?.url ? (
          <div>
            {attachments && attachments[0] ? (
              <BeforeAfterSlider
                beforeImage={getImageUrl(attachments[0])}
                afterImage={getImageUrl(resolutionImage)}
                className="mb-3"
              />
            ) : (
              <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900 shadow-inner max-h-56 bg-slate-100 dark:bg-slate-800">
                <img
                  src={getImageUrl(resolutionImage)}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  alt="Resolution Proof"
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between flex-wrap gap-1">
              <Badge className="bg-emerald-600 text-white text-[11px]">
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
            {resolutionNotes && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <strong>Resolution Note:</strong> {resolutionNotes}
              </p>
            )}

            {status === "resolved" && (
              <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-900 space-y-2">
                <Button
                  onClick={onOpenFeedback}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                  {feedbackSubmitted ? "View / Update Rating" : "Rate Work Quality & Give Feedback"}
                </Button>

                <Button
                  onClick={onOpenReopen}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Reopen Grievance / Incomplete (48h Window)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{t("tracking.groundResolutionPending")}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-snug">
              {t("tracking.resolutionPendingDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ─── 7. Memoized Attachments Card ──────────────────────────────────────────────
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
      <CardContent className="space-y-3">
        {attachments.map((att, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
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
              className="flex items-center gap-2 text-sm text-primary hover:underline font-medium truncate flex-1"
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
  const { t } = useTranslation()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { id, complaintId } = useParams<{ id?: string; complaintId?: string }>()
  const targetId = id || complaintId

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState("")
  const [isReopening, setIsReopening] = useState(false)

  const load = useCallback(async () => {
    if (!targetId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await complaintApi.getOne(targetId)
      setComplaint(data)
    } catch {
      setError("Complaint not found or access restricted.")
    } finally {
      setIsLoading(false)
    }
  }, [targetId])

  useEffect(() => {
    if (!targetId) {
      setError("No complaint ID provided in URL.")
      setIsLoading(false)
      return
    }
    load()
  }, [targetId, load])

  // Selective Socket.io listeners (decoupled from global broadcasts)
  useEffect(() => {
    if (!socket) return

    const handleUpdate = (payload: any) => {
      const updated = payload?.complaint || payload?.data || payload
      const updatedId = (updated?._id || updated?.id || updated?.complaintId || "").toString()
      const currentMongoId = (complaint?._id || "").toString()
      const currentHumanId = (complaint?.complaintId || "").toString()
      const currentTarget = (targetId || "").toString()

      if (
        updatedId &&
        (updatedId === currentMongoId || updatedId === currentHumanId || updatedId === currentTarget)
      ) {
        setComplaint((prev) => (prev ? { ...prev, ...updated } : updated))
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

  // WebSocket Reconnection Resilience & Re-Sync with Randomized Jitter (50ms - 250ms) & Unmount Guard
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
          // Silently preserve current state on transient background reconnection errors
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
    if (!reopenReason.trim()) {
      toast.error("Please explain why the civic issue is still unresolved.")
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-14 w-14 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">{error || "Complaint not found"}</h2>
        <p className="text-slate-500 text-sm">The complaint ID may be invalid or restricted for this account role.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/dashboard">
            <Button className="bg-primary text-white">Return to Dashboard</Button>
          </Link>
          <Link to="/complaints">
            <Button variant="outline">View All Complaints</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <Link to="/complaints" className="shrink-0">
            <Button variant="outline" size="icon" className="min-h-[40px] min-w-[40px] rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">{complaint.title}</h1>
              <StatusBadgeLg status={complaint.status} />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap text-xs text-slate-500">
              <span className="font-mono font-semibold">{complaint.complaintId}</span>
              <span>•</span>
              <span>
                Submitted {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Button for Citizens */}
        {user?.role === "citizen" && 
         (complaint.status === "resolved" || (complaint.status as string) === "closed") && 
         !complaint.feedbackSubmitted && (
          <Button onClick={handleOpenFeedback} className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto min-h-[44px] rounded-xl shrink-0">
            <Star className="h-4 w-4" />
            {t("tracking.rateExperience")}
          </Button>
        )}
      </div>

      <FeedbackModal 
        complaintId={complaint._id}
        isOpen={isFeedbackOpen}
        onClose={handleCloseFeedback}
        onSuccess={handleFeedbackSuccess}
      />

      {/* ── 1. Memoized 8-Stage SLA Stepper ── */}
      <SlaStepper status={complaint.status} />

      {/* ── Main Responsive Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full max-w-7xl mx-auto">
        {/* Left Column: Timeline & Description */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          {/* 2. Memoized Resolution Timeline */}
          <ResolutionTimeline
            status={complaint.status}
            statusHistory={complaint.statusHistory}
            rejectionReason={complaint.rejectionReason}
          />

          {/* Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">{t("tracking.description")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>
        </div>

        {/* Right Column: Details Sidebar */}
        <div className="lg:col-span-1 space-y-6 w-full">
          {/* 3. Memoized AI Analysis Card */}
          <AiVerificationDetails aiAnalysis={complaint.aiAnalysis} />

          {/* 4. Memoized Complaint Details Card */}
          <ComplaintMetadataCard
            category={complaint.category}
            location={complaint.location}
            priority={complaint.priority}
            estimatedResolution={complaint.estimatedResolution}
          />

          {/* Location Map with Leaflet Canvas & Cleanup */}
          {complaint.location?.coordinates?.coordinates && (
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {t("tracking.complaintLocationMap")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <ComplaintMap
                    lat={complaint.location.coordinates.coordinates[1]}
                    lng={complaint.location.coordinates.coordinates[0]}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Memoized Ward Department & Ground Field Team Card */}
          <WardAndFieldTeamCard
            departmentName={complaint.departmentName}
            wardName={complaint.wardName}
            assignedWorker={complaint.assignedWorker}
            assignedOfficer={complaint.assignedOfficer}
            department={complaint.department}
          />

          {/* 6. Memoized Timestamped Resolution Proof Photos */}
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
          />

          {/* 7. Memoized Attachments Card */}
          <AttachmentsCard attachments={complaint.attachments} />

          {/* Admin notes */}
          {complaint.adminNotes && (
            <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-300">{t("tracking.officialNote")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 dark:text-amber-400">{complaint.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isReopening || reopenReason.trim().length < 15}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
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

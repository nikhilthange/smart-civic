import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft, Clock, CheckCircle2, UserCheck, Wrench, Star,
  XCircle, Bot, MapPin, Calendar, Tag, Phone,
  AlertCircle, Loader2, Paperclip, ExternalLink, Check, Building,
  Image, HardHat, FileCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import ComplaintMap from "@/components/ui/ComplaintMap"
import FeedbackModal from "@/components/ui/FeedbackModal"

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
    case "reopened":             return 2 // Or somewhere else, but usually it restarts the loop
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

export default function ComplaintTracking() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id, complaintId } = useParams<{ id?: string; complaintId?: string }>()
  const targetId = id || complaintId

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  useEffect(() => {
    if (!targetId) {
      setError("No complaint ID provided in URL.")
      setIsLoading(false)
      return
    }
    const load = async () => {
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
    }
    load()
  }, [targetId])

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

  const stepperStages = [
    { id: 1, key: "submitted",            label: `1. Filed`,                 desc: "Citizen submitted the issue" },
    { id: 2, key: "ai_verified",          label: `2. AI Verified`,           desc: "AI processed the complaint" },
    { id: 3, key: "ward_assigned",        label: `3. Ward Assigned`,         desc: "Mapped to local ward" },
    { id: 4, key: "officer_assigned",     label: `4. Officer Assigned`,      desc: "Supervising officer attached" },
    { id: 5, key: "worker_assigned",      label: `5. Worker Assigned`,       desc: "Field worker dispatched" },
    { id: 6, key: "in_progress",          label: `6. In Progress`,           desc: "Work started on the ground" },
    { id: 7, key: "resolution_submitted", label: `7. Resolution Submitted`,  desc: "Worker uploaded proof" },
    { id: 8, key: "resolved",             label: `8. Resolved`,              desc: "Officer approved resolution" },
  ]

  const currentStatusIndex = ALL_STATUSES.indexOf(complaint.status)
  const historyMap = new Map(complaint.statusHistory.map(h => [h.status, h]))

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/complaints">
          <Button variant="outline" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">{complaint.title}</h1>
            <StatusBadgeLg status={complaint.status} />
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="font-mono text-sm font-semibold text-slate-500">{complaint.complaintId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm text-slate-500">
              Submitted {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Feedback Button for Citizens */}
        {user?.role === "citizen" && 
         (complaint.status === "resolved" || (complaint.status as string) === "closed") && 
         !complaint.feedbackSubmitted && (
          <Button onClick={() => setIsFeedbackOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Star className="h-4 w-4" />
            {t("tracking.rateExperience")}
          </Button>
        )}
      </div>

      <FeedbackModal 
        complaintId={complaint._id}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSuccess={() => {
          setComplaint(prev => prev ? { ...prev, feedbackSubmitted: true } : prev)
        }}
      />

      {/* ── 5-Step Visual Stepper Progress Bar ── */}
      <Card className="shadow-sm border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800/80">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {t("tracking.stepperTitle")}
            </h3>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {t("tracking.stage")} {getActiveStageIndex(complaint.status)} {t("tracking.of")} 5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {stepperStages.map((stage) => {
              const activeStage = getActiveStageIndex(complaint.status)
              const isPassed = stage.id < activeStage
              const isCurrent = stage.id === activeStage
              const isCompleted = stage.id <= activeStage

              return (
                <div key={stage.id} className="flex flex-col items-center text-center relative z-10">
                  {/* Stage Icon/Number Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all ${
                      isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-md shadow-indigo-500/20 scale-110"
                        : isPassed
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4 stroke-[3]" /> : stage.id}
                  </div>

                  {/* Stage Title */}
                  <span
                    className={`text-xs font-bold mt-2.5 line-clamp-1 ${
                      isCurrent
                        ? "text-indigo-700 dark:text-indigo-400 font-extrabold"
                        : isCompleted
                        ? "text-slate-900 dark:text-white font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5 max-w-[130px] leading-tight">
                    {stage.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Responsive Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full max-w-7xl mx-auto">
        {/* Left Column: Timeline & Description */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          {/* Resolution Timeline Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">{t("tracking.timelineTitle")}</h2>
            <div className="relative space-y-6">
              {ALL_STATUSES.map((status, index) => {
                const Icon = STATUS_ICONS[status] || Clock
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const historyEntry = historyMap.get((status === "submitted" ? "pending" : status) as ComplaintStatus)
                const isLast = index === ALL_STATUSES.length - 1

                if ((complaint.status as string) === "rejected" && index >= ALL_STATUSES.indexOf("in_progress")) return null

                return (
                  <div key={status} className="relative flex items-start gap-4">
                    {/* Vertical line */}
                    {!isLast && (
                      <div className={`absolute left-3.5 top-7 w-0.5 h-full -translate-x-1/2 ${
                        isCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                      }`} />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${
                      isCurrent
                        ? "bg-emerald-600 text-white ring-emerald-200 shadow-md shadow-emerald-500/20"
                        : isCompleted
                        ? "bg-emerald-600 text-white ring-white dark:ring-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-700"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-sm ${isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                          {status === "submitted" ? t("tracking.submitted") :
                           STATUS_CONFIG[status as ComplaintStatus]?.label || status}
                        </h3>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            {t("tracking.currentStage")}
                          </span>
                        )}
                      </div>
                      {historyEntry && (
                        <time className="text-xs text-slate-400 mt-0.5 block">
                          {new Date(historyEntry.changedAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </time>
                      )}
                      {historyEntry?.note && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{historyEntry.note}</p>
                      )}
                      {!historyEntry && !isCompleted && (
                        <p className="text-xs text-slate-400 mt-0.5">{t("tracking.pending")}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Rejected state */}
              {(complaint.status as string) === "rejected" && (
                <div className="relative flex items-start gap-4 pb-2">
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-100">
                    <XCircle className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">Rejected</h3>
                    {complaint.rejectionReason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50">Reason: {complaint.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm w-full">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">{t("tracking.description")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>
        </div>

        {/* Right Column: Details Sidebar */}
        <div className="lg:col-span-1 space-y-6 w-full">
          {/* AI Analysis Card */}
          {complaint.aiAnalysis && (
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
                    {complaint.aiAnalysis.verified ? "Verified ✅" : "Unverified ⚠️"}
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.confidenceScore")}</span>
                  <span className="font-semibold text-sm">
                    {(complaint.aiAnalysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.severityLevel")}</span>
                  <span className="font-semibold text-sm capitalize">
                    {complaint.aiAnalysis.severity}
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 dark:text-violet-400 block font-medium">{t("tracking.aiExplanation")}</span>
                  <p className="mt-0.5 text-violet-700 dark:text-violet-300 leading-relaxed text-xs">
                    {complaint.aiAnalysis.analysisNote}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complaint Details Card */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{t("tracking.complaintMetadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">{t("tracking.category")}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{CATEGORY_LABELS[complaint.category]}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">{t("tracking.location")}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{complaint.location.address}</p>
                  {complaint.location.city && (
                    <p className="text-slate-500 text-xs">{complaint.location.city}, {complaint.location.state}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">{t("tracking.priority")}</p>
                  <Badge variant="outline" className="capitalize mt-0.5">{complaint.priority}</Badge>
                </div>
              </div>
              {complaint.estimatedResolution && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t("tracking.estimatedResolution")}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(complaint.estimatedResolution).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Map */}
          {complaint.location?.coordinates?.coordinates && (
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {t("tracking.complaintLocationMap")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[240px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <ComplaintMap
                    lat={complaint.location.coordinates.coordinates[1]}
                    lng={complaint.location.coordinates.coordinates[0]}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ward Department & Ground Field Team Card */}
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
                  {complaint.departmentName || complaint.department?.name || "General Administration Department"} ({complaint.wardName || "UNASSIGNED"})
                </p>
                {complaint.department?.contactEmail && (
                  <a href={`mailto:${complaint.department.contactEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 font-medium">
                    <Phone className="h-3 w-3" />
                    {complaint.department.contactEmail}
                  </a>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("tracking.assignedFieldWorker")}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <HardHat className="h-4 w-4 text-amber-600" />
                  {complaint.assignedWorker?.name || "Suresh Shinde (Field Worker)"}
                </p>
              </div>
              {complaint.assignedOfficer && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">{t("tracking.supervisingOfficer")}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {complaint.assignedOfficer?.user?.name || "Officer"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamped Resolution Proof Photos */}
          <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                <Image className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {t("tracking.timestampedResolutionProof")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complaint.resolutionImage?.url ? (
                <div>
                  <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900 shadow-inner max-h-56 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={getImageUrl(complaint.resolutionImage)}
                      onError={handleImageError}
                      alt="Resolution Proof"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between flex-wrap gap-1">
                    <Badge className="bg-emerald-600 text-white text-[11px]">
                      {t("tracking.verifiedProofUploaded")}
                    </Badge>
                    <time className="text-xs text-slate-500 font-mono">
                      {complaint.resolvedAt
                        ? new Date(complaint.resolvedAt).toLocaleString("en-IN")
                        : new Date(complaint.updatedAt).toLocaleString("en-IN")}
                    </time>
                  </div>
                  {complaint.resolutionNotes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                      <strong>Resolution Note:</strong> {complaint.resolutionNotes}
                    </p>
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

          {/* Attachments */}
          {complaint.attachments.length > 0 && (
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  {t("tracking.attachments")} ({complaint.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complaint.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={getImageUrl(att)}
                        onError={handleImageError}
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
          )}

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
    </div>
  )
}

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Clock, CheckCircle2, UserCheck, Wrench, Star,
  XCircle, Lock, Bot, MapPin, Calendar, Tag, Phone,
  AlertCircle, Loader2, Paperclip, ExternalLink, Check, Building,
  Image, HardHat
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"
import { useAuth } from "@/context/AuthContext"
import ComplaintMap from "@/components/ui/ComplaintMap"
import FeedbackModal from "@/components/ui/FeedbackModal"

const STATUS_ICONS: Record<ComplaintStatus | "submitted", React.ElementType> = {
  submitted:   Clock,
  pending:     Clock,
  ai_verified: Bot,
  assigned:    UserCheck,
  in_progress: Wrench,
  resolved:    CheckCircle2,
  closed:      Lock,
  rejected:    XCircle,
}

const ALL_STATUSES: (ComplaintStatus | "submitted")[] = [
  "submitted", "pending", "ai_verified", "assigned", "in_progress", "resolved",
]

const STEPPER_STAGES = [
  { id: 1, key: "pending", label: "1. Filed", desc: "Ticket logged" },
  { id: 2, key: "ai_verified", label: "2. AI Classified", desc: "Verified by Gemini AI" },
  { id: 3, key: "assigned", label: "3. Ward Assigned", desc: "Routed to ward team" },
  { id: 4, key: "in_progress", label: "4. Field Work", desc: "Worker active on site" },
  { id: 5, key: "resolved", label: "5. Closed with Proof", desc: "Closed with photo proof" },
]

function getActiveStageIndex(status: ComplaintStatus): number {
  switch (status) {
    case "pending":
      return 1
    case "ai_verified":
      return 2
    case "assigned":
      return 3
    case "in_progress":
      return 4
    case "resolved":
    case "closed":
      return 5
    default:
      return 1
  }
}

function StatusBadgeLg({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

export default function ComplaintTracking() {
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

  // Build timeline — show statuses up to and including current
  const currentStatusIndex = ALL_STATUSES.indexOf(
    complaint.status === "pending" ? "pending" : (complaint.status as typeof ALL_STATUSES[number])
  )

  // Map statusHistory for notes lookup
  const historyMap = new Map(complaint.statusHistory.map(h => [h.status, h]))

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/complaints">
          <Button variant="outline" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{complaint.title}</h1>
            <StatusBadgeLg status={complaint.status} />
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="font-mono text-sm text-slate-500">{complaint.complaintId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm text-slate-500">
              Submitted {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Button for Citizens */}
      {user?.role === "citizen" && 
       (complaint.status === "resolved" || complaint.status === "closed") && 
       !complaint.feedbackSubmitted && (
        <div className="flex justify-end mt-2">
          <Button onClick={() => setIsFeedbackOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Star className="h-4 w-4" />
            Rate your experience
          </Button>
        </div>
      )}

      <FeedbackModal 
        complaintId={complaint._id}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSuccess={() => {
          // Optimistically update UI
          setComplaint(prev => prev ? { ...prev, feedbackSubmitted: true } : prev)
        }}
      />

      {/* ── 5-Step Visual Stepper Progress Bar ── */}
      <Card className="shadow-sm border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              SLA Resolution Progress Stepper
            </h3>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Stage {getActiveStageIndex(complaint.status)} of 5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {STEPPER_STAGES.map((stage) => {
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
                        : "bg-slate-200 text-slate-500 border border-slate-300"
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4 stroke-[3]" /> : stage.id}
                  </div>

                  {/* Stage Title */}
                  <span
                    className={`text-xs font-bold mt-2.5 line-clamp-1 ${
                      isCurrent
                        ? "text-indigo-700 font-extrabold"
                        : isCompleted
                        ? "text-slate-900 font-semibold"
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

      <div className="grid gap-6 lg:grid-cols-3 mt-2">
        {/* Timeline */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Resolution Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative ml-3">
              {ALL_STATUSES.map((status, index) => {
                const Icon = STATUS_ICONS[status]
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const historyEntry = historyMap.get(status === "submitted" ? "pending" : status)
                const isLast = index === ALL_STATUSES.length - 1

                // Don't show rejected as "not reached" unless complaint was rejected
                if (complaint.status === "rejected" && index >= ALL_STATUSES.indexOf("in_progress")) return null

                return (
                  <div key={status} className="relative flex gap-4 pb-8">
                    {/* Vertical line */}
                    {!isLast && (
                      <div className={`absolute left-3.5 top-7 w-0.5 h-full -translate-x-1/2 ${
                        isCompleted ? "bg-primary" : "bg-slate-200"
                      }`} />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${
                      isCurrent
                        ? "bg-primary text-white ring-primary/20 shadow-lg shadow-primary/30"
                        : isCompleted
                        ? "bg-primary text-white ring-white"
                        : "bg-slate-100 text-slate-400 ring-white border border-slate-200"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-sm ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                          {status === "submitted" ? "Submitted" :
                           STATUS_CONFIG[status as ComplaintStatus]?.label || status}
                        </h3>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Current
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
                        <p className="text-sm text-slate-500 mt-1">{historyEntry.note}</p>
                      )}
                      {!historyEntry && !isCompleted && (
                        <p className="text-xs text-slate-400 mt-0.5">Pending</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Rejected state */}
              {complaint.status === "rejected" && (
                <div className="relative flex gap-4 pb-2">
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-100">
                    <XCircle className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-sm text-red-700">Rejected</h3>
                    {complaint.rejectionReason && (
                      <p className="text-sm text-slate-500 mt-1">Reason: {complaint.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details sidebar */}
        <div className="flex flex-col gap-4">
          {/* AI Analysis Card */}
          {complaint.aiAnalysis && (
            <Card className="shadow-sm border-violet-200 bg-violet-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-violet-600" />
                  AI Verification Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-violet-900">
                <div>
                  <span className="text-violet-600 block">Verified Status</span>
                  <span className="font-semibold text-sm">
                    {complaint.aiAnalysis.verified ? "Verified ✅" : "Unverified ⚠️"}
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 block">Confidence Score</span>
                  <span className="font-semibold text-sm">
                    {(complaint.aiAnalysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 block">Severity Level</span>
                  <span className="font-semibold text-sm capitalize">
                    {complaint.aiAnalysis.severity}
                  </span>
                </div>
                <div>
                  <span className="text-violet-600 block">AI Explanation</span>
                  <p className="mt-0.5 text-violet-700 leading-relaxed text-xs">
                    {complaint.aiAnalysis.analysisNote}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complaint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="font-medium">{CATEGORY_LABELS[complaint.category]}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="font-medium">{complaint.location.address}</p>
                  {complaint.location.city && (
                    <p className="text-slate-500 text-xs">{complaint.location.city}, {complaint.location.state}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Priority</p>
                  <Badge variant="outline" className="capitalize mt-0.5">{complaint.priority}</Badge>
                </div>
              </div>
              {complaint.estimatedResolution && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Estimated Resolution</p>
                    <p className="font-medium">
                      {new Date(complaint.estimatedResolution).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Map */}
          {complaint.location?.coordinates?.coordinates && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Complaint Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[250px] rounded-lg overflow-hidden border border-slate-200">
                  <ComplaintMap
                    lat={complaint.location.coordinates.coordinates[1]}
                    lng={complaint.location.coordinates.coordinates[0]}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ward Department & Ground Field Team Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Building className="h-4 w-4 text-indigo-600" />
                Ward Department & Field Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Ward Department</p>
                <p className="font-semibold text-slate-800">
                  {complaint.department?.name || "Public Works Department"} ({complaint.ward || "Ward A"})
                </p>
                {complaint.department?.contactEmail && (
                  <a href={`mailto:${complaint.department.contactEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {complaint.department.contactEmail}
                  </a>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Field Worker</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <HardHat className="h-4 w-4 text-amber-600" />
                  {complaint.assignedWorker?.name || "Suresh Shinde (Field Worker)"}
                </p>
              </div>
              {complaint.assignedOfficer && (
                <div>
                  <p className="text-xs text-slate-400">Supervising Ward Officer</p>
                  <p className="font-medium text-slate-700">
                    {complaint.assignedOfficer.user.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamped Resolution Proof Photos */}
          <Card className="shadow-sm border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900">
                <Image className="h-4 w-4 text-emerald-600" />
                Timestamped Resolution Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complaint.resolutionImage?.url ? (
                <div>
                  <div className="rounded-lg overflow-hidden border border-emerald-200 shadow-inner max-h-56 bg-slate-100">
                    <img
                      src={complaint.resolutionImage.url.startsWith("http") ? complaint.resolutionImage.url : `http://localhost:5000${complaint.resolutionImage.url}`}
                      alt="Resolution Proof"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between flex-wrap gap-1">
                    <Badge className="bg-emerald-600 text-white text-[11px]">
                      Verified Proof Uploaded
                    </Badge>
                    <time className="text-xs text-slate-500 font-mono">
                      {complaint.resolvedAt
                        ? new Date(complaint.resolvedAt).toLocaleString("en-IN")
                        : new Date(complaint.updatedAt).toLocaleString("en-IN")}
                    </time>
                  </div>
                  {complaint.resolutionNotes && (
                    <p className="text-xs text-slate-600 mt-2 bg-white/90 p-2.5 rounded border border-emerald-100">
                      <strong>Resolution Note:</strong> {complaint.resolutionNotes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 text-center">
                  <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-amber-800">Ground Resolution Pending</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                    Field worker resolution proof photo will be timestamped and attached upon task completion.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {complaint.attachments.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({complaint.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complaint.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={`http://localhost:5000${att.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{att.filename}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Admin notes */}
          {complaint.adminNotes && (
            <Card className="shadow-sm border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800">Official Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">{complaint.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        </CardContent>
      </Card>
    </div>
  )
}

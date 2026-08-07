import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Clock, CheckCircle2, UserCheck, Wrench, Star,
  XCircle, Lock, Bot, MapPin, Calendar, Tag, Phone,
  AlertCircle, Loader2, Paperclip, ExternalLink
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

      <div className="grid gap-6 lg:grid-cols-3 mt-4">
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

          {/* Department / Officer */}
          {(complaint.department || complaint.assignedOfficer) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Assigned To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {complaint.department && (
                  <div>
                    <p className="text-xs text-slate-400">Department</p>
                    <p className="font-medium">{complaint.department.name}</p>
                    {complaint.department.contactEmail && (
                      <a href={`mailto:${complaint.department.contactEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {complaint.department.contactEmail}
                      </a>
                    )}
                  </div>
                )}
                {complaint.assignedOfficer && (
                  <div>
                    <p className="text-xs text-slate-400">Officer</p>
                    <p className="font-medium">{complaint.assignedOfficer.user.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

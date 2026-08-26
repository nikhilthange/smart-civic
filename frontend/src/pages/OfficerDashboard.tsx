import { useState, useEffect, useRef, useCallback } from "react";
import { Building2, Filter, Loader2, AlertCircle, MapPin, Users, CheckCircle2, FileCheck, X, Camera, LayoutGrid, Kanban } from "lucide-react";
import { complaintApi, type Complaint, type ComplaintStatus } from "../services/complaintApi";
import { getImageUrl, handleImageError } from "@/utils/imageUrl";
import { ComplaintDetailModal } from "@/components/common/ComplaintDetailModal";
import { SkeletonActivityFeed } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { useSocket } from "@/context/SocketContext";
import { ComplaintsKanbanBoard } from "@/components/admin/ComplaintsKanbanBoard";
import { BulkOperationsToolbar } from "@/components/admin/BulkOperationsToolbar";

const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole/Road Damage",
  garbage: "Garbage Collection",
  water: "Water Supply/Leakage",
  electricity: "Streetlight/Electricity",
  other: "Other Civic Issue",
};

const STATUS_CONFIG: Partial<Record<ComplaintStatus, { label: string; color: string; bg: string; border: string }>> = {
  submitted: { label: "Filed", color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-300" },
  pending: { label: "Filed", color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-300" },
  ai_verified: { label: "AI Verified", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-300" },
  ward_assigned: { label: "Ward Assigned", color: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-300" },
  officer_assigned: { label: "Officer Assigned", color: "text-purple-700", bg: "bg-purple-100", border: "border-purple-300" },
  worker_assigned: { label: "Worker Assigned", color: "text-cyan-700", bg: "bg-cyan-100", border: "border-cyan-300" },
  in_progress: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
  resolution_submitted: { label: "Proof Uploaded", color: "text-teal-700", bg: "bg-teal-100", border: "border-teal-300" },
  resolved: { label: "Resolved", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300" },
  closed: { label: "Closed", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" },
  reopened: { label: "Reopened", color: "text-red-700", bg: "bg-red-100", border: "border-red-300" },
  rejected: { label: "Rejected", color: "text-rose-700", bg: "bg-rose-100", border: "border-rose-300" },
};

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailModalComplaint, setDetailModalComplaint] = useState<Complaint | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [selectedComplaintIds, setSelectedComplaintIds] = useState<string[]>([]);

  // Modal Resolution Form State
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [workNotes, setWorkNotes] = useState("");

  // Field Worker Assignment State
  const [selectedForWorker, setSelectedForWorker] = useState<Complaint | null>(null);
  const [eligibleWorkers, setEligibleWorkers] = useState<any[]>([]);
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignReason, setReassignReason] = useState("");

  // Reject Rework Modal
  const [selectedForReject, setSelectedForReject] = useState<Complaint | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch complaints
  const loadComplaints = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (wardFilter && wardFilter !== "all") {
        params.ward = wardFilter;
      }
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      const data = await complaintApi.getAll(params);
      setComplaints(data.complaints || []);
    } catch (err: any) {
      if (!silent) {
        console.error("Error loading officer task queue:", err);
        setFetchError(err.response?.data?.message || "Failed to load officer task queue. Please retry.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [wardFilter, statusFilter]);

  const { lastEvent } = useSocket();

  useEffect(() => {
    loadComplaints();

    // Auto-sync polling every 10s
    const timer = setInterval(() => {
      loadComplaints(true);
    }, 10000);

    const onFocus = () => loadComplaints(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadComplaints]);

  // Instant reactive WebSocket event refresh
  useEffect(() => {
    if (lastEvent) {
      loadComplaints(true);
    }
  }, [lastEvent, loadComplaints]);

  // File Upload Handlers for Resolution Proof
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResolutionFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setResolutionFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartWork = async (id: string) => {
    try {
      await complaintApi.startWork(id);
      loadComplaints();
    } catch (err) {
      console.error("Failed to start work:", err);
    }
  };

  const handleApproveResolution = async (id: string) => {
    try {
      await complaintApi.approveResolution(id);
      loadComplaints();
    } catch (err) {
      console.error("Failed to approve resolution:", err);
    }
  };

  const handleRejectResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReject || !rejectReason.trim()) return;
    try {
      await complaintApi.rejectResolution(selectedForReject._id, rejectReason);
      setSelectedForReject(null);
      setRejectReason("");
      loadComplaints();
    } catch (err) {
      console.error("Failed to reject resolution:", err);
    }
  };

  // Submit Resolution Modal
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedComplaint) return;

    if (!resolutionFile) {
      setFeedback({
        type: "error",
        text: "Mandatory 'After Resolution' proof image is required.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const notes = workNotes ? `${resolutionDescription}\n\nInternal Notes: ${workNotes}` : resolutionDescription;
      await complaintApi.workerSubmitProof(selectedComplaint._id, resolutionFile, notes);
      setFeedback({
        type: "success",
        text: "Proof submitted successfully!",
      });

      setTimeout(() => {
        setSelectedComplaint(null);
        handleRemoveFile();
        setResolutionDescription("");
        setWorkNotes("");
        setFeedback(null);
        loadComplaints();
      }, 1200);
    } catch (err: any) {
      console.error("Error resolving complaint:", err);
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to resolve complaint.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchEligibleWorkers = async (complaint: Complaint, reassign = false) => {
    try {
      setSelectedForWorker(complaint);
      setIsReassigning(reassign);
      setReassignReason("");
      setEligibleWorkers([]);
      const workers = await complaintApi.getEligibleWorkers(complaint._id);
      
      if (reassign && complaint.assignedWorker?._id) {
        setEligibleWorkers(workers.filter((w: any) => w._id !== complaint.assignedWorker?._id));
      } else {
        setEligibleWorkers(workers);
      }
    } catch (err) {
      console.error("Failed to fetch workers:", err);
    }
  };

  const handleAssignWorker = async (workerId: string) => {
    if (!selectedForWorker) return;
    
    if (isReassigning && !reassignReason) {
      setFeedback({ type: "error", text: "Reason is required for reassignment." });
      return;
    }

    try {
      if (isReassigning) {
        await complaintApi.reassignWorker(selectedForWorker._id, workerId, reassignReason);
      } else {
        await complaintApi.assignWorker(selectedForWorker._id, workerId);
      }
      setSelectedForWorker(null);
      loadComplaints();
    } catch (err: any) {
      console.error("Failed to assign/reassign worker:", err);
      setFeedback({ type: "error", text: err.response?.data?.message || "Action failed." });
    } finally {
      // isAssigningWorker state removed
    }
  };

  const filteredComplaints = complaints.filter((c: Complaint) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    let matchesWard = wardFilter === "all";
    if (!matchesWard) {
      const targetWard = wardFilter.split("(")[0].trim().toLowerCase();
      const compWard = (c.ward || c.wardName || (c as any).zone || (c as any).wardCode || "").toLowerCase();
      matchesWard = compWard.includes(targetWard) || targetWard.includes(compWard);
    }
    return matchesStatus && matchesWard;
  });

  const priorityColors: Record<string, string> = {
    critical: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    high: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    medium: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    low: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Municipal Officer Field Portal</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            BMC Ward Governance Task Queue & SLA Breach Monitor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All BMC Wards</option>
              <option value="Ward A">Ward A (Colaba/Fort)</option>
              <option value="Ward C">Ward C (Chandanwadi)</option>
              <option value="Ward D">Ward D (Grant Road)</option>
              <option value="Ward F-South">Ward F-South (Parel)</option>
              <option value="Ward G-South">Ward G-South (Worli)</option>
              <option value="Ward H-West">Ward H-West (Bandra)</option>
              <option value="Ward K-East">Ward K-East (Andheri)</option>
              <option value="Ward L">Ward L (Kurla)</option>
              <option value="Ward M-East">Ward M-East (Govandi)</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="officer_assigned">Officer Assigned</option>
            <option value="worker_assigned">Worker Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolution_submitted">Proof Uploaded</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Grid vs Kanban View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {fetchError ? (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
          <h3 className="text-base font-semibold text-red-800">Task Queue Error</h3>
          <p className="text-sm text-red-600 mt-1 max-w-md">{fetchError}</p>
          <button
            onClick={() => loadComplaints(false)}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        <SkeletonActivityFeed count={6} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No Pending Field Issues"
          description="All municipal ward tickets in this queue are resolved or up-to-date."
          icon={CheckCircle2}
        />
      ) : viewMode === "kanban" ? (
        <ComplaintsKanbanBoard
          complaints={filteredComplaints}
          onSelectComplaint={(c) => setDetailModalComplaint(c)}
          onStatusChange={async (complaintId, newStatus) => {
            try {
              await complaintApi.updateStatus(complaintId, { status: newStatus as any, note: "Kanban matrix quick update" });
              loadComplaints(true);
            } catch {
              // fallback
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((c: Complaint) => {
            const statusCfg = STATUS_CONFIG[c.status as ComplaintStatus] || { label: c.status || "Unknown", color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-300" };
            const priorityStyle = priorityColors[c.priority || "medium"];
            const isSelected = selectedComplaintIds.includes(c._id);

            return (
              <div
                key={c._id}
                className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                    : "border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-lg"
                }`}
              >
                {/* Multi-select checkbox bar */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-500 select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedComplaintIds((prev: string[]) =>
                          isSelected ? prev.filter((id: string) => id !== c._id) : [...prev, c._id]
                        );
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span>Select for Bulk Action</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{c.complaintId}</span>
                </div>
                <div
                  className="cursor-pointer group"
                  onClick={() => setDetailModalComplaint(c)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${priorityStyle}`}
                      >
                        {c.priority || "medium"}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold font-display text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold mt-0.5">
                    {CATEGORY_LABELS[c.category] || c.category}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{c.description}</p>

                  {c.attachments && c.attachments[0] && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.08] h-36 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={getImageUrl(c.attachments[0])}
                        onError={handleImageError}
                        alt="User Uploaded Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.location?.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      <Users className="w-4 h-4 flex-shrink-0 text-amber-600" />
                      <span className="font-mono font-tabular">{c.affectedCitizensCount || 1} Citizens Affected</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {c.status === "officer_assigned" && (
                      <button
                        onClick={() => handleFetchEligibleWorkers(c)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-emerald-600/20 active:scale-[0.98] transition-all"
                      >
                        Assign Field Worker
                      </button>
                    )}
                    {(c.status === "worker_assigned" || c.status === "in_progress") && (
                      <button
                        onClick={() => handleFetchEligibleWorkers(c, true)}
                        className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        Reassign Worker
                      </button>
                    )}
                    {c.status === "worker_assigned" && (
                      <button
                        onClick={() => handleStartWork(c._id)}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-teal-600/20 active:scale-[0.98] transition-all"
                      >
                        Start Work
                      </button>
                    )}
                  </div>

                  {c.status === "in_progress" && (
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setFeedback(null);
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" />
                      Submit Resolution Proof
                    </button>
                  )}

                  {c.status === "resolution_submitted" && (
                    <div className="flex flex-col gap-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm mb-2">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase mb-1 font-mono">Worker Description</p>
                        <p className="text-slate-600 dark:text-slate-300 mb-2">{c.resolutionNotes || "No notes provided."}</p>
                        {c.resolutionImage && c.resolutionImage.url && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 h-24 bg-slate-100 dark:bg-slate-800">
                             <img src={getImageUrl(c.resolutionImage)} onError={handleImageError} alt="Resolution" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveResolution(c._id)}
                          className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedForReject(c)}
                          className="flex-1 py-2 px-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Rework
                        </button>
                      </div>
                    </div>
                  )}

                  {c.status === "resolved" && (
                    <span className="w-full text-center py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      Resolved on {new Date(c.resolvedAt || c.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#1E293B] mb-1">Submit Proof</h2>
            <p className="text-xs text-gray-500 mb-4">
              Ticket: <span className="font-semibold text-gray-700">{selectedComplaint.complaintId}</span> -{" "}
              {selectedComplaint.title}
            </p>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  After-Resolution Proof Photo <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 h-44 bg-gray-50">
                    <img src={filePreview} alt="Resolution preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#0284C7] bg-gray-50 hover:bg-blue-50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center"
                  >
                    <Camera className="w-10 h-10 text-[#0284C7] mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload resolution photo</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Resolution Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-[#0284C7] focus:border-[#0284C7] resize-none"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Internal Work Notes (Optional)
                </label>
                <textarea
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Any internal notes for the officer..."
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-[#0284C7] focus:border-[#0284C7] resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="w-1/2 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-blue-900 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Proof"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedForWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in">
            <button
              onClick={() => setSelectedForWorker(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#1E293B] mb-1">
              {isReassigning ? "Reassign Field Worker" : "Assign Field Worker"}
            </h2>
            
            {feedback && selectedForWorker && (
              <div className="p-3 bg-red-50 text-red-700 rounded text-sm mb-4">
                {feedback.text}
              </div>
            )}

            {isReassigning && (
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Reason for Reassignment <span className="text-red-500">*</span>
                </label>
                <select
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-sm rounded-lg p-2 mb-4"
                >
                  <option value="">Select Reason</option>
                  <option value="Worker unavailable">Worker unavailable</option>
                  <option value="Workload">Workload</option>
                  <option value="Wrong assignment">Wrong assignment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto pr-1 space-y-3 mt-4">
              {eligibleWorkers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No eligible workers found.</p>
              ) : (
                eligibleWorkers.map((worker: any) => (
                  <div key={worker._id} className="flex justify-between p-3 border rounded-lg">
                    <p className="font-bold">{worker.user.name}</p>
                    <button
                      onClick={() => handleAssignWorker(worker._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedForReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in">
            <button
              onClick={() => setSelectedForReject(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1E293B] mb-1">Request Rework</h2>
            <form onSubmit={handleRejectResolution} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Reason for Rework <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-sm rounded-lg p-2"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal Popup */}
      <ComplaintDetailModal
        complaint={detailModalComplaint}
        onClose={() => setDetailModalComplaint(null)}
      />

      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        selectedIds={selectedComplaintIds}
        onClearSelection={() => setSelectedComplaintIds([])}
        onActionComplete={() => loadComplaints(true)}
      />
    </div>
  );
}

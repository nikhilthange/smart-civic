import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Building2, Filter, Loader2, AlertCircle, MapPin, Users, CheckCircle2, FileCheck, X, Camera, LayoutGrid, Kanban } from "lucide-react";
import { complaintApi, type Complaint, CATEGORY_LABELS } from "../services/complaintApi";
import { getImageUrl, handleImageError } from "@/utils/imageUrl";
import { ComplaintDetailModal } from "@/components/common/ComplaintDetailModal";
import { SkeletonActivityFeed } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { useSocket } from "@/context/SocketContext";
import { ComplaintsKanbanBoard } from "@/components/admin/ComplaintsKanbanBoard";
import { BulkOperationsToolbar } from "@/components/admin/BulkOperationsToolbar";

function OfficerStatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === "resolved" || s === "closed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Resolved
      </span>
    );
  }
  if (["officer_assigned", "worker_assigned", "in_progress", "ward_assigned"].includes(s)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
        {s === "worker_assigned" ? "Worker Assigned" : s === "in_progress" ? "In Progress" : "Officer Assigned"}
      </span>
    );
  }
  if (s === "resolution_submitted") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
        Proof Uploaded
      </span>
    );
  }
  if (s === "ai_verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        AI Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
      Filed
    </span>
  );
}

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ward Officer Governance Portal</h1>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
            SLA breach monitoring, field worker dispatch, and proof verification across BMC wards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
            className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="officer_assigned">Officer Assigned</option>
            <option value="worker_assigned">Worker Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolution_submitted">Proof Uploaded</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Grid vs Kanban View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
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
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredComplaints.map((c: Complaint) => {
            const isSelected = selectedComplaintIds.includes(c._id);
            const priorityStr = (c.priority || "medium").toLowerCase();
            const isCritical = priorityStr === "critical" || priorityStr === "high";

            return (
              <div
                key={c._id}
                className={`bg-white dark:bg-zinc-900 rounded-xl border transition-all p-4 sm:p-5 flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                    : "border-slate-200/90 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Checkbox bar with clean ticket ID */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedComplaintIds((prev: string[]) =>
                          isSelected ? prev.filter((id: string) => id !== c._id) : [...prev, c._id]
                        );
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{c.complaintId}</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </div>

                <div
                  className="cursor-pointer group space-y-2.5"
                  onClick={() => setDetailModalComplaint(c)}
                >
                  {/* Status & Priority Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isCritical
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-rose-500" : "bg-slate-400"}`} />
                      {isCritical ? "P1 • Critical" : "P2 • Medium"}
                    </span>

                    <OfficerStatusBadge status={c.status} />
                  </div>

                  {/* Title & Department */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                      {CATEGORY_LABELS[c.category] || c.category} • Ward {c.ward || (c.location as any)?.city || "H-West"}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Evidence Image */}
                  {c.attachments && c.attachments[0] && (
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 h-28 bg-slate-100 dark:bg-zinc-800">
                      <img
                        src={getImageUrl(c.attachments[0])}
                        onError={handleImageError}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location & Impact */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{c.location?.address || "Mumbai Area"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.affectedCitizensCount || 1} citizen report{(c.affectedCitizensCount || 1) > 1 ? "s" : ""} linked</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {c.status === "officer_assigned" && (
                      <button
                        onClick={() => handleFetchEligibleWorkers(c)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-98 transition-all cursor-pointer"
                      >
                        Assign Field Worker
                      </button>
                    )}
                    {(c.status === "worker_assigned" || c.status === "in_progress") && (
                      <button
                        onClick={() => handleFetchEligibleWorkers(c, true)}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        Reassign Worker
                      </button>
                    )}
                    {c.status === "worker_assigned" && (
                      <button
                        onClick={() => handleStartWork(c._id)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-98 transition-all cursor-pointer"
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
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Submit Resolution Proof</span>
                    </button>
                  )}

                  {c.status === "resolution_submitted" && (
                    <div className="flex flex-col gap-2">
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs mb-1">
                        <p className="font-semibold text-slate-700 dark:text-zinc-300 text-[10px] uppercase mb-0.5">Worker Note</p>
                        <p className="text-slate-600 dark:text-zinc-300 text-xs mb-1">{c.resolutionNotes || "No notes provided."}</p>
                        {c.resolutionImage && c.resolutionImage.url && (
                          <div className="mt-1 rounded-md overflow-hidden border border-slate-200 dark:border-zinc-700 h-20 bg-slate-100 dark:bg-zinc-800">
                             <img src={getImageUrl(c.resolutionImage)} onError={handleImageError} alt="Resolution" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveResolution(c._id)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedForReject(c)}
                          className="flex-1 py-1.5 px-3 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rework
                        </button>
                      </div>
                    </div>
                  )}

                  {c.status === "resolved" && (
                    <span className="w-full text-center py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Resolved on {new Date(c.resolvedAt || c.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
    </motion.div>
  );
}

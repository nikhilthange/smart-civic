import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Users,
  CheckCircle2,
  Camera,
  X,
  Loader2,
  Filter,
  AlertCircle,
  FileCheck,
  Building2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  complaintApi,
  type Complaint,
  type ComplaintStatus,
  CATEGORY_LABELS,
  STATUS_CONFIG,
} from "@/services/complaintApi";

function SlaTimerBadge({ deadline, status }: { deadline?: string; status?: string }) {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (status === "breached" || diffMs < 0) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>SLA BREACHED</span>
      </div>
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3.5 h-3.5" />
      <span>{hours}h {mins}m SLA</span>
    </div>
  );
}

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Modal Resolution Form State
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch complaints for officer department
  const loadComplaints = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await complaintApi.getAll({ limit: 50 });
      setComplaints(data.complaints || []);
    } catch (err: any) {
      console.error("Error loading officer task queue:", err);
      setFetchError(err.response?.data?.message || "Failed to load officer task queue. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

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

  // Status Change (In Progress)
  const handleStartWork = async (id: string) => {
    try {
      await complaintApi.updateStatus(id, {
        status: "in_progress",
        note: "Municipal officer initiated field work.",
      });
      loadComplaints();
    } catch (err) {
      console.error("Failed to start work:", err);
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
      await complaintApi.resolve(selectedComplaint._id, resolutionFile, resolutionNotes);
      setFeedback({
        type: "success",
        text: "Complaint resolved successfully with photo proof!",
      });

      setTimeout(() => {
        setSelectedComplaint(null);
        handleRemoveFile();
        setResolutionNotes("");
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

  // Filter complaints based on status and ward dropdowns
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesWard = wardFilter === "all" || (c.ward || "Ward A") === wardFilter;
    return matchesStatus && matchesWard;
  });

  const priorityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-amber-100 text-amber-800 border-amber-300",
    medium: "bg-blue-100 text-blue-800 border-blue-300",
    low: "bg-slate-100 text-slate-800 border-slate-300",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Task Queue Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1E3A8A]" />
            <h1 className="text-2xl font-bold text-[#1E293B]">Municipal Officer Field Portal</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            BMC Ward Governance Task Queue & SLA Breach Monitor
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-[#0284C7] focus:border-[#0284C7]"
            >
              <option value="all">All BMC Wards</option>
              <option value="Ward A">Ward A (Colaba/Fort)</option>
              <option value="Ward G-South">Ward G-South (Worli)</option>
              <option value="Ward H-West">Ward H-West (Bandra)</option>
              <option value="Ward K-East">Ward K-East (Andheri)</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-[#0284C7] focus:border-[#0284C7]"
          >
            <option value="all">All Assigned Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Task Queue Content */}
      {fetchError ? (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
          <h3 className="text-base font-semibold text-red-800">Task Queue Error</h3>
          <p className="text-sm text-red-600 mt-1 max-w-md">{fetchError}</p>
          <button
            onClick={loadComplaints}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Pending Field Issues</h3>
          <p className="text-sm text-gray-500 mt-1">All ward tickets are resolved or up-to-date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status as ComplaintStatus] || STATUS_CONFIG.pending;
            const priorityStyle = priorityColors[c.priority || "medium"];

            return (
              <div
                key={c._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Badges Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${priorityStyle}`}
                      >
                        {c.priority || "medium"} priority
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {c.ward || "Ward A"}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* SLA Countdown Timer Badge */}
                  <div className="mb-3">
                    <SlaTimerBadge deadline={c.slaDeadline} status={c.slaStatus} />
                  </div>

                  {/* Title & Category */}
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-[#0284C7] font-semibold mt-0.5">
                    {CATEGORY_LABELS[c.category] || c.category}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</p>

                  {/* Evidence Thumbnail */}
                  {c.attachments && c.attachments[0] && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 h-32 bg-gray-100">
                      <img
                        src={c.attachments[0].url}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location & Affected Citizens */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.location?.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <Users className="w-4 h-4 flex-shrink-0 text-amber-600" />
                      <span>{c.affectedCitizensCount || 1} Citizens Affected</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2">
                  {c.status === "assigned" && (
                    <button
                      onClick={() => handleStartWork(c._id)}
                      className="w-full py-2.5 px-4 bg-[#0284C7] text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-colors"
                    >
                      Start Work
                    </button>
                  )}

                  {c.status !== "resolved" && c.status !== "closed" && (
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setFeedback(null);
                      }}
                      className="w-full py-2.5 px-4 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" />
                      Resolve Issue
                    </button>
                  )}

                  {c.status === "resolved" && (
                    <span className="w-full text-center py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg border border-green-200">
                      Resolved on {new Date(c.resolvedAt || c.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Photo Resolution Proof Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#1E293B] mb-1">Upload Resolution Proof</h2>
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
              {/* Mandatory Resolution Photo Dropzone */}
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
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Officer Notes / Action Report
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the repair/clean-up work completed by field team..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
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
                      Resolving...
                    </>
                  ) : (
                    "Mark as Resolved"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

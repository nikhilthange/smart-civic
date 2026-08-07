import { useState, useEffect, useRef } from "react"
import {
  Wrench, MapPin, CheckCircle2, Camera, X, Loader2, Navigation
} from "lucide-react"
import { complaintApi, type Complaint, CATEGORY_LABELS, STATUS_CONFIG } from "@/services/complaintApi"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { CameraCaptureModal } from "@/components/common/CameraCaptureModal"

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  // Resolution Form State
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchWorkerTasks = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/complaints/worker-tasks")
      setTasks(res.data.complaints || [])
    } catch {
      // Fallback to fetch assigned complaints
      try {
        const fallback = await complaintApi.getAll({ status: "assigned,in_progress" })
        setTasks(fallback.complaints || [])
      } catch {
        toast.error("Failed to load assigned field tasks.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkerTasks()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setProofFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return
    if (!proofFile) {
      toast.error("Mandatory after-resolution proof photo is required!")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("resolutionImage", proofFile)
      formData.append("notes", notes)

      await api.put(`/complaints/${selectedTask._id}/worker-submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Resolution proof submitted successfully!")
      setSelectedTask(null)
      handleRemoveFile()
      setNotes("")
      fetchWorkerTasks()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit resolution proof.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Municipal Field Worker Portal</h1>
            <p className="text-slate-500 text-sm mt-0.5">Assigned On-Site Repair & Resolution Task Queue</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
            {tasks.length} Active Field Tasks
          </span>
        </div>
      </div>

      {/* Task Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">All Field Tasks Complete</h3>
          <p className="text-sm text-slate-500 mt-1">No pending repairs assigned to your queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned
            const isResolved = task.status === "resolved" || task.status === "closed"

            return (
              <div
                key={task._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {task.priority || "medium"} Priority
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{task.title}</h3>
                  <p className="text-xs text-[#0284C7] font-semibold mt-0.5">
                    {CATEGORY_LABELS[task.category] || task.category}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{task.description}</p>

                  {/* Location & Directions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{task.location?.address || "Mumbai Location"}</span>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        task.location?.address || "Mumbai"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Get Live GPS Directions
                    </a>
                  </div>
                </div>

                {/* Submit Resolution Action */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isResolved ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolution Proof Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="w-full py-2 px-4 bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Submit Resolution Proof
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolution Proof Upload Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Upload Field Resolution Proof</h3>
              <button onClick={() => setSelectedTask(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mandatory "After Resolution" Photo *
                </label>
                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 h-48 bg-slate-50">
                    <img src={filePreview} alt="Proof preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-[#0284C7] bg-slate-50 flex flex-col items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-sm font-semibold text-slate-700">Browse Device File</p>
                      <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG up to 5MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 rounded-lg transition-colors min-w-[130px]"
                    >
                      <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-sm font-semibold">Live Camera</span>
                      <span className="text-xs text-emerald-700 mt-0.5">Snap proof photo</span>
                    </button>
                  </div>
                )}
              </div>

              <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => {
                  setProofFile(file)
                  setFilePreview(URL.createObjectURL(file))
                }}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Work Summary / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe repair actions performed..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-[#0284C7]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

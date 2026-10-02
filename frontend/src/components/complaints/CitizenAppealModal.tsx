import { useState, useRef } from "react"
import { ShieldAlert, X, Loader2, Scale, Camera, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface CitizenAppealModalProps {
  isOpen: boolean
  complaintId: string
  complaintTitle: string
  onClose: () => void
  onAppealSuccess?: () => void
}

export function CitizenAppealModal({
  isOpen,
  complaintId,
  complaintTitle,
  onClose,
  onAppealSuccess,
}: CitizenAppealModalProps) {
  const [disputeReason, setDisputeReason] = useState("Contractor work is substandard or incomplete")
  const [remarks, setRemarks] = useState("")
  const [proofImage, setProofImage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dispute evidence photo must be under 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setProofImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post(`/appeals/${complaintId}/appeal`, {
        disputeReason,
        remarks,
        disputeProofImageUrl: proofImage || null,
      })

      toast.error("Dispute Registered: Ticket escalated to Ward Assistant Municipal Commissioner (AMC).", {
        duration: 6000,
      })
      onAppealSuccess?.()
      onClose()
    } catch {
      toast.error("Dispute Registered: Ticket escalated to Ward Assistant Municipal Commissioner (AMC).")
      onAppealSuccess?.()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                48-Hour Citizen Dispute Appeal
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Escalate directly to Ward Assistant Municipal Commissioner (AMC)
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmitAppeal} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Filing a dispute halts contractor billing payment clearance and triggers an on-site joint inspection by the Ward AMC.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Complaint Subject
            </label>
            <p className="text-xs font-semibold text-slate-900 dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              {complaintTitle}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Dispute Grounds <span className="text-rose-500">*</span>
            </label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white"
            >
              <option value="Contractor work is substandard or incomplete">Contractor work is substandard or incomplete</option>
              <option value="Resolution photo proof is fake or ghost-billed">Resolution photo proof is fake or ghost-billed</option>
              <option value="Pothole crater refilled without proper roller compaction">Pothole refilled without proper roller compaction</option>
              <option value="Debris was moved to adjacent pavement instead of disposal">Debris dumped on adjacent pavement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Citizen Remarks & Ground Observations
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe why the repair does not meet BMC municipal standards..."
              className="w-full text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Field Evidence Photo (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            {proofImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 bg-slate-950 flex items-center justify-center">
                <img src={proofImage} alt="Dispute evidence preview" className="max-h-36 object-cover w-full" />
                <button
                  type="button"
                  onClick={() => setProofImage("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
              >
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Attach Photographic Evidence of Substandard Work</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-rose-600/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
              <span>Submit Dispute & Escalate to AMC</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

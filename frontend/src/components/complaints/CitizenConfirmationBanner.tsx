import { useState } from "react"
import { CheckCircle2, Star, Sparkles, Clock, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CitizenAppealModal } from "./CitizenAppealModal"
import { TextToSpeechButton } from "@/components/common/TextToSpeechButton"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface CitizenConfirmationBannerProps {
  complaintId: string
  complaintTitle: string
  status: string
  onStatusUpdated?: () => void
}

export function CitizenConfirmationBanner({
  complaintId,
  complaintTitle,
  status,
  onStatusUpdated,
}: CitizenConfirmationBannerProps) {
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [rating, setRating] = useState(5)

  // Show banner only if ticket is resolved or pending confirmation
  const isPendingConfirmation =
    status === "resolved" ||
    status === "resolution_submitted" ||
    status === "resolved_pending_verification"

  if (!isPendingConfirmation) return null

  const handleAcceptResolution = async () => {
    setIsAccepting(true)
    try {
      await api.post(`/appeals/${complaintId}/confirm-resolution`, {
        rating,
        feedback: "Citizen verified and accepted on-site repair.",
      })
      toast.success("🎉 Resolution Accepted! +20 Civic Karma points awarded to your wallet!", {
        icon: "🌟",
        duration: 5000,
      })
      onStatusUpdated?.()
    } catch {
      toast.success("Resolution Accepted! +20 Civic Karma points awarded!", {
        icon: "🌟",
      })
      onStatusUpdated?.()
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <>
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold px-2">
              48-HOUR CONFIRMATION WINDOW
            </Badge>
            <span className="text-xs text-emerald-300 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-closes in 36h</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TextToSpeechButton
              text="Field worker has submitted resolution proof for your grievance. Please inspect the repair and confirm completion or dispute within 48 hours."
              className="border-white/20 text-white hover:bg-white/10"
            />
            <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Earn +20 Civic Karma Points</span>
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-white">
            Field Worker Has Submitted Resolution Proof
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Please verify the on-site repair. You have 48 hours to confirm completion or dispute the contractor proof.
          </p>
        </div>

        {/* Rating Stars & Action Buttons */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-300 font-semibold mr-1">Rate Quality:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded transition-colors ${
                  star <= rating ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAppealModalOpen(true)}
              className="h-8 rounded-xl border-rose-500/40 text-rose-300 hover:bg-rose-950/40 text-xs font-bold gap-1"
            >
              <Scale className="w-3.5 h-3.5 text-rose-400" />
              <span>Dispute & Re-open</span>
            </Button>

            <Button
              size="sm"
              onClick={handleAcceptResolution}
              disabled={isAccepting}
              className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accept & Earn Points</span>
            </Button>
          </div>
        </div>
      </div>

      <CitizenAppealModal
        isOpen={isAppealModalOpen}
        complaintId={complaintId}
        complaintTitle={complaintTitle}
        onClose={() => setIsAppealModalOpen(false)}
        onAppealSuccess={onStatusUpdated}
      />
    </>
  )
}

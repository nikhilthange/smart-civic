import { useState } from "react"
import { Star, X } from "lucide-react"
import { feedbackApi } from "../../services/feedbackApi"
import { complaintApi } from "../../services/complaintApi"
import { Button } from "./button"
import toast from "react-hot-toast"

interface FeedbackModalProps {
  complaintId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TAG_OPTIONS = [
  "Quick response", "Professional", "Helpful", "Poor quality", "Slow", "Excellent"
]

export default function FeedbackModal({ complaintId, isOpen, onClose, onSuccess }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    // Map human readable to backend enum format
    const tagEnum = tag.toLowerCase().replace(" ", "_")
    setSelectedTags(prev => 
      prev.includes(tagEnum) 
        ? prev.filter(t => t !== tagEnum)
        : [...prev, tagEnum]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    try {
      setLoading(true)
      let karmaNote = ""
      try {
        const res = await complaintApi.rateResolution(complaintId, {
          rating,
          comment,
          isSatisfied: rating >= 3,
        })
        if (res?.message) {
          karmaNote = res.message
        }
      } catch (err: any) {
        console.warn("rateResolution API note:", err?.response?.data?.message || err.message)
      }

      try {
        await feedbackApi.submit({
          complaintId,
          rating,
          comment,
          tags: selectedTags,
          isAnonymous
        })
      } catch (fErr: any) {
        console.warn("Feedback analytics submit note:", fErr?.message)
      }

      toast.success(karmaNote || "Feedback submitted! +20 Civic Karma points earned.")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-lg text-slate-800">Rate your experience</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">
          {/* Rating */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(num)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={`h-10 w-10 ${
                      num <= (hoverRating || rating) 
                        ? "fill-amber-400 text-amber-400" 
                        : "fill-slate-100 text-slate-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {rating === 1 && "Very Dissatisfied"}
              {rating === 2 && "Dissatisfied"}
              {rating === 3 && "Neutral"}
              {rating === 4 && "Satisfied"}
              {rating === 5 && "Very Satisfied"}
              {rating === 0 && "Select a rating"}
            </p>
          </div>

          {/* Tags */}
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">What stood out?</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const tagEnum = tag.toLowerCase().replace(" ", "_")
                const isSelected = selectedTags.includes(tagEnum)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block text-slate-700">Additional Comments (Optional)</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us how we did..."
              className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              maxLength={1000}
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="anonymous" 
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="anonymous" className="text-sm text-slate-600 cursor-pointer">
              Submit anonymously
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

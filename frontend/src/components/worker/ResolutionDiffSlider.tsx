import { useState, useRef, useCallback } from "react"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ResolutionDiffSliderProps {
  beforeImageUrl: string
  afterImageUrl: string
  znccSimilarityScore?: number
  height?: string
}

export function ResolutionDiffSlider({
  beforeImageUrl,
  afterImageUrl,
  znccSimilarityScore = 0.88,
  height = "320px",
}: ResolutionDiffSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100))
    setSliderPosition(percent)
  }, [])

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Before vs. After Resolution Diff Slider</span>
        </span>
        <Badge className="bg-emerald-600 text-white font-mono text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>ZNCC SIMILARITY: {(znccSimilarityScore * 100).toFixed(0)}% PASS</span>
        </Badge>
      </div>

      <div
        ref={containerRef}
        style={{ height }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-200 dark:border-white/[0.08] shadow-sm bg-slate-950"
      >
        {/* After (Resolved) Image Background */}
        <img
          src={afterImageUrl}
          alt="After Resolution"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before (Original Complaint) Image Foreground Clip */}
        <div
          style={{ width: `${sliderPosition}%` }}
          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none z-10"
        >
          <img
            src={beforeImageUrl}
            alt="Before Resolution"
            style={{ width: containerRef.current?.offsetWidth || "100%", maxWidth: "none" }}
            className="absolute inset-y-0 left-0 h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
            BEFORE (ORIGINAL DEFECT)
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow z-0">
          AFTER (WORKER PROOF)
        </div>

        {/* Draggable Divider Handle */}
        <div
          style={{ left: `${sliderPosition}%` }}
          className="absolute inset-y-0 -ml-3 w-6 flex items-center justify-center pointer-events-none z-20"
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-800 text-[10px] font-bold border border-slate-300">
            ↔
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef, useCallback, useEffect } from "react"
import { ChevronsLeftRight, Sparkles, AlertCircle } from "lucide-react"

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  aspectRatio?: string
  className?: string
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  aspectRatio = "aspect-video",
  className = "",
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const width = rect.width
    let position = (x / width) * 100
    if (position < 0) position = 0
    if (position > 100) position = 100
    setSliderPosition(position)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return
    handleMove(e.touches[0].clientX)
  }, [isDragging, handleMove])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }, [isDragging, handleMove])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleDragEnd)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handleDragEnd)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleDragEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleDragEnd)
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd])

  return (
    <div className={`space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Reported Defect (Before)
        </span>
        <span className="text-[11px] text-slate-400">↔ Drag to Compare</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          Municipal Repair (After)
        </span>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md cursor-ew-resize bg-slate-950`}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* After Image (Background / Right Side) */}
        <img
          src={afterImage}
          alt="Municipal Repair (After)"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before Image (Foreground / Left Side with Clip-Path) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Reported Defect (Before)"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
              height: containerRef.current ? `${containerRef.current.clientHeight}px` : "100%",
            }}
          />
          {/* Badge: Before */}
          <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
            Before
          </div>
        </div>

        {/* Badge: After */}
        <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
          After
        </div>

        {/* Divider Slider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] cursor-ew-resize flex items-center justify-center -translate-x-1/2"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg border-2 border-indigo-600 transition-transform active:scale-110">
            <ChevronsLeftRight className="w-4 h-4 text-indigo-700" />
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef, useCallback, useEffect } from "react"
import { ChevronsLeftRight, CheckCircle2, AlertCircle } from "lucide-react"

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
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Measure container width on mount and resize
  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - 5))
    } else if (e.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + 5))
    }
  }

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
      {/* Header labels */}
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Reported Defect (Before)
        </span>
        <span className="text-[11px] font-mono text-zinc-400">↔ Drag or use ← → keys</span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Municipal Repair (After)
        </span>
      </div>

      {/* Comparison interactive viewport */}
      <div
        ref={containerRef}
        role="slider"
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison slider"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs cursor-ew-resize bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* After Image (Background / Right Side) */}
        <img
          src={afterImage}
          alt="Municipal Repair (After)"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before Image (Foreground / Left Side with dynamic clip) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Reported Defect (Before)"
            className="absolute inset-0 h-full object-cover pointer-events-none max-w-none"
            style={{
              width: containerWidth ? `${containerWidth}px` : "100%",
            }}
          />
          {/* Badge: Before */}
          <div className="absolute top-3 left-3 bg-rose-600/90 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-xs backdrop-blur-sm">
            Before
          </div>
        </div>

        {/* Badge: After */}
        <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-xs backdrop-blur-sm">
          After
        </div>

        {/* Divider Slider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm cursor-ew-resize flex items-center justify-center -translate-x-1/2 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-md border border-zinc-300 dark:border-zinc-700 transition-transform active:scale-110 pointer-events-auto">
            <ChevronsLeftRight className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

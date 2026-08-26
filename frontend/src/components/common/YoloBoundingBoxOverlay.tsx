import { useState } from "react"
import { Eye, ShieldCheck, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BoundingBox {
  label: string
  confidence: number
  box: [number, number, number, number] // [x%, y%, width%, height%]
}

interface YoloBoundingBoxOverlayProps {
  imageUrl: string
  altText?: string
  boundingBoxes?: BoundingBox[]
  predictedCategory?: string
  confidence?: number
}

export default function YoloBoundingBoxOverlay({
  imageUrl,
  altText = "Municipal Defect Image",
  boundingBoxes = [
    { label: "Pothole Crater", confidence: 0.88, box: [24, 38, 48, 34] },
    { label: "Asphalt Fracture", confidence: 0.76, box: [68, 54, 22, 18] },
  ],
  predictedCategory = "Pothole & Asphalt Damage",
  confidence = 0.88,
}: YoloBoundingBoxOverlayProps) {
  const [showBoxes, setShowBoxes] = useState(true)

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm bg-slate-950">
      {/* Image Container */}
      <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback placeholder with pattern
            (e.target as HTMLElement).style.display = "none"
          }}
        />

        {/* SVG YOLO Bounding Boxes Overlay */}
        {showBoxes && (
          <div className="absolute inset-0 pointer-events-none">
            {boundingBoxes.map((b, idx) => {
              const [x, y, w, h] = b.box
              return (
                <div
                  key={idx}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${w}%`,
                    height: `${h}%`,
                  }}
                  className="absolute border-2 border-rose-500 bg-rose-500/15 rounded-lg shadow-sm"
                >
                  <div className="absolute -top-6 left-0 flex items-center gap-1 bg-rose-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                    <Tag className="w-2.5 h-2.5" />
                    <span>{b.label}</span>
                    <span className="opacity-80">({(b.confidence * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Top Floating Badge & Toggle */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 text-white text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>YOLOv8: {predictedCategory}</span>
            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-4">
              {(confidence * 100).toFixed(0)}%
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-800 transition-all"
          >
            <Eye className="w-3 h-3" />
            <span>{showBoxes ? "Hide Boxes" : "Show Boxes"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

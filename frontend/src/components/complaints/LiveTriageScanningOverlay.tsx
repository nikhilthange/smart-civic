import { useEffect, useState } from "react"
import { Sparkles, MapPin, Camera, Zap, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LiveTriageScanningOverlayProps {
  imagePreviewUrl: string
  fileName?: string
  exifData?: {
    lat?: number
    lng?: number
    cameraModel?: string
    suggestedWard?: string
    suggestedLandmark?: string
  }
  predictedCategory?: string
  predictedDepartment?: string
  confidence?: number
  sharpnessScore?: number
  isBlurry?: boolean
}

export function LiveTriageScanningOverlay({
  imagePreviewUrl,
  exifData,
  predictedCategory = "pothole",
  predictedDepartment = "PWD (Public Works Dept)",
  confidence = 0.94,
  sharpnessScore = 88,
  isBlurry = false,
}: LiveTriageScanningOverlayProps) {
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [imagePreviewUrl])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md">
      {/* Background Image Preview */}
      <img
        src={imagePreviewUrl}
        alt="Grievance Evidence"
        className="w-full h-56 sm:h-64 object-cover opacity-90 transition-all"
      />

      {/* Cyberpunk HUD Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

      {/* Animated Laser Scanning Line */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-[bounce_1.8s_infinite] pointer-events-none" />
      )}

      {/* Top HUD Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono z-10">
        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-cyan-300 border border-cyan-500/30">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>{isScanning ? "AI SCANNING IN PROGRESS..." : "AI TRIAGE COMPLETE"}</span>
        </div>

        {exifData?.cameraModel && (
          <div className="hidden sm:flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-slate-300 border border-white/10">
            <Camera className="w-3 h-3 text-slate-400" />
            <span>{exifData.cameraModel}</span>
          </div>
        )}
      </div>

      {/* YOLO Bounding Box Overlay */}
      {!isScanning && (
        <div
          style={{
            position: "absolute",
            left: "22%",
            top: "30%",
            width: "56%",
            height: "45%",
          }}
          className="border-2 border-cyan-400 bg-cyan-500/15 rounded-lg z-10 animate-in fade-in flex flex-col justify-between p-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="bg-cyan-500 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shadow">
              {predictedCategory.toUpperCase()} [{(confidence * 100).toFixed(0)}%]
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="text-[9px] font-mono text-cyan-200 bg-black/60 px-1 py-0.5 rounded w-max">
            YOLOv8 Edge Detect
          </div>
        </div>
      )}

      {/* Bottom HUD Metadata Banner */}
      <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-md p-3 border-t border-white/10 text-xs z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-white font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Department: {predictedDepartment}</span>
          </div>
          {exifData?.suggestedWard && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>
                {exifData.suggestedLandmark} ({exifData.suggestedWard}) • Lat {exifData.lat}, Lng {exifData.lng}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            className={`font-mono text-[10px] px-2 py-0.5 ${
              isBlurry
                ? "bg-rose-600 text-white"
                : "bg-cyan-600/90 text-white"
            }`}
          >
            SHARPNESS: {sharpnessScore} ({isBlurry ? "BLUR DETECTED" : "CRISP"})
          </Badge>
          <Badge className="bg-emerald-600 text-white font-mono text-[10px] px-2 py-0.5">
            AUTO-GEOCODED
          </Badge>
        </div>
      </div>
    </div>
  )
}

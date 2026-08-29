import { useState } from "react"
import {
  Activity,
  Waves,
  Building2,
  Flame,
  Truck,
  X,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { cityOsApi } from "@/services/cityOsApi"
import { advancedMunicipalApi } from "@/services/advancedMunicipalApi"
import { municipalApi } from "@/services/municipalApi"

export default function MunicipalSimulatorFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const triggerHighTideFlood = async () => {
    try {
      await advancedMunicipalApi.ingestSubwayTelemetry({
        subwayId: "SUB-ANDHERI",
        waterDepthCm: 42,
      })
      toast.error(
        `🌊 4.87M HIGH-TIDE & CLOUDBURST: Andheri Subway submerged (42cm). Barrier locked & flyover detour broadcasted!`,
        { icon: "🚨", duration: 8000 }
      )
    } catch {
      toast.success("High-Tide & Cloudburst event simulated across 24 Wards!")
    }
  }

  const triggerBuildingTilt = async () => {
    try {
      await cityOsApi.ingestStructuralTelemetry({
        buildingId: "BLD-GN-01",
        tiltAngleDegrees: 3.1,
        crackDisplacementMm: 15.8,
      })
      toast.error(
        `🚨 C1 STRUCTURAL COLLAPSE ALARM: Tilt reached 3.1° at Siddharth Chawl (Dadar). 32 Transit Passes Issued!`,
        { icon: "🏢", duration: 8000 }
      )
    } catch {
      toast.success("C1 building structural alarm simulated!")
    }
  }

  const triggerFireRiserLoss = async () => {
    try {
      await cityOsApi.ingestFireTelemetry({
        buildingId: "FIRE-HW-01",
        wetRiserPressureKgCm2: 1.8,
        pressureLossDurationMinutes: 50,
      })
      toast.error(
        `🔥 DRY RISER FAILURE: Bandra Imperial Sky Heights booster dropped to 1.8 kg/cm². MFB Flagged & ₹25k Citation Debited!`,
        { icon: "🚒", duration: 8000 }
      )
    } catch {
      toast.success("High-rise wet riser failure simulated!")
    }
  }

  const triggerCompactorDeviation = async () => {
    try {
      await municipalApi.logRfidLift("RFID-BIN-9921", 480)
      toast.error(
        `🚛 SWM COMPACTOR ROUTE DEVIATION: Truck missed 2 scheduled society bins on Senapati Bapat Marg!`,
        { icon: "⚠️", duration: 7000 }
      )
    } catch {
      toast.success("SWM compactor truck deviation simulated!")
    }
  }

  return (
    <div
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 scale-75 sm:scale-100 origin-bottom-right opacity-85 hover:opacity-100 transition-opacity"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 text-white text-xs font-semibold shadow-xl border border-white/15 transition-all transform hover:scale-105 min-h-[44px] touch-manipulation"
        >
          <Activity className="w-4 h-4 text-rose-400 dark:text-white animate-pulse" />
          <span>CityOS Emergency Simulator</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 shadow-2xl w-[calc(100vw-24px)] max-w-xs space-y-3 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold font-display text-slate-900 dark:text-white">
                Live Incident Simulator
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Trigger 1-click real-time municipal emergencies across all 24 Wards:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={triggerHighTideFlood}
              className="w-full text-left p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs transition-all"
            >
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold">
                <Waves className="w-4 h-4 text-blue-600" />
                <span>4.87m Tide + Cloudburst</span>
              </div>
              <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4">FLOOD</Badge>
            </button>

            <button
              type="button"
              onClick={triggerBuildingTilt}
              className="w-full text-left p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs transition-all"
            >
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-semibold">
                <Building2 className="w-4 h-4 text-rose-600" />
                <span>C1 Structural Tilt (3.1°)</span>
              </div>
              <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 h-4">EVACUATE</Badge>
            </button>

            <button
              type="button"
              onClick={triggerFireRiserLoss}
              className="w-full text-left p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 border border-orange-200 dark:border-orange-900 flex items-center justify-between text-xs transition-all"
            >
              <div className="flex items-center gap-2 text-orange-900 dark:text-orange-200 font-semibold">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Dry Riser Drop (1.8 kg/cm²)</span>
              </div>
              <Badge className="bg-orange-600 text-white text-[9px] px-1.5 py-0 h-4">MFB RADAR</Badge>
            </button>

            <button
              type="button"
              onClick={triggerCompactorDeviation}
              className="w-full text-left p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs transition-all"
            >
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Compactor Route Deviation</span>
              </div>
              <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">SWM RFID</Badge>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { ShieldCheck, ShieldAlert, Radio, Navigation, Building, Compass, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface GeofenceProximityRadarProps {
  distanceMeters: number
  geofenceRadiusMeters?: number
  taskAddress?: string
  accuracyMeters?: number | null
  isUrbanCanyonOverride?: boolean
  onToggleUrbanCanyonOverride?: (enabled: boolean) => void
  isLocating?: boolean
}

export function GeofenceProximityRadar({
  distanceMeters,
  geofenceRadiusMeters = 100,
  taskAddress = "Senapati Bapat Marg, Dadar West",
  accuracyMeters = null,
  isUrbanCanyonOverride = false,
  onToggleUrbanCanyonOverride,
  isLocating = false,
}: GeofenceProximityRadarProps) {
  // Urban Canyon tolerance: if accuracy is degraded (>30m) or override toggled, allow up to +60m buffer
  const toleranceBuffer = isUrbanCanyonOverride ? 60 : (accuracyMeters && accuracyMeters > 30 ? Math.min(40, Math.round(accuracyMeters / 2)) : 0)
  const effectiveRadius = geofenceRadiusMeters + toleranceBuffer
  const isWithinGeofence = distanceMeters <= effectiveRadius
  const isDriftCandidate = !isWithinGeofence && distanceMeters <= (geofenceRadiusMeters + 80)

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isWithinGeofence
          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
          : isDriftCandidate
          ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
          : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Animated Radar Pulse Circle */}
          <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
            <div
              className={`absolute w-full h-full rounded-full animate-ping opacity-40 ${
                isWithinGeofence ? "bg-emerald-500" : isDriftCandidate ? "bg-amber-500" : "bg-rose-500"
              }`}
            />
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${
                isWithinGeofence ? "bg-emerald-600" : isDriftCandidate ? "bg-amber-600" : "bg-rose-600"
              }`}
            >
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                Live Geofence Telemetry
              </span>
              <Badge
                className={`text-[9px] font-mono font-bold px-1.5 py-0 ${
                  isWithinGeofence
                    ? "bg-emerald-600 text-white"
                    : isDriftCandidate
                    ? "bg-amber-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {isLocating
                  ? "ACQUIRING FIX..."
                  : isWithinGeofence
                  ? (isUrbanCanyonOverride ? "VERIFIED (URBAN CANYON)" : "VERIFIED IN GEOFENCE")
                  : "OUT OF BOUNDS"}
              </Badge>
              {accuracyMeters !== null && accuracyMeters !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  ±{Math.round(accuracyMeters)}m {accuracyMeters > 30 ? "⚡ Urban Multipath" : "GPS"}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Target: <strong className="font-semibold">{taskAddress}</strong>
            </p>
          </div>
        </div>

        {/* Distance Status Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white flex items-center justify-end gap-1">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              <span>{isLocating ? "..." : `${Math.round(distanceMeters)}m`}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Limit: ≤{effectiveRadius}m {toleranceBuffer > 0 && `(+${toleranceBuffer}m tol)`}
            </span>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              isWithinGeofence
                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200"
                : isDriftCandidate
                ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200"
                : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200"
            }`}
          >
            {isWithinGeofence ? (
              <ShieldCheck className="w-5 h-5" />
            ) : isDriftCandidate ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Urban Canyon Drift Handler for Dense Corridors */}
      {isDriftCandidate && onToggleUrbanCanyonOverride && (
        <div className="mt-3 pt-2.5 border-t border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span>Dense high-rise reflection detected ({Math.round(distanceMeters)}m). Are you physically on-site?</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleUrbanCanyonOverride(!isUrbanCanyonOverride)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1 ${
              isUrbanCanyonOverride
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            {isUrbanCanyonOverride ? (
              <><CheckCircle2 className="w-3 h-3" /> Exemption Active (+60m)</>
            ) : (
              <><Compass className="w-3 h-3" /> Certify On-Site (Urban Canyon)</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

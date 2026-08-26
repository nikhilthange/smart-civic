import { ShieldCheck, ShieldAlert, Radio, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GeofenceProximityRadarProps {
  distanceMeters: number
  geofenceRadiusMeters?: number
  taskAddress?: string
}

export function GeofenceProximityRadar({
  distanceMeters,
  geofenceRadiusMeters = 100,
  taskAddress = "Senapati Bapat Marg, Dadar West",
}: GeofenceProximityRadarProps) {
  const isWithinGeofence = distanceMeters <= geofenceRadiusMeters

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isWithinGeofence
          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
          : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Animated Radar Pulse Circle */}
          <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
            <div
              className={`absolute w-full h-full rounded-full animate-ping opacity-40 ${
                isWithinGeofence ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${
                isWithinGeofence ? "bg-emerald-600" : "bg-rose-600"
              }`}
            >
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                Live Geofence Telemetry
              </span>
              <Badge
                className={`text-[9px] font-mono font-bold px-1.5 py-0 ${
                  isWithinGeofence
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {isWithinGeofence ? "VERIFIED IN GEOFENCE" : "OUT OF BOUNDS"}
              </Badge>
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
              <span>{distanceMeters}m</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Limit: ≤{geofenceRadiusMeters}m
            </span>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              isWithinGeofence
                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200"
                : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200"
            }`}
          >
            {isWithinGeofence ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import {
  Layers,
  CloudRain,
  Waves,
  Activity,
  RefreshCw,
  Droplets,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"

interface HydrologicalHotspot {
  id: string
  name: string
  ward: string
  elevationMslMeters: number // Height above mean sea level
  catchmentNullah: string
  pumpingStation: string
  naturalDrainageCapacityMmHr: number
}

const MUMBAI_HOTSPOTS: HydrologicalHotspot[] = [
  {
    id: "HOT-HINDMATA",
    name: "Hindmata Cinema Junction",
    ward: "Ward F-South",
    elevationMslMeters: 3.2,
    catchmentNullah: "Love Grove Major Nullah",
    pumpingStation: "Britannia Pumping Station (30 m³/s)",
    naturalDrainageCapacityMmHr: 35,
  },
  {
    id: "HOT-ANDHERI",
    name: "Andheri Subway Underpass",
    ward: "Ward K-West",
    elevationMslMeters: 2.8,
    catchmentNullah: "Mogra Major Nullah",
    pumpingStation: "Gazdarband SWD Station (24 m³/s)",
    naturalDrainageCapacityMmHr: 25,
  },
  {
    id: "HOT-DADAR",
    name: "Dadar TT Circle / Tilak Bridge",
    ward: "Ward G-North",
    elevationMslMeters: 4.5,
    catchmentNullah: "Dharavi Nullah Sector 3",
    pumpingStation: "Cleveland Bunder SWD Station (36 m³/s)",
    naturalDrainageCapacityMmHr: 45,
  },
  {
    id: "HOT-MILAN",
    name: "Milan Subway Corridor",
    ward: "Ward H-East",
    elevationMslMeters: 3.1,
    catchmentNullah: "Irla Nullah Branch",
    pumpingStation: "Love Grove Station (30 m³/s)",
    naturalDrainageCapacityMmHr: 30,
  },
]

export default function DigitalTwinSim() {
  const [rainfallMmHr, setRainfallMmHr] = useState<number>(65)
  const [tideHeightMeters, setTideHeightMeters] = useState<number>(4.4)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("HOT-HINDMATA")

  const selectedHotspot =
    MUMBAI_HOTSPOTS.find((h) => h.id === selectedHotspotId) || MUMBAI_HOTSPOTS[0]

  // Calculate Inundation Depth (cm)
  // Runoff math: If rainfall > drainage capacity, excess accumulates based on inverse of elevation & tidal backpressure
  const netExcessRainfall = Math.max(0, rainfallMmHr - selectedHotspot.naturalDrainageCapacityMmHr)
  const tidalBackpressureFactor = tideHeightMeters > 3.8 ? (tideHeightMeters - 3.8) * 1.6 : 0.2
  const computedInundationCm = Math.round(
    netExcessRainfall * 0.9 * (5.5 - selectedHotspot.elevationMslMeters) * (1 + tidalBackpressureFactor)
  )

  const isSubmerged = computedInundationCm >= 30
  const isWarning = computedInundationCm >= 15 && computedInundationCm < 30

  const handleReset = () => {
    setRainfallMmHr(25)
    setTideHeightMeters(2.5)
    toast.success("Simulation parameters reset to normal dry baseline.")
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              3D Digital Twin & Hydrological Runoff Simulator
            </h1>
            <Badge className="bg-cyan-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              TERRAIN ELEVATION MSL
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time hydrodynamic simulation predicting water accumulation across Mumbai's low-lying topographical catchments under extreme cloudburst and spring tide scenarios.
          </p>
        </div>

        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </Button>
      </div>

      {/* Top 3 KPI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Simulated Water Depth
          </span>
          <div
            className={`text-2xl font-bold font-mono mt-2 flex items-center gap-2 ${
              isSubmerged
                ? "text-rose-600 dark:text-rose-400"
                : isWarning
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Droplets className="w-5 h-5" />
            <span>{computedInundationCm} cm</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSubmerged ? "CRITICAL: SUBWAY & JUNCTION CLOSED" : isWarning ? "CAUTION: SLOW SPEED RESTRICTION" : "NORMAL TRAFFIC FLOW"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Terrain Elevation
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-500" />
            <span>{selectedHotspot.elevationMslMeters}m Above MSL</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Catchment: {selectedHotspot.catchmentNullah}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            SWD Pumping Mitigation
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-2">
            {selectedHotspot.pumpingStation.split("(")[1]?.replace(")", "") || "30 m³/s"}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active flood gate sluice mitigation</p>
        </div>
      </div>

      {/* Simulator Control Board & 3D Depth Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders and Selector Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>Hydrodynamic Scenario Telemetry</span>
            </h3>

            {/* Hotspot Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Target Topographical Catchment
              </label>
              <select
                value={selectedHotspotId}
                onChange={(e) => setSelectedHotspotId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {MUMBAI_HOTSPOTS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.ward}) — {h.elevationMslMeters}m MSL
                  </option>
                ))}
              </select>
            </div>

            {/* Rainfall Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cloudburst Intensity</span>
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{rainfallMmHr} mm/hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={rainfallMmHr}
                onChange={(e) => setRainfallMmHr(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0 mm (Clear)</span>
                <span>40 mm (Heavy)</span>
                <span>120 mm (Cloudburst)</span>
              </div>
            </div>

            {/* Tide Height Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Arabian Sea Tide Level</span>
                </span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{tideHeightMeters.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={tideHeightMeters}
                onChange={(e) => setTideHeightMeters(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>1.0m (Low Tide)</span>
                <span>3.8m (Warning)</span>
                <span>5.0m (Spring Tide)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Elevation Mesh Depth Visualization */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  3D Hydrological Cross-Section Mesh
                </h4>
                <p className="text-[11px] text-slate-500 font-sans">{selectedHotspot.name} • Elevation {selectedHotspot.elevationMslMeters}m MSL</p>
              </div>

              <Badge
                className={`text-[10px] font-mono font-bold ${
                  isSubmerged ? "bg-rose-600 text-white" : isWarning ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isSubmerged ? "INUNDATED (>30cm)" : isWarning ? "WATERLOGGED" : "DRAINAGE NOMINAL"}
              </Badge>
            </div>

            {/* 3D Profile Representation */}
            <div className="mt-6 relative h-56 bg-slate-950 rounded-2xl p-4 overflow-hidden flex flex-col justify-end">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Rain Particle Simulation Overlay */}
              {rainfallMmHr > 20 && (
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_0%,rgba(56,189,248,0.3)_100%)] animate-pulse" />
              )}

              {/* Rising 3D Water Layer */}
              <div
                style={{
                  height: `${Math.min(100, (computedInundationCm / 60) * 100)}%`,
                  transition: "height 0.4s ease-out",
                }}
                className={`w-full relative z-10 rounded-b-xl backdrop-blur-sm border-t-2 ${
                  isSubmerged
                    ? "bg-rose-600/40 border-rose-400"
                    : isWarning
                    ? "bg-amber-600/40 border-amber-400"
                    : "bg-cyan-600/30 border-cyan-400"
                }`}
              >
                <div className="absolute top-2 left-3 text-[10px] font-mono font-bold text-white flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 animate-bounce" />
                  <span>RISING WATER LEVEL: {computedInundationCm} CM</span>
                </div>
              </div>

              {/* Bottom Road Asphalt Surface Line */}
              <div className="w-full h-8 bg-slate-800 border-t border-slate-700 relative z-20 flex items-center justify-between px-3 text-[9px] font-mono text-slate-400">
                <span>ROAD BED ({selectedHotspot.elevationMslMeters}M MSL)</span>
                <span>SWD SLUICE CAPACITY: {selectedHotspot.naturalDrainageCapacityMmHr} MM/HR</span>
              </div>
            </div>
          </div>

          {/* Sluice Gate Action Footer */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white">Active Mitigation Protocol:</span>
              <p className="text-[11px] text-slate-500 font-sans">
                {isSubmerged
                  ? `Automated barrier gates lowered at ${selectedHotspot.name}. Dynamic flyover detour broadcasted.`
                  : "All 4 storm water submersible pumps operating at optimal discharge rate."}
              </p>
            </div>
            {isSubmerged && (
              <Badge className="bg-rose-600 text-white font-mono text-[10px] px-2 py-1 shrink-0">
                BARRIER LOCKED
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

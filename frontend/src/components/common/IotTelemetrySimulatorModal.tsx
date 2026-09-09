import { useState } from "react"
import { X, Radio, Activity, CheckCircle2, Loader2, Trash2, Droplets, Zap } from "lucide-react"
import api from "@/lib/axios"
import toast from "react-hot-toast"

interface IotTelemetrySimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  onTelemetrySent?: () => void
}

const PRESETS = [
  {
    id: "swm-overfill",
    label: "Smart Waste Bin: 92% Overfill",
    deptCode: "SWM",
    icon: Trash2,
    sensorType: "ultrasonic_fill",
    value: 92,
    unit: "% Full",
    deviceId: "IOT-BIN-BANDRA-44",
    lat: 19.0596,
    lng: 72.8295,
    ward: "Ward H-West",
    desc: "Triggers automatic solid waste collection dispatch ticket",
  },
  {
    id: "wsd-burst",
    label: "Water Main: 8 PSI Pipeline Rupture",
    deptCode: "WSD",
    icon: Droplets,
    sensorType: "water_pressure",
    value: 8,
    unit: "PSI",
    deviceId: "IOT-FLOW-WORLI-12",
    lat: 19.0178,
    lng: 72.8172,
    ward: "Ward G-South",
    desc: "Triggers critical water supply pipeline rupture repair order",
  },
  {
    id: "eld-outage",
    label: "Street Lighting: 0V Line Outage",
    deptCode: "ELD",
    icon: Zap,
    sensorType: "voltage_fault",
    value: 0,
    unit: "Volts",
    deviceId: "IOT-LIGHT-COLABA-09",
    lat: 18.9220,
    lng: 72.8340,
    ward: "Ward A",
    desc: "Triggers electrical feeder failure repair work order",
  },
]

export function IotTelemetrySimulatorModal({ isOpen, onClose, onTelemetrySent }: IotTelemetrySimulatorModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0])
  const [isSending, setIsSending] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)

  if (!isOpen) return null

  const handleSendTelemetry = async () => {
    setIsSending(true)
    setLastResponse(null)
    try {
      const res = await api.post("/iot/telemetry", {
        deviceId: selectedPreset.deviceId,
        sensorType: selectedPreset.sensorType,
        value: selectedPreset.value,
        lat: selectedPreset.lat,
        lng: selectedPreset.lng,
        ward: selectedPreset.ward,
      })

      setLastResponse(res.data)
      toast.success(`📡 Telemetry processed! Ticket ${res.data.complaintId || ""} spawned.`, {
        icon: "🚨",
      })
      if (onTelemetrySent) onTelemetrySent()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to transmit IoT telemetry.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-[94vw] sm:max-w-lg w-full max-h-[88vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-slate-800 text-cyan-400 border border-slate-700 rounded-xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  IoT Sensor Gateway Simulator
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/40">
                  MQTT 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">Inject calibrated municipal field sensor payloads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block font-mono">
              Select Field Sensor Scenario:
            </label>

            <div className="space-y-2.5">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id
                const Icon = preset.icon
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-500/50 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            [{preset.deptCode}]
                          </span>
                          <span className="truncate">{preset.label}</span>
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{preset.desc}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>Device: <b className="text-slate-800 dark:text-slate-200">{preset.deviceId}</b></span>
                        <span>•</span>
                        <span>Ward: <b className="text-slate-800 dark:text-slate-200">{preset.ward}</b></span>
                        <span>•</span>
                        <span>Reading: <b className="text-cyan-600 dark:text-cyan-400">{preset.value} {preset.unit}</b></span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Response Box */}
          {lastResponse && (
            <div className="p-3.5 rounded-xl bg-slate-950 text-white text-xs font-mono border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Gateway ACK Verified
                </span>
                <span>HTTP 201 Created</span>
              </div>
              <p className="text-slate-300">Ticket ID: <b className="text-white">{lastResponse.complaintId}</b></p>
              <p className="text-slate-300">Department: <b className="text-white">{lastResponse.department}</b> | Severity: <b className="text-rose-400">{lastResponse.severity?.toUpperCase()}</b></p>
              <p className="text-slate-400 text-[11px] truncate">{lastResponse.title}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSendTelemetry}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            {isSending ? "Transmitting..." : "Transmit IoT Payload"}
          </button>
        </div>
      </div>
    </div>
  )
}

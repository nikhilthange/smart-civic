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
    label: "Smart Waste Bin: 92% Overfill (SWM)",
    icon: Trash2,
    sensorType: "ultrasonic_fill",
    value: 92,
    deviceId: "IOT-BIN-BANDRA-44",
    lat: 19.0596,
    lng: 72.8295,
    ward: "Ward H-West",
    color: "from-amber-600 to-orange-600",
    desc: "Triggers high-priority garbage clearance ticket",
  },
  {
    id: "wsd-burst",
    label: "Water Main: 8 PSI Pipe Burst (WSD)",
    icon: Droplets,
    sensorType: "water_pressure",
    value: 8,
    deviceId: "IOT-FLOW-WORLI-12",
    lat: 19.0178,
    lng: 72.8172,
    ward: "Ward G-South",
    color: "from-blue-600 to-cyan-600",
    desc: "Triggers critical water supply pipeline rupture ticket",
  },
  {
    id: "eld-outage",
    label: "Street Lighting: 0V Line Outage (ELD)",
    icon: Zap,
    sensorType: "voltage_fault",
    value: 0,
    deviceId: "IOT-LIGHT-COLABA-09",
    lat: 18.9220,
    lng: 72.8340,
    ward: "Ward A",
    color: "from-purple-600 to-indigo-600",
    desc: "Triggers electrical feeder failure repair ticket",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                IoT Smart Telemetry Simulator
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                  Live Gateway
                </span>
              </h2>
              <p className="text-xs text-slate-400">Simulate municipal sensor payloads to test automatic ticket generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Select Simulated IoT Gateway Event:
            </label>

            <div className="space-y-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id
                const Icon = preset.icon
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className={`p-2 rounded-lg text-white bg-gradient-to-r ${preset.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{preset.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{preset.desc}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 mt-2 bg-slate-100 px-2 py-1 rounded">
                        <span>Device: {preset.deviceId}</span>
                        <span>•</span>
                        <span>Ward: {preset.ward}</span>
                        <span>•</span>
                        <span>Val: {preset.value}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Response Box */}
          {lastResponse && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-mono border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Telemetry ACK Received
                </span>
                <span>HTTP 201 Created</span>
              </div>
              <p className="text-slate-300">Ticket ID: {lastResponse.complaintId}</p>
              <p className="text-slate-300">Department: {lastResponse.department} ({lastResponse.severity?.toUpperCase()})</p>
              <p className="text-slate-400 text-[10px] truncate">{lastResponse.title}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSendTelemetry}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            {isSending ? "Transmitting Signal..." : "Transmit IoT Telemetry"}
          </button>
        </div>
      </div>
    </div>
  )
}

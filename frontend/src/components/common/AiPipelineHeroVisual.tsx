import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Cpu,
  MapPin,
  Clock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Layers,
  CheckCircle2
} from "lucide-react"

interface SampleFeed {
  id: string
  label: string
  icon: string
  confidence: string
  deptCode: string
  deptName: string
  ward: string
  severity: string
  slaHours: string
  coords: string
  imageUrl: string
}

const SAMPLE_FEEDS: SampleFeed[] = [
  {
    id: "#PWD-HAZARD-9841",
    label: "Pothole Road Defect",
    icon: "🚗",
    confidence: "99.4%",
    deptCode: "PWD",
    deptName: "Roads & Infrastructure",
    ward: "Ward H-West (Bandra)",
    severity: "P1 - Critical",
    slaHours: "24h SLA Triggered",
    coords: "19.0596° N, 72.8295° E",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=320&q=50&fm=webp"
  },
  {
    id: "#SWD-FLOOD-8120",
    label: "Storm Drain Blockage",
    icon: "🌊",
    confidence: "98.7%",
    deptCode: "SWD",
    deptName: "Storm Water Drains",
    ward: "Ward G-South (Worli)",
    severity: "P1 - Critical",
    slaHours: "12h Monsoon SLA",
    coords: "19.0182° N, 72.8168° E",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=320&q=50&fm=webp"
  },
  {
    id: "#SWM-WASTE-4592",
    label: "Garbage Overflow",
    icon: "🗑️",
    confidence: "96.9%",
    deptCode: "SWM",
    deptName: "Solid Waste Mgmt",
    ward: "Ward K-East (Andheri)",
    severity: "P2 - Elevated",
    slaHours: "48h Standard SLA",
    coords: "19.1136° N, 72.8697° E",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=320&q=50&fm=webp"
  },
  {
    id: "#ELD-LIGHT-3019",
    label: "Streetlight Hazard",
    icon: "💡",
    confidence: "98.1%",
    deptCode: "ELD",
    deptName: "Electric & Streetlights",
    ward: "Ward D (Malabar Hill)",
    severity: "P2 - Elevated",
    slaHours: "24h Priority SLA",
    coords: "18.9682° N, 72.8085° E",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=320&q=50&fm=webp"
  }
]

export default function AiPipelineHeroVisual() {
  const [activeIdx, setActiveIdx] = useState(0)
  const isScanning = true

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SAMPLE_FEEDS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const current = SAMPLE_FEEDS[activeIdx]

  return (
    <div className="relative group w-full max-w-full overflow-hidden sm:max-w-4xl mx-auto my-3 sm:my-4 select-none text-left">
      {/* ── Soft Emerald Radial Glow Behind Card ── */}
      <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-emerald-400/20 via-teal-300/15 to-transparent rounded-3xl blur-xl opacity-80 group-hover:opacity-100 transition-all duration-700 -z-10" />

      {/* ── Main Luminous Glass Card ── */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-100/90 dark:border-emerald-950/60 shadow-[0_10px_30px_rgba(16,185,129,0.1)] sm:shadow-[0_20px_50px_rgba(16,185,129,0.12)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
        
        {/* ── Card Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
            </div>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-bold tracking-tight sm:tracking-wider uppercase truncate">
                AI Vision Ingestion & Triage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              420ms LATENCY
            </span>
          </div>
        </div>

        {/* ── Interactive Scenario Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none max-w-full">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
            Scenarios:
          </span>
          {SAMPLE_FEEDS.map((feed, idx) => {
            const isSelected = activeIdx === idx
            return (
              <button
                key={feed.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`text-[11px] sm:text-xs px-2.5 py-1 sm:py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 scale-102"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{feed.icon}</span>
                <span className="truncate max-w-[120px] sm:max-w-none">{feed.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Main Split Viewport: Defect Scanner + Model Ledger ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 items-stretch">
          
          {/* Left Side: Defect Camera Viewport (5 cols) */}
          <div className="md:col-span-5 relative bg-slate-950/90 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col min-h-[190px] sm:min-h-[230px] shadow-sm">
            {/* Background Feed Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={current.imageUrl}
                alt="Feed Stream"
                loading="lazy"
                decoding="async"
                width="320"
                height="180"
                initial={{ opacity: 0.25, scale: 1.05 }}
                animate={{ opacity: 0.75, scale: 1 }}
                exit={{ opacity: 0.25 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Dark Gradient Overlay & Matrix Grid */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

            {/* Glowing Emerald Laser Scan Line */}
            {isScanning && (
              <motion.div
                animate={{ y: [0, 160, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-20"
              />
            )}

            {/* Viewport Top Monospace Stamp */}
            <div className="relative z-10 p-2 sm:p-2.5 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-300 bg-slate-950/80 backdrop-blur-sm border-b border-white/[0.06]">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                CAM_01
              </span>
              <span className="text-slate-400 font-medium truncate">{current.coords}</span>
            </div>

            {/* Sharp Emerald Bounding Box Overlay */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                key={current.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-4/5 h-24 sm:h-28 border border-emerald-400 rounded-lg bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex flex-col justify-between p-1.5"
              >
                {/* HUD Corners */}
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />

                <div className="self-start px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono text-[8px] sm:text-[9px] font-bold tracking-tight shadow-sm">
                  [ {current.id.split("-")[0]} | {current.confidence} ]
                </div>
                <div className="self-end px-1.5 py-0.5 rounded bg-slate-950/80 border border-emerald-400/50 text-emerald-300 font-mono text-[8px] sm:text-[9px] font-medium">
                  TENSOR: 224x224
                </div>
              </motion.div>
            </div>

            {/* Bottom Feed Label */}
            <div className="relative z-10 p-2 sm:p-2.5 bg-slate-950/90 backdrop-blur-sm border-t border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="font-mono font-bold text-slate-200 truncate">{current.label}</span>
              <button
                type="button"
                onClick={() => setActiveIdx((prev) => (prev + 1) % SAMPLE_FEEDS.length)}
                className="text-[9px] sm:text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0"
                title="Cycle sample image"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Next
              </button>
            </div>
          </div>

          {/* Right Side: Live Model Inference Ledger (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            
            {/* Model Spec */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px] sm:text-xs truncate">Vision Classifier</span>
              </div>
              <span className="font-mono text-[9px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-medium shrink-0">
                ONNX DenseNet-121
              </span>
            </div>

            {/* Predicted Dept + Softmax Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1 gap-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">Predicted Dept:</span>
                <span className="font-bold text-slate-800 dark:text-white font-mono truncate text-right">
                  {current.deptCode} ({current.deptName})
                </span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <motion.div
                  key={current.id}
                  initial={{ width: "0%" }}
                  animate={{ width: current.confidence }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full shadow-sm"
                />
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1">
                <span className="truncate">Softmax P({current.deptCode})</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono shrink-0">{current.confidence} Match</span>
              </div>
            </div>

            {/* Geospatial Match with GeoJSON Polygon Tag */}
            <div className="flex items-center justify-between text-xs p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 shadow-sm gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200 font-medium text-[11px] sm:text-xs truncate">{current.ward}</span>
              </div>
              <span className="bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg font-mono shrink-0">
                GeoJSON Match
              </span>
            </div>

            {/* Severity + SLA Trigger */}
            <div className="flex items-center justify-between text-xs p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-sm gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs truncate">{current.severity}</span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-rose-600 dark:text-rose-300/90 font-medium flex items-center gap-1 shrink-0">
                <Clock className="w-2.5 h-2.5 text-rose-500" />
                {current.slaHours}
              </span>
            </div>
          </div>
        </div>

        {/* ── Pipeline Execution Footer Breadcrumb ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
            
            {/* Step 1 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 shadow-sm truncate">
              <span>📸</span>
              <span className="truncate">Ingested</span>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 shadow-sm truncate">
              <span>🧠</span>
              <span className="truncate">AI Triage</span>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 shadow-sm truncate">
              <span>🚀</span>
              <span className="truncate">Dispatched</span>
            </div>
          </div>

          {/* Monospace Telemetry Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 gap-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>50m Deduplication: <strong className="text-emerald-700 dark:text-emerald-400">CLEAR</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Escrow Penalty Lock: <strong className="text-emerald-700 dark:text-emerald-400">ACTIVE</strong></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

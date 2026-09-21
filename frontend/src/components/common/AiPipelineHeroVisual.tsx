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
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-100/90 dark:border-emerald-950/60 shadow-lg rounded-2xl p-4 sm:p-6 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">

        {/* ── Card Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold truncate">
                AI Vision Ingestion &amp; Triage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              420ms Latency
            </span>
          </div>
        </div>

        {/* ── Interactive Scenario Filter Tabs (#11: anchored header, #10: ring on active) ── */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden mb-3">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Defect Scenarios</span>
          </div>
          <div
            role="tablist"
            aria-label="Civic Defect Scenarios"
            className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 overflow-x-auto scrollbar-none"
          >
            {SAMPLE_FEEDS.map((feed, idx) => {
              const isSelected = activeIdx === idx
              return (
                <button
                  key={feed.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveIdx(idx)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm font-semibold ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-100 dark:ring-offset-slate-800"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <span aria-hidden="true">{feed.icon}</span>
                  <span className="whitespace-nowrap">{feed.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main Split Viewport: Defect Scanner + Model Ledger ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 items-stretch">

          {/* Left Side: Defect Camera Viewport (5 cols) */}
          <div className="md:col-span-5 relative bg-slate-950/90 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col min-h-[200px] sm:min-h-[230px] shadow-sm">
            {/* Background Feed Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={current.imageUrl}
                alt={current.label}
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

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />

            {/* Glowing Emerald Laser Scan Line */}
            {isScanning && (
              <motion.div
                animate={{ y: [0, 160, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-20"
              />
            )}

            {/* Viewport Top Monospace Stamp (#5: remove truncate from coords) */}
            <div className="relative z-10 p-2.5 flex items-center justify-between text-xs font-mono text-slate-200 bg-slate-950/85 backdrop-blur-sm border-b border-white/10">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CAM_01
              </span>
              <span className="text-slate-300 font-medium tracking-tight ml-2 break-all">{current.coords}</span>
            </div>

            {/* Clear Emerald Bounding Box Overlay */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                key={current.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-4/5 h-24 sm:h-28 border-2 border-emerald-400 rounded-lg bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex flex-col justify-between p-2"
              >
                <div className="self-start px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm">
                  {current.deptCode} • {current.confidence}
                </div>
                <div className="self-end px-2 py-0.5 rounded bg-slate-950/90 border border-emerald-400/60 text-emerald-300 font-mono text-xs font-medium">
                  {current.id}
                </div>
              </motion.div>
            </div>

            {/* Bottom Feed Label (#12: Next button meets 36×60px touch target) */}
            <div className="relative z-10 p-2.5 bg-slate-950/90 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-xs gap-2">
              <span className="font-semibold text-slate-200 min-w-0 flex-1">{current.label}</span>
              <button
                type="button"
                onClick={() => setActiveIdx((prev) => (prev + 1) % SAMPLE_FEEDS.length)}
                className="min-h-[36px] min-w-[60px] px-3 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-white/10 flex items-center justify-center gap-1.5 rounded-md transition-colors shrink-0 border border-emerald-700/40"
                title="Cycle sample image"
                aria-label="Show next sample image"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Next</span>
              </button>
            </div>
          </div>

          {/* Right Side: Live Model Inference Ledger (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">

            {/* Model Spec (#6: remove truncate so 'Vision Classifier' never clips) */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 font-medium text-xs whitespace-normal">Vision Classifier</span>
              </div>
              <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-medium shrink-0">
                ONNX DenseNet-121
              </span>
            </div>

            {/* Predicted Dept + Softmax Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 gap-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">Predicted Dept:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate text-right">
                  {current.deptCode} ({current.deptName})
                </span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  key={current.id}
                  initial={{ width: "0%" }}
                  animate={{ width: current.confidence }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full shadow-sm"
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                <span className="truncate">Softmax P({current.deptCode})</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">{current.confidence} Match</span>
              </div>
            </div>

            {/* Geospatial Match with GeoJSON Polygon Tag */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 shadow-sm gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-nowrap" title={current.ward}>
                  {current.ward}
                </span>
              </div>
              <span className="bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold px-2 py-0.5 rounded-md font-mono shrink-0">
                GeoJSON Match
              </span>
            </div>

            {/* Severity + SLA Trigger */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-sm gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-bold text-rose-700 dark:text-rose-300 text-xs truncate">{current.severity}</span>
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-300 font-medium flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                {current.slaHours}
              </span>
            </div>
          </div>
        </div>

        {/* ── Pipeline Execution Footer Breadcrumb (#14: simplified — telemetry collapsed) ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">

            {/* Step 1 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-xs px-2 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm">
              <span aria-hidden="true">📸</span>
              <span>Ingested</span>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-xs px-2 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm">
              <span aria-hidden="true">🧠</span>
              <span>AI Triage</span>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs px-2 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm">
              <span aria-hidden="true">🚀</span>
              <span>Dispatched</span>
            </div>
          </div>

          {/* Telemetry summary (#14: single line instead of two competing rows) */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>50m dedup <strong className="text-emerald-700 dark:text-emerald-400">CLEAR</strong> · Escrow <strong className="text-emerald-700 dark:text-emerald-400">ACTIVE</strong></span>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
        </div>

      </div>
    </div>
  )
}

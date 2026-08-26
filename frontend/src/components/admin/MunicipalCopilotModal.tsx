import { useState } from "react"
import { Sparkles, FileText, X, ShieldAlert, Copy, Scale, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface MunicipalCopilotModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MunicipalCopilotModal({ isOpen, onClose }: MunicipalCopilotModalProps) {
  const [activeTab, setActiveTab] = useState<"showCause" | "wardSummary" | "statutoryNotice">("showCause")
  const [loading, setLoading] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)

  // Show-Cause State
  const [contractorName, setContractorName] = useState("M/s Pratibha Infrastructure Pvt Ltd")
  const [projectName, setProjectName] = useState("Linking Road Bituminous Overlay (Chainage 0+000 to 1+450)")
  const [ward] = useState("Ward H-West")
  const [penaltyInr, setPenaltyInr] = useState(150000)

  // Ward Summary State
  const [summaryWard, setSummaryWard] = useState("Ward G-North")
  const [activeTickets, setActiveTickets] = useState(42)

  // Statutory Legal Notice State
  const [noticeType, setNoticeType] = useState<"SECTION_354_BUILDING_EVACUATION" | "SECTION_314_ENCROACHMENT" | "DLP_WARRANTY_BREACH">("SECTION_354_BUILDING_EVACUATION")
  const [recipient, setRecipient] = useState("Occupants & Owners of Siddharth Chawl Compound")
  const [noticeWard, setNoticeWard] = useState("Ward G-North")
  const [address, setAddress] = useState("Bhavani Shankar Road, Dadar West, Mumbai - 400028")
  const [grounds, setGrounds] = useState("Building categorised as C1 Dangerous Structure. Tilt sensor reached 2.9° with acute collapse hazard.")

  if (!isOpen) return null

  const handleGenerateNotice = async () => {
    setLoading(true)
    try {
      const res = await api.post("/copilot/generate-notice", {
        contractorName,
        roadOrProjectName: projectName,
        ward,
        penaltyAmountInr: penaltyInr,
      })
      setGeneratedOutput(res.data.formattedNoticeText)
      toast.success("Show-cause notice generated!", { icon: "📜" })
    } catch {
      toast.error("Failed to generate notice")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    setLoading(true)
    try {
      const res = await api.post("/copilot/ward-summary", {
        ward: summaryWard,
        activeGrievancesCount: activeTickets,
      })
      setGeneratedOutput(res.data.executiveSummary)
      toast.success("Ward summary generated!", { icon: "🏛️" })
    } catch {
      toast.error("Failed to generate summary")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateStatutoryNotice = async () => {
    setLoading(true)
    try {
      const res = await api.post("/notices/generate-pdf", {
        noticeType,
        recipientName: recipient,
        ward: noticeWard,
        locationOrAddress: address,
        statutoryGrounds: grounds,
        allocatedTransitCamp: "Sion-Koliwada BMC Transit Tenements Block C",
        penaltyInr: 50000,
      })
      setGeneratedOutput(res.data.notice.formattedNoticeText)
      toast.success("Statutory MMC Legal Notice generated & cryptographically sealed!", { icon: "⚖️" })
    } catch {
      toast.error("Failed to generate statutory notice")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (generatedOutput) {
      navigator.clipboard.writeText(generatedOutput)
      toast.success("Copied to clipboard!")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Municipal AI Remediation Copilot
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Statutory legal notice drafting, MMC Act orders & executive situation reports.
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("showCause")
              setGeneratedOutput(null)
            }}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "showCause"
                ? "border-violet-600 text-violet-600 dark:text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DLP Show-Cause</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("statutoryNotice")
              setGeneratedOutput(null)
            }}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "statutoryNotice"
                ? "border-violet-600 text-violet-600 dark:text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>MMC Statutory Notice (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("wardSummary")
              setGeneratedOutput(null)
            }}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "wardSummary"
                ? "border-violet-600 text-violet-600 dark:text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === "showCause" ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Contractor Firm
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Project / Road Stretch
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Penalty Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={penaltyInr}
                    onChange={(e) => setPenaltyInr(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateNotice}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold py-2 gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? "Drafting Notice..." : "Draft Show-Cause Notice via AI"}</span>
              </Button>
            </div>
          ) : activeTab === "statutoryNotice" ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  MMC Act Statutory Order Type
                </label>
                <select
                  value={noticeType}
                  onChange={(e: any) => setNoticeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="SECTION_354_BUILDING_EVACUATION">
                    Section 354 — C1 Dilapidated Structure Evacuation & Demolition
                  </option>
                  <option value="SECTION_314_ENCROACHMENT">
                    Section 314 — Immediate Road Encroachment Removal
                  </option>
                  <option value="DLP_WARRANTY_BREACH">
                    Clause 18.4 — Road DLP Breach & Escrow Deduction
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Recipient / Party
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Ward
                  </label>
                  <select
                    value={noticeWard}
                    onChange={(e) => setNoticeWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="Ward G-North">Ward G-North (Dadar)</option>
                    <option value="Ward H-West">Ward H-West (Bandra)</option>
                    <option value="Ward K-West">Ward K-West (Andheri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Statutory Grounds / Sensor Evidence
                </label>
                <textarea
                  rows={2}
                  value={grounds}
                  onChange={(e) => setGrounds(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <Button
                type="button"
                onClick={handleGenerateStatutoryNotice}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold py-2 gap-1.5 shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{loading ? "Generating SHA-256 Notice..." : "Generate Statutory Legal Order (PDF)"}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Administrative Ward
                  </label>
                  <select
                    value={summaryWard}
                    onChange={(e) => setSummaryWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="Ward G-North">Ward G-North (Dadar / Dharavi)</option>
                    <option value="Ward H-West">Ward H-West (Bandra)</option>
                    <option value="Ward K-West">Ward K-West (Andheri)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Active Ward Tickets
                  </label>
                  <input
                    type="number"
                    value={activeTickets}
                    onChange={(e) => setActiveTickets(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateSummary}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold py-2 gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? "Analyzing Ward Telemetry..." : "Generate Daily Situation Summary"}</span>
              </Button>
            </div>
          )}

          {/* Generated Result Deck */}
          {generatedOutput && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 relative space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 dark:border-slate-700">
                <span className="font-mono text-[10px] text-violet-600 font-bold uppercase">
                  Cryptographically Sealed Municipal Notice
                </span>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-[11px] gap-1">
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </Button>
              </div>

              <pre className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {generatedOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Link } from "react-router-dom"
import { ArrowLeft, Scale, AlertTriangle, CheckCircle, Landmark, ShieldCheck, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"

export default function Terms() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <SmartCivicLogo className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">Smart Civic <span className="text-emerald-600">AI</span></span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="text-xs sm:text-sm flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 sm:py-16 px-6 bg-gradient-to-b from-white via-slate-50 to-slate-100/50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Civic Platform Terms & Conditions of Use</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Terms of Service & Citizen Charter
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Clear, transparent guidelines governing the use of Smart Civic AI, citizen responsibilities, municipal grievance routing, and civic accountability.
          </p>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
            Last Updated: September 21, 2026 • Governing Law: Jurisdiction of Courts at Mumbai, India
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-10 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Landmark className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Nature of Platform & Civic Status</h2>
            </div>
            <p>
              Smart Civic AI is an independent, non-partisan civic-tech platform engineered to enhance citizen participation and streamline grievance tracking across Mumbai's 24 administrative wards. While the platform interfaces with open municipal grievance systems, PWD road contractor registries, and ward control rooms, Smart Civic AI is an independent technological platform operating in the public interest.
            </p>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Life-Safety Emergencies:</strong> For active building collapses, live wire electrocution, active gas leaks, or life-threatening flash flooding, citizens must immediately call <strong>1916</strong> (BMC Disaster Management) or <strong>112</strong> (National Emergency Services).
              </span>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Acceptable Use & Citizen Responsibilities</h2>
            </div>
            <p>When reporting municipal issues (potholes, garbage, sewage, streetlights), you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Submit genuine, unmanipulated photographic or video evidence captured at the true geographical defect location.</li>
              <li>Refrain from filing frivolous, fabricated, or duplicate reports for the purpose of gaming Karma rewards.</li>
              <li>Not upload content containing hate speech, obscenity, defamation, or private personal identifiable information of private individuals.</li>
              <li>Grant Smart Civic AI an irrevocable, royalty-free license to use submitted defect photos for AI model training, municipal transparency audits, and public dashboard heatmaps.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. 48-Hour SLA Disclaimers</h2>
            </div>
            <p>
              Smart Civic AI tracks municipal target resolution Service Level Agreements (SLAs), including the 48-hour road pothole repair target and 12-hour solid waste clearance protocol. However, physical repair execution is carried out by municipal ward engineering divisions and authorized third-party contractors. Smart Civic AI does not assume financial liability for delays arising from severe monsoon weather, contractor strikes, or emergency road diversions.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Scale className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Civic Karma Points & Rewards</h2>
            </div>
            <p>
              Civic Karma points earned through verified reporting, peer validation, and community audits have no cash value and cannot be traded, sold, or transferred. Municipal tax rebate vouchers or partner transit discounts (BEST, Mumbai Metro) are subject to periodic municipal policies and budget allocation rules.
            </p>
          </div>

          {/* Section 5: Legal Contact */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Legal & Compliance Counsel
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              For legal inquiries, official municipal notices, or Right to Information (RTI) coordination:
            </p>
            <div className="text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
              <p>Legal Counsel Email: <a href="mailto:legal@smartcivic.mumbai" className="text-blue-600 underline">legal@smartcivic.mumbai</a></p>
              <p>Civic Desk: Smart Civic AI Initiative, Fort, Mumbai 400001, Maharashtra, India</p>
              <p>Dispute Jurisdiction: Exclusive jurisdiction of the courts of competent jurisdiction at Mumbai.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 Smart Civic AI Platform • Greater Mumbai Municipal Intelligence • All Rights Reserved
      </footer>
    </div>
  )
}

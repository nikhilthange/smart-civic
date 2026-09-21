import { Link } from "react-router-dom"
import { ArrowLeft, Shield, Lock, Eye, Database, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"

export default function PrivacyPolicy() {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Digital Personal Data Protection (DPDP) Act 2023 & GDPR Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Privacy Policy & Data Governance
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Your trust is our cornerstone. Learn how Smart Civic AI collects, processes, and protects your civic reports, location data, and personal information across Greater Mumbai.
          </p>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
            Last Updated: September 21, 2026 • Effective Date: January 1, 2026 • Version 2.4
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-10 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <Eye className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
            </div>
            <p>
              Smart Civic AI collects only the minimal necessary data required to route, triage, and resolve municipal defects across Mumbai's 24 administrative wards:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Grievance Media:</strong> Photos, videos, and voice recordings of civic defects (potholes, garbage, waterlogging, streetlights).</li>
              <li><strong>Geospatial Data:</strong> GPS coordinates (latitude, longitude, accuracy) to assign tickets to the correct municipal ward and dispatch field crews within 100 meters.</li>
              <li><strong>Citizen Account Data:</strong> Name, phone number, and email for login, SMS/WhatsApp status notifications, and Civic Karma rewards.</li>
              <li><strong>Device & Telemetry:</strong> Anonymized browser type, OS version, and network performance indicators to ensure offline-first sync resilience.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. EXIF & Media Privacy Safeguards</h2>
            </div>
            <p>
              When you upload a photo or document, our client-side pre-processing pipeline automatically sanitizes personal metadata:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-rose-600">
                  <span>Stripped Automatically</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Camera serial number, device model, facial biometric profiles, and private directory paths.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-emerald-600">
                  <span>Preserved for Civic SLA</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  GPS incident coordinates, photo capture timestamp, and AI defect bounding box classifications.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <Database className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. How Your Data Is Used</h2>
            </div>
            <p>Your data is processed strictly for civic and public interest objectives:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Automatic dispatching of work orders to the Brihanmumbai Municipal Corporation (BMC), PWD, and SWM contractors.</li>
              <li>SLA monitoring, escrow penalty tracking, and Defect Liability Period (DLP) contractor audit trail.</li>
              <li>Ward-level analytics and public GIS transparency maps without revealing reporting citizen identities.</li>
              <li>Calculating Civic Karma points and municipal utility/tax rebate eligibility.</li>
            </ul>
            <p className="text-xs bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <strong>Zero Commercial Monetization:</strong> We never sell, rent, or lease your personal information to advertisers, third-party brokers, or private marketing firms.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Your Rights Under DPDP 2023</h2>
            </div>
            <p>As a citizen user, you have the statutory right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Right to Access:</strong> Request a full copy of all grievance history and personal credentials held in our database.</li>
              <li><strong>Right to Correction:</strong> Update outdated contact details, ward preferences, or name at any time in Settings.</li>
              <li><strong>Right to Erasure:</strong> Request the deletion of your account and personal identifiers (anonymized public defect records remain on the civic ledger for municipal safety audits).</li>
              <li><strong>Right of Grievance Redressal:</strong> Direct appeals regarding personal data mishandling to our Data Protection Officer.</li>
            </ul>
          </div>

          {/* Section 5: DPO Contact */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Data Protection Officer (DPO) & Contact Information
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              For privacy inquiries, statutory rights requests, or audit verification:
            </p>
            <div className="text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
              <p>Email: <a href="mailto:privacy@smartcivic.mumbai" className="text-emerald-600 underline">privacy@smartcivic.mumbai</a></p>
              <p>Address: Greater Mumbai Civic Technology & Data Governance Cell, Fort, Mumbai, MH - 400001</p>
              <p>Emergency Civic Helpline: 1916 (BMC 24x7 Control Room)</p>
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

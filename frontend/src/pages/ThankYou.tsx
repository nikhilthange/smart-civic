import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  Copy,
  Printer,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  LayoutDashboard,
  MapPin,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import toast from "react-hot-toast"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"

export default function ThankYou() {
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const ticketId = searchParams.get("ticketId") || searchParams.get("id") || "BMC-2026-78421"
  const category = searchParams.get("category") || "Roads & Infrastructure"
  const ward = searchParams.get("ward") || "Ward H-West (Bandra)"

  const trackingUrl = `${window.location.origin}/track?id=${encodeURIComponent(ticketId)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    toast.success("Tracking link copied to clipboard!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsAppShare = () => {
    const text = `🚨 I just reported a civic defect (${category}) in ${ward} using Smart Civic AI! Track resolution live: ${trackingUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <SmartCivicLogo className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">Smart Civic <span className="text-emerald-600">AI</span></span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard" className="text-xs sm:text-sm flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl w-full space-y-6 my-auto"
        >
          {/* Card */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] opacity-10" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-16 h-16 rounded-full bg-white text-emerald-600 mx-auto flex items-center justify-center shadow-lg mb-3"
              >
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Grievance Lodged Successfully!
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                Your civic defect report has been verified and registered with Mumbai municipal ward dispatch.
              </p>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Ticket Details Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                    Official Ticket ID
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Ingest
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{ticketId}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyLink} className="h-8 px-2 text-xs">
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Assigned Ward</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {ward}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">SLA Clock</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      48h Target Active
                    </span>
                  </div>
                </div>
              </div>

              {/* What Happens Next Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resolution Workflow
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">AI Vision Defect Verification</p>
                      <p className="text-slate-500">YOLO engine confirmed defect severity & stamped geocoordinates.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Dispatched to Ward Engineers</p>
                      <p className="text-slate-500">Task assigned to field work queue and PWD contractor roster.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Geofenced 100m Proof Sign-off</p>
                      <p className="text-slate-500">Field crew uploads before-and-after photo evidence within 100m GPS radius.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share & Print Actions */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  variant="outline"
                  onClick={handleWhatsAppShare}
                  className="flex-1 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Share on WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="flex-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Receipt Slip
                </Button>
              </div>

              {/* Primary Navigation Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  asChild
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl"
                >
                  <Link to={`/track?id=${encodeURIComponent(ticketId)}`}>
                    <span>Track Ticket Status</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-11 text-sm rounded-xl"
                >
                  <Link to="/complaint/create">
                    <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>Report Another Issue</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 Smart Civic AI Platform • Civic Resolution Guarantee • BMC Helpline 1916
      </footer>
    </div>
  )
}

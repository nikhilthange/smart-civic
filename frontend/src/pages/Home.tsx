import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  MapPin,
  BarChart3,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Sparkles,
  Camera,
  Award,
  Star,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AiPipelineHeroVisual from "@/components/common/AiPipelineHeroVisual"
import SeoHead from "@/components/common/SeoHead"

const HOME_FAQS = [
  {
    question: "What is Smart Civic AI and how does it work in Mumbai?",
    answer: "Smart Civic AI is Greater Mumbai's official municipal operating system (CityOS). It allows residents across all 24 BMC administrative wards to report potholes, waterlogging, and garbage with instant AI computer-vision classification, automatic GPS tagging, and guaranteed 48-hour SLA resolution.",
  },
  {
    question: "How do I report a civic complaint in 3 easy steps?",
    answer: "Step 1: Take a photo of the defect on your phone. Step 2: Allow the AI engine to classify the issue and auto-detect your ward. Step 3: Track real-time repair progress until geofenced resolution proof is submitted by the field crew.",
  },
  {
    question: "What is the guaranteed SLA resolution timeline for civic complaints?",
    answer: "Standard civic defects like potholes and broken streetlights carry a strict 48-hour SLA resolution guarantee. Monsoon subway waterlogging and pipeline ruptures are responded to within 2 to 6 hours with automated contractor escrow penalty deductions (up to ₹12,500) for missed deadlines.",
  },
  {
    question: "How does geofenced resolution verification work for field repairs?",
    answer: "Municipal field workers must be physically present within a 100-meter GPS radius of the incident coordinates to submit repair proof. The system enforces AI before-and-after photo comparisons to prevent false resolution claims.",
  },
  {
    question: "How can citizens earn and redeem Civic Karma points?",
    answer: "Citizens earn Karma points by reporting verified grievances and rating completed repairs. Accumulated points can be redeemed for official municipal incentives, including a 5% BMC property tax rebate, 30-day BEST bus digital passes, and Mumbai Metro card credits.",
  },
];

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="min-h-[100dvh] h-full w-full overflow-y-auto overscroll-y-contain flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <SeoHead
        title="Smart Civic AI - BMC Mumbai Grievance & CityOS Portal"
        description="Report Mumbai potholes, garbage, and civic defects with instant AI verification, guaranteed 48-hour SLA resolution, and live 24-ward tracking."
        keywords="BMC Mumbai, Smart Civic, civic complaint portal Mumbai, report pothole Mumbai, BMC water logging, BMC garbage collection, Mumbai municipal grievance, civic karma rewards"
        canonicalPath="/"
        faqs={HOME_FAQS}
      />
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link className="flex items-center gap-2 min-w-0 shrink" to="/">
            <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Smart Civic <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">How it Works</a>
            <a href="#ai" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">AI Engine</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" size="sm" variant="ghost">
              <Link to="/auth">Sign In</Link>
            </Button>

            <Button asChild className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 whitespace-nowrap" size="sm">
              <Link to="/auth">
                <span>Get Started</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5 hidden sm:inline" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-70"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[450px] w-[900px] rounded-full bg-emerald-500/15 opacity-40 blur-[130px]"></div>

          <div className="container relative px-4 md:px-6 mx-auto text-center max-w-6xl space-y-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center gap-5"
            >
              {/* Live Status Pill */}
              <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>BMC Mumbai Smart Governance • 24 Municipal Wards • Live AI Triage</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 variants={fadeUpVariant} className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl text-slate-900 dark:text-white leading-[1.12]">
                Report Mumbai Civic Grievances with <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">
                  AI-Powered 48h SLA Resolution
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p variants={fadeUpVariant} className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
                Official BMC digital municipal platform. Report potholes, garbage, and drainage defects with 96.4% AI vision verification, live GIS map tracking, and geofenced field proof.
              </motion.p>

              {/* CTA Action Buttons */}
              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-13 px-7 text-sm sm:text-base font-bold shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/auth">
                    <span>Report an Issue Now</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-13 px-7 text-sm sm:text-base font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 text-slate-800 dark:text-slate-100">
                  <Link to="/track">
                    Track Existing Grievance
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-13 px-5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Link to="/map">
                    <MapPin className="mr-1.5 h-4 w-4 text-emerald-600" />
                    Live Ward Map
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* ═══ 3-CARD GOVERNANCE & AEO DEFINITION TRUST GRID ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left pt-6"
            >
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
                  ⚡
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Instant AI Vision Triage</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  96.4% computer-vision classification automatically routes road, waste, and flood hazards to designated BMC departments in 420ms.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                  ⏱️
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Guaranteed 48-Hour SLA</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enforces 3-tier municipal escalation with automated contractor escrow penalties up to ₹12,500 for unfulfilled deadlines.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-base">
                  🛡️
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">100m GPS Geofenced Proof</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Field crews must be physically on-site within a 100m radius to submit timestamped before-and-after photo verification.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ 4K BEFORE & AFTER AI RESOLUTION PROOF SHOWCASE ═══════════════════ */}
        <section id="proof-showcase" className="w-full py-20 md:py-28 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>AI-Verified Field Resolution Proof</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white">
                Before & After Civic Transformations
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                Real evidence logged by BMC ground officers with AI computer vision quality verification and timestamped resolution proof.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: Pothole & Road Repair */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Pothole & Road Surface Repair</h3>
                      <p className="text-xs text-slate-500">Infrastructure Dept • Ticket #BMC-2026-9841</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                    <Award className="h-3.5 w-3.5 text-emerald-600" />
                    SLA Met (14h)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-6">
                  {/* Before Container */}
                  <div className="relative rounded-xl overflow-hidden border border-rose-200 dark:border-rose-900/50 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-600/90 text-white backdrop-blur-md shadow-md">
                      🔴 Reported Critical
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1600&q=80"
                      alt="Before Pothole"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-[11px] text-slate-300 font-medium">BEFORE: Severe Pothole Hazard</p>
                    </div>
                  </div>

                  {/* After Container */}
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-md">
                      🟢 Resolved & Verified
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80";
                      }}
                      alt="After Repair"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-[11px] text-emerald-300 font-medium">AFTER: Smooth Asphalt Restored</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    📍 Ward H-West (Bandra) — Resolved in 14 Hours — AI Confidence 98%
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Verified by BMC AI Computer Vision ✓
                  </span>
                </div>
              </motion.div>

              {/* Card 2: Waste Clearance & Sanitation */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Waste Clearance & Sanitation</h3>
                      <p className="text-xs text-slate-500">Solid Waste Dept • Ticket #BMC-2026-8812</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                    <Award className="h-3.5 w-3.5 text-emerald-600" />
                    Cleaned & Logged
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-6">
                  {/* Before Container */}
                  <div className="relative rounded-xl overflow-hidden border border-rose-200 dark:border-rose-900/50 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-600/90 text-white backdrop-blur-md shadow-md">
                      🔴 Reported Critical
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1600&q=80"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1604186837056-8e7c286756f2?auto=format&fit=crop&w=1000&q=80";
                      }}
                      alt="Before Waste Clearance"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-[11px] text-slate-300 font-medium">BEFORE: Overflowing Waste Pile</p>
                    </div>
                  </div>

                  {/* After Container */}
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-md">
                      🟢 Cleaned & Sanitized
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1600&q=80"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1000&q=80";
                      }}
                      alt="After Sanitation"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-[11px] text-emerald-300 font-medium">AFTER: Fully Cleaned Boulevard</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    📍 Ward G-South (Worli) — Cleaned & Verified — Field Proof Logged
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Timestamped Officer Proof Logged ✓
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* AI Powered Section */}
        <section id="ai" className="w-full py-20 md:py-32 bg-white dark:bg-slate-900 border-y">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeUpVariant}
                className="space-y-6"
              >
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  Smart AI Routing
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white">
                  Zero delays. <br /> Infinite efficiency.
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Our platform uses advanced Machine Learning models to automatically categorize and prioritize complaints as soon as they are submitted.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Auto-categorization of issues from text and images.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Intelligent priority scoring based on urgency and impact.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Instant routing to the correct municipal department.</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                <AiPipelineHeroVisual />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Everything you need to report efficiently</h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                A complete toolkit designed for modern citizens and responsive city authorities.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[
                { icon: MapPin, title: "Location Tagging", desc: "Pinpoint exact coordinates for faster response times using GPS." },
                { icon: ShieldCheck, title: "Transparent Tracking", desc: "Track every step of the resolution process with real-time updates." },
                { icon: BarChart3, title: "Data Insights", desc: "Interactive dashboards helping authorities allocate resources efficiently." },
                { icon: Clock, title: "24/7 Availability", desc: "Report issues anytime, anywhere directly from your mobile device." },
                { icon: Users, title: "Community Voting", desc: "Upvote community issues to increase visibility and priority." },
                { icon: MessageSquare, title: "Direct Feedback", desc: "Communicate directly with city officials regarding your complaints." },
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeUpVariant}>
                  <Card className="h-full border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 dark:text-slate-400">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200/60 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">How it works</h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                From identifying a problem to fixing it, the process is seamless.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 relative">
              {[
                { step: "01", title: "Spot & Report", desc: "Take a photo and provide a brief description of the issue." },
                { step: "02", title: "AI Analyzes", desc: "Our AI categorizes and routes the ticket to the correct department." },
                { step: "03", title: "Authorities Act", desc: "Workers are dispatched with the exact location and details." },
                { step: "04", title: "Issue Resolved", desc: "You receive a notification once the issue is permanently fixed." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="bg-emerald-600 text-white font-bold text-lg w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-6 mx-auto group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section Banner */}
        <section className="container px-4 md:px-6 mx-auto my-12">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-10 shadow-xl max-w-7xl mx-auto border border-emerald-800/40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "25k+", label: "Issues Resolved" },
                { number: "40%", label: "Faster Response Time" },
                { number: "150+", label: "Cities Integrated" },
                { number: "100k+", label: "Active Citizens" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center">
                  <h3 className="text-4xl lg:text-5xl font-extrabold text-emerald-400 mb-2 tracking-tight">{stat.number}</h3>
                  <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                Community Voice
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center mt-3">
                Trusted by Citizens & City Authorities
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                See how Smart Civic AI empowers municipal officers and citizens alike with real-time feedback.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Priya Kulkarni",
                  role: "Citizen, Ward H-West (Bandra)",
                  text: "I reported a severe pothole hazard on my street, and it was repaired in less than 14 hours! The SLA timeline stepper and photo proof gave me 100% confidence.",
                  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
                  badge: "Verified Citizen ✓",
                  badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2 py-0.5 rounded-md",
                },
                {
                  name: "Rajesh Patil",
                  role: "Senior Ward Officer, BMC",
                  text: "The AI auto-categorization and spatial deduplication save our ward department hours of manual triage every week. Priority routing ensures critical emergencies get resolved first.",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                  badge: "Municipal Officer ✓",
                  badgeClass: "bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-2 py-0.5 rounded-md",
                },
                {
                  name: "Ananya Deshmukh",
                  role: "Community Association President, Worli",
                  text: "Smart Civic AI has brought unmatched governance transparency to our ward. The Ward Leaderboard scorecards motivate city departments to consistently exceed SLA targets.",
                  avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80",
                  badge: "Community Leader ✓",
                  badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium px-2 py-0.5 rounded-md",
                },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* 5-Star Rating */}
                    <div className="flex text-amber-400 gap-1 mb-4">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 italic text-base leading-relaxed mb-6">
                      {t.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.name}</p>
                        <span className={t.badgeClass}>{t.badge}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ AEO & GEO MUNICIPAL COMPARISON TABLE (DECISION SUPPORT) ═══════════ */}
        <section className="w-full py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                System Comparison
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Traditional BMC Reporting vs. Smart Civic AI CityOS
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
                Comparing grievance turnaround speed, transparency, and verification between legacy phone helplines and our AI operating system.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Evaluation Criteria</th>
                    <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400">Legacy Helpline (1916 / Counter)</th>
                    <th className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-extrabold">Smart Civic AI CityOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Triage & Classification</td>
                    <td className="py-3 px-4 text-slate-500">Manual phone operator (1-3 days backlog)</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">Instant AI Vision (96.4% accuracy, 0.4s)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">SLA Guarantee & Penalty</td>
                    <td className="py-3 px-4 text-slate-500">Unspecified; manual paper follow-up</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">Strict 48-Hour SLA with escrow penalties</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Resolution Proof</td>
                    <td className="py-3 px-4 text-slate-500">Self-reported officer sign-off without photos</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">100m GPS Geofenced Before/After Photo Audit</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Duplicate Deduplication</td>
                    <td className="py-3 px-4 text-slate-500">Creates duplicate tickets causing backlogs</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">50-Meter Spatial Auto-Clustering & Upvoting</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Citizen Incentives</td>
                    <td className="py-3 px-4 text-slate-500">None</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">Civic Karma (5% Property Tax Rebate & BEST Passes)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═══ COMPREHENSIVE AEO KNOWLEDGE BASE & FREQUENTLY ASKED QUESTIONS ═══ */}
        <section id="faq" className="w-full py-20 bg-slate-50/60 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                Common questions about our service and how it works
              </p>
            </div>

            {/* Clean Chitralai-style Accordion Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden transition-all">
              {HOME_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx
                return (
                  <div key={idx} className="group">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full py-5 px-6 sm:px-8 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="leading-snug">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-600 transition-transform duration-200 ease-out ${
                          isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 sm:px-8 pb-5 pt-0 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Credible External Sources & Citations */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Official Municipal Government Sources & References:</p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
                <a href="https://www.mcgm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  Brihanmumbai Municipal Corporation (BMC Portal) ↗
                </a>
                <span>•</span>
                <a href="https://www.maharashtra.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  Government of Maharashtra ↗
                </a>
                <span>•</span>
                <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  OpenStreetMap Mumbai GIS ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <Link className="flex items-center gap-2 mb-4" to="/">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Civic AI</span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                Making cities smarter, safer, and more responsive to citizen needs through AI-powered technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">How it works</a></li>
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">For Cities</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-primary">API Documentation</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <p>© 2026 Smart Civic AI Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  BarChart3,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Camera,
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Quote,
  Zap,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import AiPipelineHeroVisual from "@/components/common/AiPipelineHeroVisual"
import SeoHead from "@/components/common/SeoHead"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"
import StickyMobileCta from "@/components/common/StickyMobileCta"

const TESTIMONIALS_DATA = [
  {
    name: "Priya Kulkarni",
    role: "Resident & Commuter",
    ward: "Ward H-West (Bandra West)",
    category: "citizen",
    tag: "Pothole Repaired in 14h",
    tagColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    highlight: "Repaired in less than 14 hours!",
    text: "I reported a severe pothole crater near Hill Road on my morning commute. The AI auto-detected the ward and dispatched the PWD asphalt crew. By evening, it was completely recarpeted with timestamped before-and-after photos!",
    stat: "Fix Time: 13.8 Hours",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "Verified Citizen",
    badgeClass: "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60",
  },
  {
    name: "Rajesh Patil",
    role: "Senior Executive Ward Officer",
    ward: "Ward K-East (Andheri East)",
    category: "officer",
    tag: "42% Triage Time Saved",
    tagColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    highlight: "Saves hours of manual triage daily.",
    text: "The AI auto-categorization and spatial 50m deduplication are game-changers for BMC ward operations. Instead of 20 duplicates for the same waterlogging spot, we get one unified ticket with verified severity scoring.",
    stat: "Triage: 0.4s Ingestion",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "Municipal Officer",
    badgeClass: "bg-blue-100/80 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60 dark:border-blue-700/60",
  },
  {
    name: "Ananya Deshmukh",
    role: "ALM Federation President",
    ward: "Ward G-South (Worli Seaface)",
    category: "alm",
    tag: "5% Tax Rebate Earned",
    tagColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    highlight: "Neighbourhood cleanliness up by 85%.",
    text: "Our Advanced Locality Management (ALM) society tracked 40+ dry-waste composting tickets through the municipal dashboard. Reaching zero-waste status qualified our building cluster for BMC's 5% property tax rebate!",
    stat: "Rebate: Active 5%",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "ALM Leader",
    badgeClass: "bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60",
  },
  {
    name: "Sanjay Shinde",
    role: "Ground Operations Supervisor",
    ward: "PWD Roads Division (Zone 3)",
    category: "worker",
    tag: "100m GPS Geofenced Sign-off",
    tagColor: "bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    highlight: "Transparent task routing & zero paperwork.",
    text: "The worker interface gives our road crew the exact GPS pin, routing map, and material specifications. The 100m geofence ensures our repair quality is digitally audited and approved by ward engineers instantly.",
    stat: "Repairs: 180+ Completed",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "Field Crew Supervisor",
    badgeClass: "bg-teal-100/80 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300/60 dark:border-teal-700/60",
  },
  {
    name: "Dr. Farhan Merchant",
    role: "Citizen & Community Volunteer",
    ward: "Ward A (Colaba Causeway)",
    category: "citizen",
    tag: "18 Streetlights Restored",
    tagColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    highlight: "Pedestrian safety significantly improved.",
    text: "Reported multiple flickering streetlights along Colaba Causeway. The SLA countdown was visible in real time, and the electrical team completed replacement in under 24 hours. The transparency is unmatched.",
    stat: "SLA Met: 100% On-Time",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "Verified Citizen",
    badgeClass: "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-700/60",
  },
  {
    name: "Sunita Gaikwad",
    role: "Assistant Municipal Commissioner",
    ward: "Ward P-South (Goregaon)",
    category: "officer",
    tag: "Escrow Penalties Automated",
    tagColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    highlight: "Contractor SLA compliance rose to 94%.",
    text: "The automated contractor escrow penalty system ensures that road contractors meet their 48-hour warranty commitments. Unresolved tickets automatically trigger SLA breach deductions without red tape.",
    stat: "Compliance: 94.2%",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&h=80&q=50&fm=webp",
    badge: "AMC Officer",
    badgeClass: "bg-purple-100/80 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300/60 dark:border-purple-700/60",
  },
];

const HOME_FAQS = [
  {
    question: "What is Smart Civics (Smart Civic AI) and how does it help with BMC issues?",
    answer: "Smart Civics (Smart Civic AI) is an independent AI-powered citizen civic platform for Greater Mumbai. It empowers residents across all 24 administrative wards to report and track BMC issues including potholes, overflowing garbage, drainage blocks, and broken streetlights with instant AI computer-vision classification, automatic GPS tagging, and real-time tracking.",
  },
  {
    question: "How do I report BMC issues and civic complaints online in 3 easy steps?",
    answer: "Step 1: Take a photo of the defect (pothole, garbage, water leakage, or streetlight) on your smartphone. Step 2: Allow the Smart Civics AI engine to classify the issue and pinpoint your Mumbai ward. Step 3: Track real-time repair progress until geofenced resolution proof is submitted by field crews.",
  },
  {
    question: "Which BMC issues can be reported on Smart Civics?",
    answer: "You can report all major municipal defects including: PWD road potholes & asphalt cracks, SWM solid waste & uncollected garbage, SWD storm water drain blockages & monsoon waterlogging, WSD water pipe bursts & contamination, and ELD streetlight failures across all 24 Mumbai wards.",
  },
  {
    question: "Is Smart Civics an official BMC portal?",
    answer: "Smart Civics is an independent civic-tech platform created to help Mumbai citizens document, AI-verify, and track municipal defects and BMC issues across all 24 administrative wards with complete transparency.",
  },
  {
    question: "How does geofenced resolution verification work for field repairs?",
    answer: "Field workers confirm presence within a 100-meter GPS radius of the incident coordinates to submit repair proof. The Smart Civics platform supports before-and-after photo comparisons to prevent false resolution claims.",
  },
  {
    question: "How can citizens earn and redeem Civic Karma points on Smart Civics?",
    answer: "Citizens earn Karma points by reporting verified civic issues and rating completed community repairs. Points unlock civic badges, community leaderboard standings, and citizen recognition rewards.",
  },
];

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [currentTestimonialIdx, setCurrentTestimonialIdx] = useState(0)
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false)

  // Automatic carousel rotation every 5 seconds (pauses on user hover)
  useEffect(() => {
    if (isTestimonialPaused) return

    const timer = setInterval(() => {
      setCurrentTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS_DATA.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isTestimonialPaused])

  const nextTestimonial = () => {
    setCurrentTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS_DATA.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length)
  }


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
    <div className="min-h-[100dvh] h-full w-full overflow-x-hidden overflow-y-auto overscroll-y-contain flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <SeoHead
        title="Smart Civic (Smart Civics) - Mumbai Civic Issues, Smart Cities & BMC Grievance Tracker"
        description="Independent AI citizen platform for Mumbai & smart cities to report, verify, and track BMC municipal issues (potholes, garbage, waterlogging, streetlights) across 24 administrative wards."
        keywords="Smart Civic, Smart Civics, SmartCivic, SmartCivics, Smart Civc, Smart Civix, Smart Sivic, Smart Sivics, Smart Civic Cities, Smart Cities Civic, SmartCity Civic, Smart City Mumbai, BMC issues, BMC complaint, BMC Mumbai, report BMC issues, BMC grievance portal, BMC pothole complaint, BMC garbage issue, BMC water supply problem, BMC streetlight complaint, Mumbai municipal corporation issues, BMC 24 wards, BMC helpline 1916, civic issues mumbai, mumbai municipal grievance redressal"
        canonicalPath="/"
        faqs={HOME_FAQS}
      />
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link className="flex items-center gap-2.5 min-w-0 shrink" to="/">
            <SmartCivicLogo className="w-7 h-7" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Smart Civic <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">How it Works</a>
            <Link to="/nagarsevak" className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 transition-colors">Find Nagarsevak</Link>
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
        <section className="relative w-full pt-14 pb-16 md:pt-20 md:pb-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="container relative px-4 md:px-6 mx-auto text-center max-w-5xl space-y-8">
            <div className="flex flex-col items-center gap-4">
              {/* Institutional Live Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Smart Civic AI • 24 Mumbai Administrative Wards • Live SLA Governance</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl text-slate-900 dark:text-white leading-[1.15]">
                Municipal Defect Intelligence &amp; 48-Hour Resolution Governance
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
                Empowering Mumbai residents to file, monitor, and verify civic infrastructure grievances across all 24 wards: road defects, drain obstructions, water distribution leaks, and sanitation with automated computer vision verification.
              </p>

              {/* CTA Action Buttons
                   #7: one true primary (solid bg-primary), two secondary (outline)
                   #11: all three buttons carry an icon for visual consistency */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                {/* Primary CTA — distinct solid fill, largest visual weight */}
                <Button asChild size="lg" className="w-full sm:w-auto rounded-lg h-11 px-6 text-sm font-semibold shadow-md transition-colors bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/auth">
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Report Defect</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {/* Secondary CTAs — identical outline style, same icon treatment */}
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-lg h-11 px-6 text-sm font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 shadow-xs">
                  <Link to="/track">
                    {/* #11: Search icon added so all three buttons are icon-consistent */}
                    <Search className="mr-1.5 h-4 w-4 text-slate-500" />
                    <span>Track Grievance SLA</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-lg h-11 px-6 text-sm font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs transition-colors">
                  <Link to="/map">
                    <MapPin className="mr-1.5 h-4 w-4 text-primary" />
                    <span>Ward GIS Map</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* ═══ 3-CARD GOVERNANCE & AEO DEFINITION TRUST GRID ═══ */}
            <div className="pt-6">
              {/* #5: Remove `uppercase` — 27-char all-caps heading slows reading.
                   Use normal-case with letter-spacing for the same visual hierarchy. */}
              <h2 className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 text-center mb-4 uppercase">
                Key Governance Capabilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Instant AI Vision Triage</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    96.4% computer-vision classification automatically routes road, waste, and flood hazards to designated BMC departments in 420ms.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Guaranteed 48-Hour SLA</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Enforces 3-tier municipal escalation with automated contractor escrow penalties up to ₹12,500 for unfulfilled deadlines.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">100m GPS Geofenced Proof</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Field crews must be physically on-site within a 100m radius to submit timestamped before-and-after photo verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4K BEFORE & AFTER AI RESOLUTION PROOF SHOWCASE ═══════════════════ */}
        <section id="proof-showcase" className="w-full py-20 md:py-28 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
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
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=340&q=45&fm=webp"
                      alt="Before Pothole"
                      loading="lazy"
                      decoding="async"
                      width="340"
                      height="224"
                      className="w-full h-56 sm:h-72 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-xs sm:text-sm text-slate-100 font-semibold">BEFORE: Severe Pothole Hazard</p>
                    </div>
                  </div>

                  {/* After Container */}
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-md">
                      🟢 Resolved &amp; Verified
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=340&q=45&fm=webp"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=340&q=45&fm=webp";
                      }}
                      alt="After Repair"
                      loading="lazy"
                      decoding="async"
                      width="340"
                      height="224"
                      className="w-full h-56 sm:h-72 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-xs sm:text-sm text-emerald-300 font-semibold">AFTER: Smooth Asphalt Restored</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Ward H-West (Bandra) • Resolved in 14 Hours • AI Confidence 98%
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
                      src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=340&q=45&fm=webp"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1604186837056-8e7c286756f2?auto=format&fit=crop&w=340&q=45&fm=webp";
                      }}
                      alt="Before Waste Clearance"
                      loading="lazy"
                      decoding="async"
                      width="340"
                      height="192"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-xs sm:text-sm text-slate-100 font-semibold">BEFORE: Overflowing Waste Pile</p>
                    </div>
                  </div>

                  {/* After Container */}
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 shadow-inner">
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-md">
                      🟢 Cleaned & Sanitized
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=340&q=45&fm=webp"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=340&q=45&fm=webp";
                      }}
                      alt="After Sanitation"
                      loading="lazy"
                      decoding="async"
                      width="340"
                      height="192"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                      <p className="text-xs sm:text-sm text-emerald-300 font-semibold">AFTER: Fully Cleaned Boulevard</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Ward G-South (Worli) • Cleaned & Verified • Field Proof Logged
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
        <section id="ai" className="w-full py-20 md:py-28 lg:py-32 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <div className="container px-4 md:px-6 lg:px-8 mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 xl:gap-24 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeUpVariant}
                className="space-y-5 sm:space-y-6 lg:pr-6 min-w-0"
              >
                <div className="inline-block rounded-lg bg-emerald-500/10 px-3 py-1 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  Smart AI Routing
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  Zero delays. <br className="hidden sm:inline" /> Infinite efficiency.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our platform uses advanced Machine Learning models to automatically categorize and prioritize complaints as soon as they are submitted.
                </p>
                <ul className="space-y-3 sm:space-y-4 text-xs sm:text-base">
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Auto-categorization of issues from text and images.</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Intelligent priority scoring based on urgency and impact.</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Instant routing to the correct municipal department.</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full min-w-0 max-w-full overflow-hidden lg:pl-2"
              >
                <AiPipelineHeroVisual />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
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
                <div key={i}>
                  <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{feature.title}</CardTitle>
                    </div>
                    <CardContent className="p-0">
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Municipal Resolution Lifecycle</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Transparent end-to-end processing from citizen report to verified field closure.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Spot & Capture", desc: "Photograph the defect with automatic EXIF geolocation verification." },
                { step: "02", title: "Automated Triage", desc: "Computer vision classifies defect severity and maps it to the ward division." },
                { step: "03", title: "Field Dispatch", desc: "Municipal squads and DLP contractors are mobilized within strict SLA deadlines." },
                { step: "04", title: "Verified Closure", desc: "Before and after photographic evidence is audited before official ticket sign-off." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                >
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    PHASE {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section Banner */}
        <section className="container px-4 md:px-6 mx-auto my-12" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Platform Statistics &amp; Municipal Impact</h2>
          <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-6 sm:p-8 max-w-7xl mx-auto border border-slate-800 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              {[
                { number: "25k+", label: "Grievances Resolved" },
                { number: "40%", label: "Faster Resolution Time" },
                { number: "24/24", label: "Mumbai Wards Active" },
                { number: "100k+", label: "Verified Citizens" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center pt-3 sm:pt-0 sm:px-4">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-emerald-400 mb-1 tracking-tight">{stat.number}</p>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ EDITORIAL SPOTLIGHT TESTIMONIAL CAROUSEL (FOOD TAILOR STYLE) ═══════════════ */}
        <section 
          onMouseEnter={() => setIsTestimonialPaused(true)}
          onMouseLeave={() => setIsTestimonialPaused(false)}
          className="w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#faf8f5] dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 relative overflow-hidden text-slate-900 dark:text-slate-100"
        >
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="text-center mb-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Quote className="w-3.5 h-3.5" />
                <span>COMMUNITY CITIZEN TRUST</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Voices of Mumbai Citizens &amp; Municipal Officers
              </h2>
            </div>

            {/* Top Center Flourished Avatar with Laurel Wings */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative inline-flex items-center justify-center mb-8 sm:mb-10">
                {/* Left Floral / Wing Flourish */}
                <svg
                  className="w-12 sm:w-16 h-8 text-slate-400 dark:text-slate-600 hidden sm:block -mr-2"
                  viewBox="0 0 80 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M78 20 C55 12, 30 5, 2 18 C25 28, 50 30, 78 20 Z" />
                  <path d="M60 14 C42 6, 25 6, 5 16" />
                  <path d="M65 21 C48 22, 30 26, 12 30" />
                </svg>

                {/* Center Circular Avatar */}
                <div className="relative mx-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-600 shadow-xl overflow-hidden ring-4 ring-white dark:ring-slate-900">
                    <img
                      src={TESTIMONIALS_DATA[currentTestimonialIdx].avatar}
                      alt={TESTIMONIALS_DATA[currentTestimonialIdx].name}
                      width="80"
                      height="80"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                {/* Right Floral / Wing Flourish (Mirrored) */}
                <svg
                  className="w-12 sm:w-16 h-8 text-slate-400 dark:text-slate-600 hidden sm:block -ml-2 scale-x-[-1]"
                  viewBox="0 0 80 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M78 20 C55 12, 30 5, 2 18 C25 28, 50 30, 78 20 Z" />
                  <path d="M60 14 C42 6, 25 6, 5 16" />
                  <path d="M65 21 C48 22, 30 26, 12 30" />
                </svg>
              </div>

              {/* Main Content Row: Modern Chevron Button + Central Quote + Modern Chevron Button */}
              <div className="relative w-full flex items-center justify-between gap-3 sm:gap-6 min-h-[220px]">
                {/* Left Navigation Button */}
                <button
                  type="button"
                  onClick={prevTestimonial}
                  className="p-3 sm:p-3.5 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Centered Animated Quote */}
                <div className="flex-1 max-w-3xl px-2 sm:px-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTestimonialIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-6"
                    >
                      {/* Serif Italic Quote Text */}
                      <p className="font-serif italic text-lg sm:text-2xl md:text-3xl text-slate-800 dark:text-slate-100 leading-relaxed sm:leading-loose">
                        &ldquo;{TESTIMONIALS_DATA[currentTestimonialIdx].text}&rdquo;
                      </p>

                      {/* Author Name in Spaced Uppercase */}
                      <div className="space-y-2 pt-2">
                        <h3 className="font-bold tracking-[0.25em] text-xs sm:text-sm uppercase text-slate-900 dark:text-white">
                          {TESTIMONIALS_DATA[currentTestimonialIdx].name}
                        </h3>
                        
                        <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-medium">{TESTIMONIALS_DATA[currentTestimonialIdx].role}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {TESTIMONIALS_DATA[currentTestimonialIdx].ward}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            {TESTIMONIALS_DATA[currentTestimonialIdx].tag}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right Navigation Button */}
                <button
                  type="button"
                  onClick={nextTestimonial}
                  className="p-3 sm:p-3.5 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Bottom Carousel Indicator Dots with subtle pulse & auto-rotate timer */}
              <div className="flex items-center justify-center gap-2.5 mt-10">
                {TESTIMONIALS_DATA.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentTestimonialIdx(dotIdx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      dotIdx === currentTestimonialIdx
                        ? "w-8 bg-emerald-600 dark:bg-emerald-400 shadow-xs shadow-emerald-500/30"
                        : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
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

            {/* #10: Borderless modern comparison — replaces the heavy rigid table
                 to align with the airy aesthetic used throughout the page */}
            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-3 gap-3 px-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Criteria</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Legacy Helpline</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Smart Civic AI</span>
              </div>
              {[
                {
                  criteria: "Triage & Classification",
                  legacy: "Manual phone operator (1-3 days)",
                  smart: "Instant AI Vision — 96.4% accuracy, 0.4 s",
                },
                {
                  criteria: "SLA Guarantee & Penalty",
                  legacy: "Unspecified; manual paper follow-up",
                  smart: "Strict 48-Hour SLA with escrow penalties",
                },
                {
                  criteria: "Resolution Proof",
                  legacy: "Self-reported sign-off, no photos",
                  smart: "100m GPS Geofenced Before/After Audit",
                },
                {
                  criteria: "Duplicate Handling",
                  legacy: "Duplicate tickets cause backlogs",
                  smart: "50m Spatial Auto-Clustering & Upvoting",
                },
                {
                  criteria: "Citizen Incentives",
                  legacy: "None",
                  smart: "Civic Karma — 5% Tax Rebate & BEST Passes",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 gap-3 rounded-xl px-4 py-3.5 items-start ${
                    i % 2 === 0
                      ? "bg-slate-50 dark:bg-slate-800/40"
                      : "bg-white dark:bg-transparent"
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{row.criteria}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{row.legacy}</span>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 leading-snug flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    {row.smart}
                  </span>
                </div>
              ))}
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
              <p className="font-semibold text-slate-700 dark:text-slate-300">Public Municipal References & Portals (For Citizen Information):</p>
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
              {/* #7: disclaimer text raised from text-[11px] (11px) to text-xs (12px) */}
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                * Smart Civic AI is an independent community civic intelligence initiative created to help citizens report and monitor municipal issues in Mumbai. Not an official BMC government property.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-12 pb-24 sm:py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2 space-y-4">
              <Link className="flex items-center gap-2.5" to="/">
                <SmartCivicLogo className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Civic AI</span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                Empowering Mumbai residents across all 24 administrative wards to report, verify, and resolve municipal defects with AI computer-vision and 48-hour SLA governance.
              </p>
              {/* Real Civic Headquarters Contact Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 text-slate-600 dark:text-slate-400 max-w-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Civic Operations & Grievance Hub</p>
                <p>Municipal Technology Center, Fort, Mumbai, MH 400001</p>
                <p>BMC Helpline: <strong className="text-emerald-600 dark:text-emerald-400">1916</strong> (24x7 Toll-Free)</p>
                <p>Grievance Desk: <a href="mailto:grievance@smartcivic.mumbai" className="text-emerald-600 underline">grievance@smartcivic.mumbai</a></p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Civic Platform</h3>
              {/* #13: py-1.5 on each li for comfortable vertical spacing */}
              <ul className="space-y-0 text-sm text-slate-500 dark:text-slate-400">
                <li className="py-1.5"><Link to="/complaint/create" className="hover:text-emerald-600 transition-colors">Report Defect</Link></li>
                <li className="py-1.5"><Link to="/track" className="hover:text-emerald-600 transition-colors">Track 48h SLA</Link></li>
                <li className="py-1.5"><Link to="/nagarsevak" className="hover:text-emerald-600 transition-colors font-medium text-emerald-600 dark:text-emerald-400">Find My Nagarsevak</Link></li>
                <li className="py-1.5"><Link to="/map" className="hover:text-emerald-600 transition-colors">24-Ward GIS Map</Link></li>
                <li className="py-1.5"><Link to="/monsoon-radar" className="hover:text-emerald-600 transition-colors">Monsoon Radar</Link></li>
                <li className="py-1.5"><Link to="/rewards" className="hover:text-emerald-600 transition-colors">Civic Karma Rewards</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Resources</h3>
              <ul className="space-y-0 text-sm text-slate-500 dark:text-slate-400">
                <li className="py-1.5"><Link to="/support" className="hover:text-emerald-600 transition-colors">Help &amp; FAQ Center</Link></li>
                <li className="py-1.5"><Link to="/dlp-registry" className="hover:text-emerald-600 transition-colors">DLP Road Registry</Link></li>
                <li className="py-1.5"><Link to="/whatsapp-sandbox" className="hover:text-emerald-600 transition-colors">WhatsApp Bot Demo</Link></li>
                <li className="py-1.5"><a href="https://www.mcgm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">Official BMC Portal ↗</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Legal &amp; Trust</h3>
              <ul className="space-y-0 text-sm text-slate-500 dark:text-slate-400">
                <li className="py-1.5"><Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
                <li className="py-1.5"><Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
                <li className="py-1.5"><Link to="/privacy#exif" className="hover:text-emerald-600 transition-colors">EXIF &amp; Media Ethics</Link></li>
                <li className="py-1.5"><Link to="/terms#sla" className="hover:text-emerald-600 transition-colors">SLA Disclaimers</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© 2026 Smart Civic AI Platform • Independent Mumbai Municipal Civic Technology Initiative.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
              <span>•</span>
              <Link to="/support" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA for seamless conversion */}
      <StickyMobileCta />
    </div>
  )
}


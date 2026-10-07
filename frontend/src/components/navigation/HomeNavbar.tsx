import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import {
  Clock,
  MapPin,
  Users,
  Scale,
  ShieldAlert,
  Coins,
  QrCode,
  CloudRain,
  ChevronDown,
  Download,
  ArrowRight,
  Menu,
  X,
  Globe,
  Check,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"
import LanguageSelector from "@/components/common/LanguageSelector"
import { useAuth } from "@/context/AuthContext"
import { usePWA } from "@/hooks/usePWA"

interface CivicPortalItem {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeColor?: string
  iconColor: string
  iconBg: string
}

const CIVIC_PORTALS: CivicPortalItem[] = [
  {
    title: "Elected Nagarsevaks",
    description: "227 Ward corporators, party affiliations & local offices",
    href: "/nagarsevak",
    icon: Users,
    badge: "24 Wards",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800",
  },
  {
    title: "RTS Statutory Radar",
    description: "Section 10 Right to Service 48h escalation & penalties",
    href: "/rts-radar",
    icon: Scale,
    badge: "Live SLA",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800",
  },
  {
    title: "Contractor Escrows",
    description: "Defect liability warranty locks & 3-strike registry",
    href: "/contractor-registry",
    icon: ShieldAlert,
    badge: "Escrow Pool",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800",
  },
  {
    title: "Ward Budget Voting",
    description: "Participatory citizen democracy for local civic projects",
    href: "/ward-budget",
    icon: Coins,
    badge: "Citizen Vote",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800",
  },
  {
    title: "Digital Road Passport",
    description: "MMC 64B QR inspection certificates & road history",
    href: "/road-passport",
    icon: QrCode,
    badge: "MMC 64B",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800",
  },
  {
    title: "Monsoon Flood Radar",
    description: "Real-time subway waterlogging, sensors & tidal alerts",
    href: "/monsoon-radar",
    icon: CloudRain,
    badge: "IMD Sensors",
    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300/40",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800",
  },
]

export default function HomeNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { canInstall, installApp } = usePWA()
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  const currentLanguage = i18n.language ? i18n.language.slice(0, 2) : "en"

  const setLanguage = (code: string) => {
    i18n.changeLanguage(code)
    try {
      localStorage.setItem("smart_civic_lang", code)
    } catch {
      // ignore
    }
  }

  const languages = [
    { code: "en", label: "English", short: "EN" },
    { code: "mr", label: "मराठी (Marathi)", short: "मराठी" },
    { code: "hi", label: "हिंदी (Hindi)", short: "हिंदी" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate(`/#${id}`)
    }
  }

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SC"

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-xs"
          : "border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            to="/"
            aria-label="Smart Civic AI Home"
          >
            <SmartCivicLogo className="w-8 h-8" />
            <div className="flex items-center">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Smart Civic
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-primary/10 text-primary border border-primary/25 tracking-wide">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links — 100% Consistent Typography & Hover States */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          <Link
            to="/track"
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-850/80 transition-colors whitespace-nowrap"
          >
            Track 48h SLA
          </Link>

          <Link
            to="/public-map"
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-850/80 transition-colors whitespace-nowrap"
          >
            Ward GIS Map
          </Link>

          {/* Civic Portals Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-850/80 transition-colors outline-none cursor-pointer group whitespace-nowrap">
              <span>Civic Portals</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={8}
              className="w-[560px] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[70]"
            >
              <div className="px-3 pt-1 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  Municipal Transparency &amp; Governance
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Statutory Act 2015
                </span>
              </div>
              <DropdownMenuSeparator className="mb-2 bg-slate-100 dark:bg-slate-800" />

              <div className="grid grid-cols-2 gap-1.5">
                {CIVIC_PORTALS.map((portal) => (
                  <DropdownMenuItem
                    key={portal.href}
                    asChild
                    className="p-2.5 rounded-xl cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/70 focus:bg-slate-100/80 dark:focus:bg-slate-800/70 transition-colors outline-none group"
                  >
                    <Link to={portal.href} className="flex items-start gap-2.5 w-full">
                      <div className={`p-2 rounded-lg ${portal.iconBg} ${portal.iconColor} shrink-0 mt-0.5 shadow-2xs`}>
                        <portal.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                            {portal.title}
                          </span>
                          {portal.badge && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${portal.badgeColor}`}>
                              {portal.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
                          {portal.description}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 px-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  BMC 24x7 Helpline: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">1916</strong>
                </span>
                <Link
                  to="/public-map"
                  className="text-primary hover:underline font-medium flex items-center gap-0.5"
                >
                  View 24-Ward GIS Grid ↗
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-850/80 transition-colors cursor-pointer whitespace-nowrap"
          >
            How It Works
          </button>
        </nav>

        {/* Right Action Utilities & Auth — Perfectly Aligned & Styled */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Elegant Compact Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none cursor-pointer border border-slate-200/90 dark:border-slate-800">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="uppercase">{currentLanguage}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-44 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg z-[70]"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    currentLanguage === lang.code
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{lang.label}</span>
                  {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Visual Divider */}
          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Auth Action State */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="h-9 px-4 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all active:scale-[0.98]"
              >
                <Link to="/dashboard" className="flex items-center gap-1.5">
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>

              <Link
                to="/settings"
                title={`${user.name || "User"} (${user.role || "Citizen"})`}
                className="rounded-lg hover:ring-2 hover:ring-primary/40 transition-all"
              >
                <Avatar className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800">
                  <AvatarFallback className="text-xs font-bold font-mono bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                variant="ghost"
                className="h-9 px-3.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Link to="/auth">Sign In</Link>
              </Button>

              <Button
                asChild
                className="h-9 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Link to="/auth">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Full Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl shadow-xl overflow-hidden"
          >
            <div className="px-4 py-5 space-y-5 max-h-[calc(100dvh-4rem)] overflow-y-auto">
              {/* Language Switcher in Mobile Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Select Language / भाषा:
                </span>
                <LanguageSelector />
              </div>

              {/* Fast Direct Access */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 pb-1">
                  Fast Civic Access
                </p>
                <Link
                  to="/track"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>Track 48h Grievance SLA</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/public-map"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>24-Ward GIS Heatmap</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Institutional Portals Grid */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 pb-1">
                  Institutional Civic Portals
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CIVIC_PORTALS.map((portal) => (
                    <Link
                      key={portal.href}
                      to={portal.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${portal.iconBg} ${portal.iconColor} shrink-0`}>
                        <portal.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {portal.title}
                          </span>
                          {portal.badge && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${portal.badgeColor}`}>
                              {portal.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {portal.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Page Section Jumps */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 pb-2">
                  Quick Page Jumps
                </p>
                <div className="flex flex-wrap gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => scrollToSection("how-it-works")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    How It Works
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("proof-showcase")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    Resolution Proofs
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("faq")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    FAQs
                  </button>
                </div>
              </div>

              {/* App Install in Mobile */}
              {canInstall && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      installApp()
                    }}
                    className="w-full justify-center gap-2 h-10 text-xs font-semibold rounded-xl border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Install Smart Civic Mobile App (PWA)</span>
                  </Button>
                </div>
              )}

              {/* Mobile Auth CTAs */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {isAuthenticated && user ? (
                  <Button
                    asChild
                    className="w-full h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm"
                  >
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <span>Go to Citizen Command Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800"
                    >
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="h-10 text-xs font-semibold rounded-xl bg-blue-600 text-white"
                    >
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Municipal Helpline Footer Note */}
              <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                Official BMC Emergency Helpline: <strong className="text-emerald-600 dark:text-emerald-400">1916</strong> (24x7 Toll-Free)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

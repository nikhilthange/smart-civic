import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Award,
  Gift,
  Check,
  Copy,
  Loader2,
  CheckCircle2,
  Lock,
  Ticket,
  Zap,
  TrendingUp,
  Search,
  ShieldCheck,
  QrCode,
  Sparkle,
  BadgePercent,
  Compass,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"
import { triggerHapticFeedback } from "@/utils/haptics"

// ─── Custom Vector Logos for Municipal Partners ─────────────────────────────

export const BestLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-red-900 p-1.5 shadow-md shadow-red-900/30 flex items-center justify-center overflow-hidden border border-red-400/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
      {/* BEST Iconic Shield Outline */}
      <path
        d="M50 8 L85 22 V52 C85 72 50 92 50 92 C50 92 15 72 15 52 V22 Z"
        fill="#991B1B"
        stroke="#FCD34D"
        strokeWidth="3.5"
      />
      {/* Gold Inner Wing Pattern */}
      <path
        d="M50 14 L78 26 V48 C78 64 50 82 50 82 C50 82 22 64 22 48 V26 Z"
        fill="#DC2626"
        stroke="#FDE68A"
        strokeWidth="1.5"
      />
      {/* Electric Lightning Bolt */}
      <path
        d="M54 22 L38 46 H48 L44 68 L64 42 H52 Z"
        fill="#FBBF24"
        stroke="#78350F"
        strokeWidth="1"
        className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      />
      {/* Red Electric Bus Silhouette */}
      <rect x="34" y="66" width="32" height="14" rx="3" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
      <circle cx="41" cy="80" r="2.5" fill="#1F2937" />
      <circle cx="59" cy="80" r="2.5" fill="#1F2937" />
      {/* Bold BEST Typography */}
      <text
        x="50"
        y="42"
        textAnchor="middle"
        fill="#FFFFFF"
        fontWeight="900"
        fontSize="17"
        fontFamily="sans-serif"
        letterSpacing="1"
        className="drop-shadow-md"
      >
        BEST
      </text>
    </svg>
  </div>
)

export const MetroLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-600 p-1.5 shadow-md shadow-amber-900/30 flex items-center justify-center overflow-hidden border border-yellow-300/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
      <circle cx="50" cy="50" r="42" fill="#B91C1C" stroke="#FDE047" strokeWidth="4" />
      <circle cx="50" cy="50" r="34" fill="#DC2626" />
      {/* Streamlined Metro Train Front */}
      <path
        d="M32 30 C32 24 38 20 50 20 C62 20 68 24 68 30 V62 C68 68 62 70 50 70 C38 70 32 68 32 62 Z"
        fill="#FFFFFF"
        stroke="#7F1D1D"
        strokeWidth="2"
      />
      {/* Windshield */}
      <path d="M37 28 C37 25 41 24 50 24 C59 24 63 25 63 28 V40 H37 Z" fill="#0284C7" />
      {/* Twin Headlights */}
      <circle cx="40" cy="58" r="3" fill="#FACC15" />
      <circle cx="60" cy="58" r="3" fill="#FACC15" />
      <rect x="44" y="62" width="12" height="3" rx="1" fill="#DC2626" />
      {/* MMMOCL Metro Rails */}
      <path d="M26 84 L44 74 M74 84 L56 74" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
    </svg>
  </div>
)

export const LibraryLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-1.5 shadow-md shadow-emerald-950/40 flex items-center justify-center overflow-hidden border border-emerald-400/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
      {/* Greek / Asiatic Library Pillars */}
      <path d="M22 34 L50 16 L78 34 Z" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
      <rect x="20" y="34" width="60" height="5" rx="1" fill="#D97706" />
      <rect x="26" y="39" width="6" height="30" rx="1" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
      <rect x="40" y="39" width="6" height="30" rx="1" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
      <rect x="54" y="39" width="6" height="30" rx="1" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
      <rect x="68" y="39" width="6" height="30" rx="1" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
      <rect x="18" y="69" width="64" height="6" rx="1" fill="#D97706" />
      {/* Open Book In Gold */}
      <path
        d="M28 84 C38 80 48 82 50 86 C52 82 62 80 72 84 V74 C62 70 52 72 50 76 C48 72 38 70 28 74 Z"
        fill="#34D399"
        stroke="#064E3B"
        strokeWidth="1.5"
      />
    </svg>
  </div>
)

export const TreeLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 p-1.5 shadow-md shadow-emerald-900/30 flex items-center justify-center overflow-hidden border border-emerald-300/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
      {/* GPS Geo-Tag Outer Pulse Ring */}
      <circle cx="50" cy="50" r="42" stroke="#6EE7B7" strokeWidth="2.5" strokeDasharray="6 4" />
      {/* Shield Base */}
      <path
        d="M50 16 L76 28 V52 C76 68 50 84 50 84 C50 84 24 68 24 52 V28 Z"
        fill="#059669"
        stroke="#A7F3D0"
        strokeWidth="2"
      />
      {/* Banyan Tree Foliage */}
      <circle cx="50" cy="40" r="14" fill="#34D399" />
      <circle cx="40" cy="44" r="11" fill="#10B981" />
      <circle cx="60" cy="44" r="11" fill="#10B981" />
      <rect x="47" y="48" width="6" height="18" rx="2" fill="#78350F" />
      {/* GPS Location Pin Marker */}
      <path
        d="M50 64 C47 64 45 66 45 69 C45 73 50 78 50 78 C50 78 55 73 55 69 C55 66 53 64 50 64 Z"
        fill="#FBBF24"
      />
    </svg>
  </div>
)

export const PoolLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-blue-900 p-1.5 shadow-md shadow-cyan-950/30 flex items-center justify-center overflow-hidden border border-cyan-300/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
      <circle cx="50" cy="50" r="40" fill="#0891B2" stroke="#67E8F9" strokeWidth="3" />
      {/* Olympic Wave Swirls */}
      <path
        d="M20 62 C30 54 40 68 50 62 C60 56 70 68 80 62"
        stroke="#A5F3FC"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20 74 C30 66 40 80 50 74 C60 68 70 80 80 74"
        stroke="#ECFEFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Swimmer Medallion */}
      <circle cx="58" cy="34" r="5" fill="#FDE047" />
      <path
        d="M36 44 L48 40 L58 43 L70 38"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M48 40 L44 54" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
)

interface PerkItem {
  id: string
  title: string
  category: "Transit" | "Culture" | "Sports" | "Eco"
  pointsCost: number
  description: string
  partner: string
  logoComponent: React.ComponentType
  tag: string
}

const MUNICIPAL_PERKS: PerkItem[] = [
  {
    id: "metro_100",
    title: "Mumbai Metro Card ₹100 Recharge",
    category: "Transit",
    pointsCost: 50,
    description: "Instant top-up voucher valid across Metro Lines 1, 2A, 7 & 3.",
    partner: "Maha Mumbai Metro (MMMOCL)",
    logoComponent: MetroLogo,
    tag: "High Popularity",
  },
  {
    id: "library_pass",
    title: "BMC Central Library 1-Year Pass",
    category: "Culture",
    pointsCost: 80,
    description: "Full access to historic Asiatic Society & Mumbai Central Public libraries.",
    partner: "BMC Education & Culture Dept",
    logoComponent: LibraryLogo,
    tag: "Civic Heritage",
  },
  {
    id: "tree_cert",
    title: "Official BMC Tree Plantation & Geo-Tag",
    category: "Eco",
    pointsCost: 120,
    description: "Plant a native sapling in your ward with official certificate & GPS tracking.",
    partner: "Mumbai Tree Authority (PRD)",
    logoComponent: TreeLogo,
    tag: "Green Mumbai",
  },
  {
    id: "pool_pass",
    title: "Municipal Olympic Pool Weekend Pass",
    category: "Sports",
    pointsCost: 150,
    description: "Complimentary access to Shivaji Park / Chembur Olympic Sports Complex.",
    partner: "BMC Sports & Recreation",
    logoComponent: PoolLogo,
    tag: "Wellness Pass",
  },
  {
    id: "best_pass",
    title: "BEST AC Bus 3-Day Unlimited Pass",
    category: "Transit",
    pointsCost: 200,
    description: "Unlimited electric AC bus travel across South & Suburban Mumbai.",
    partner: "BEST Undertaking",
    logoComponent: BestLogo,
    tag: "Clean Mobility",
  },
]

const CATEGORIES = ["All", "Transit", "Eco", "Culture", "Sports"]

export default function KarmaRewards() {
  const { user, updateUserKarma, refreshUserProfile } = useAuth()
  const [karmaPoints, setKarmaPoints] = useState<number>(user?.karmaPoints ?? 0)
  const [redeemedList, setRedeemedList] = useState<any[]>(user?.redeemedRewards || [])
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null)
  const [activeVoucherModal, setActiveVoucherModal] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Keep local state in sync if user karma or vouchers update in AuthContext
  useEffect(() => {
    if (typeof user?.karmaPoints === "number") {
      setKarmaPoints(user.karmaPoints)
    }
    if (user?.redeemedRewards) {
      setRedeemedList(user.redeemedRewards)
    }
  }, [user?.karmaPoints, user?.redeemedRewards])

  // Fetch latest user profile state on mount
  useEffect(() => {
    refreshUserProfile()
  }, [refreshUserProfile])

  const handleRedeem = async (perk: PerkItem) => {
    if (karmaPoints < perk.pointsCost) {
      triggerHapticFeedback("warning")
      toast.error(`You need ${perk.pointsCost - karmaPoints} more karma points to redeem this perk!`)
      return
    }

    triggerHapticFeedback("medium")
    setIsRedeeming(perk.id)
    try {
      const res = await api.post("/auth/redeem-reward", {
        rewardId: perk.id,
        title: perk.title,
        pointsCost: perk.pointsCost,
      })

      triggerHapticFeedback("success")
      toast.success(res.data.message || "Perk redeemed successfully! 🎉")
      const newPoints = typeof res.data.remainingPoints === "number" ? res.data.remainingPoints : karmaPoints - perk.pointsCost
      setKarmaPoints(newPoints)
      updateUserKarma(newPoints)
      if (res.data.voucher) {
        setRedeemedList((prev) => [res.data.voucher, ...prev])
        setActiveVoucherModal(res.data.voucher)
      }
    } catch (err: any) {
      triggerHapticFeedback("error")
      toast.error(err.response?.data?.message || "Failed to redeem reward.")
    } finally {
      setIsRedeeming(null)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    triggerHapticFeedback("light")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Voucher code copied to clipboard!")
  }

  // Pre-calculate Badge Statuses and Tier thresholds
  const allBadges = useMemo(
    () => [
      {
        name: "First Responder",
        icon: "🥉",
        level: "Bronze Tier",
        description: "Submitted your first verified civic issue report",
        threshold: 0,
        unlocked: true,
      },
      {
        name: "Ward Guardian",
        icon: "🥈",
        level: "Silver Tier",
        description: "Safeguarded neighborhood with 50+ Karma Points",
        threshold: 50,
        unlocked: karmaPoints >= 50,
      },
      {
        name: "Mumbai Civic Hero",
        icon: "🥇",
        level: "Gold Tier",
        description: "Top civic champion with 150+ Karma Points",
        threshold: 150,
        unlocked: karmaPoints >= 150,
      },
    ],
    [karmaPoints]
  )

  // Next Milestone tier computation
  const nextMilestone = useMemo(() => {
    if (karmaPoints < 50) {
      return { name: "Ward Guardian (Silver)", target: 50, remaining: 50 - karmaPoints, progress: Math.min(100, Math.round((karmaPoints / 50) * 100)) }
    } else if (karmaPoints < 150) {
      return { name: "Mumbai Civic Hero (Gold)", target: 150, remaining: 150 - karmaPoints, progress: Math.min(100, Math.round(((karmaPoints - 50) / 100) * 100)) }
    } else {
      return { name: "Supreme Civic Champion", target: 150, remaining: 0, progress: 100 }
    }
  }, [karmaPoints])

  // Filtered Perks
  const filteredPerks = useMemo(() => {
    return MUNICIPAL_PERKS.filter((perk) => {
      const matchCategory = selectedCategory === "All" || perk.category === selectedCategory
      const matchQuery =
        perk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perk.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perk.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [selectedCategory, searchQuery])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-8 pb-16 w-full"
    >
      {/* ─── Hero Banner with Glassmorphic Ambient Aura ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white p-6 sm:p-8 shadow-sm border border-zinc-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span>Municipal Civic Citizen Recognition</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Civic Badges & Karma Recognition
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Earn Civic Karma by resolving neighborhood issues and verifying ground resolutions. Redeem points for authentic Mumbai municipal benefits.
            </p>

            {/* Next Milestone Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  {nextMilestone.remaining > 0 ? (
                    <>
                      Next Milestone: <strong className="text-white">{nextMilestone.name}</strong>
                    </>
                  ) : (
                    <strong className="text-emerald-400">Highest Civic Recognition Achieved</strong>
                  )}
                </span>
                {nextMilestone.remaining > 0 && (
                  <span className="font-mono text-emerald-400">{nextMilestone.remaining} pts needed</span>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${nextMilestone.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Karma Points Display Card */}
          <div
            className="bg-zinc-950/70 rounded-xl p-5 sm:p-6 border border-zinc-800 text-center w-full lg:w-auto lg:min-w-[220px] shadow-sm"
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Civic Karma Balance
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-zinc-100 font-mono tracking-tight tabular-nums">
                  {karmaPoints}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Top {karmaPoints > 500 ? "5%" : "15%"} active contributor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Badges Showcase ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Your Unlocked Civic Badges
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official BMC digital recognition tiers based on your municipal impact
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-amber-300/60 text-amber-700 dark:text-amber-400 hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Verified Credentials
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.015 }}
              transition={{ duration: 0.25, delay: idx * 0.08 }}
            >
              <Card
                className={`transition-all duration-300 h-full relative overflow-hidden ${
                  badge.unlocked
                    ? "bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-500/40 shadow-md hover:shadow-xl hover:shadow-amber-500/10"
                    : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 grayscale-[40%]"
                }`}
              >
                {badge.unlocked && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                    <div className="absolute transform rotate-45 bg-amber-400 text-[9px] font-extrabold text-amber-950 py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-xs">
                      ACTIVE
                    </div>
                  </div>
                )}
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="text-3xl sm:text-4xl p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-700/40 shrink-0 select-none shadow-xs">
                    {badge.icon}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {badge.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        {badge.level}
                      </span>
                      {badge.unlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Unlocks at {badge.threshold} pts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Municipal Perks Catalogue with Category Filters & Search ─── */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Redeem Municipal Perks & Vouchers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Redeem your hard-earned Karma for real-world benefits across Mumbai
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search perks or partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Filter Tabs with Animated Active Slider */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 ${
                  isActive
                    ? "text-emerald-950 dark:text-emerald-200 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-emerald-200/50 dark:border-slate-700"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {cat === "All" && <Compass className="w-3.5 h-3.5" />}
                  {cat === "Transit" && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                  {cat === "Eco" && <Sparkle className="w-3.5 h-3.5 text-emerald-500" />}
                  {cat === "Culture" && <Award className="w-3.5 h-3.5 text-indigo-500" />}
                  {cat === "Sports" && <BadgePercent className="w-3.5 h-3.5 text-cyan-500" />}
                  {cat}
                </span>
              </button>
            )
          })}
        </div>

        {/* Perks Grid */}
        <AnimatePresence mode="popLayout">
          {filteredPerks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No perks found</h4>
              <p className="text-xs text-slate-500">Try changing your search query or filter category.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("All")
                  setSearchQuery("")
                }}
                className="text-xs rounded-xl"
              >
                Reset Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPerks.map((perk, idx) => {
                const canAfford = karmaPoints >= perk.pointsCost
                const progressPct = Math.min(100, Math.round((karmaPoints / perk.pointsCost) * 100))
                const Logo = perk.logoComponent

                return (
                  <motion.div
                    key={perk.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="h-full"
                  >
                    <Card
                      className={`flex flex-col justify-between h-full border rounded-3xl transition-all duration-300 relative overflow-hidden group ${
                        canAfford
                          ? "border-emerald-400/80 dark:border-emerald-600/60 bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500"
                          : "border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg"
                      }`}
                    >
                      {/* Top glowing accent on unlockable card */}
                      {canAfford && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 animate-pulse" />
                      )}

                      <CardHeader className="pb-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <Logo />
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge
                              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-xl shadow-xs transition-colors ${
                                canAfford
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {perk.pointsCost} PTS
                            </Badge>
                            {canAfford ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-bounce-subtle">
                                <Zap className="w-2.5 h-2.5 fill-current" /> Ready
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                {progressPct}% earned
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                              {perk.tag}
                            </span>
                          </div>
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {perk.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {perk.partner}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-0">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px]">
                          {perk.description}
                        </p>

                        {/* Animated Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>Karma Progress</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {karmaPoints} / {perk.pointsCost} PTS
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                canAfford
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <Button
                          onClick={() => handleRedeem(perk)}
                          disabled={!canAfford || isRedeeming === perk.id}
                          className={`w-full font-bold text-xs gap-1.5 min-h-[44px] rounded-xl transition-all duration-200 shadow-sm ${
                            canAfford
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white shadow-emerald-600/20 cursor-pointer"
                              : "bg-slate-100 dark:bg-slate-800/90 text-slate-400 border border-slate-200 dark:border-slate-700/80 cursor-not-allowed"
                          }`}
                        >
                          {isRedeeming === perk.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Redeeming Voucher...
                            </>
                          ) : canAfford ? (
                            <>
                              <Ticket className="w-3.5 h-3.5" />
                              Redeem for {perk.pointsCost} Karma
                            </>
                          ) : (
                            `Need ${perk.pointsCost - karmaPoints} More Pts`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Previously Redeemed Vouchers ─── */}
      {redeemedList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Your Redeemed Perk Vouchers ({redeemedList.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Present code at counter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redeemedList.map((voucher, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {voucher.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Redeemed on: {new Date(voucher.redeemedAt || Date.now()).toLocaleDateString("en-IN")}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block font-mono text-xs font-extrabold bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 select-all">
                      {voucher.voucherCode}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(voucher.voucherCode)}
                  className="w-full sm:w-auto shrink-0 text-xs gap-1.5 border-emerald-300 text-emerald-800 dark:text-emerald-300 min-h-[38px] rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── High-Fidelity Voucher Redemption Ticket Modal ─── */}
      <AnimatePresence>
        {activeVoucherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-slate-900 w-[94%] max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center relative overflow-hidden"
            >
              {/* Confetti / celebration badge */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-4xl"
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
                    🎉
                  </div>
                </motion.div>
              </div>

              <div>
                <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow-xs">
                  Voucher Generated Successfully
                </Badge>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2.5">
                  {activeVoucherModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Present this digital voucher code at any official counter or redeem in the partner app.
                </p>
              </div>

              {/* Digital Pass Aesthetic Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/40 dark:from-slate-800/80 dark:to-emerald-950/20 border-2 border-dashed border-emerald-400 space-y-3 relative">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Official Municipal Voucher Pass
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-700 dark:text-emerald-400 select-all">
                  {activeVoucherModal.voucherCode}
                </div>

                {/* Dynamic Barcode Graphic */}
                <div className="flex justify-center items-center gap-1 pt-1 opacity-70">
                  {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 5, 2, 6, 4, 3, 6, 2, 5, 8, 3].map((h, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800 dark:bg-slate-200 rounded-xs"
                      style={{ width: `${(idx % 3) + 1.5}px`, height: `${h * 3 + 10}px` }}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(activeVoucherModal.voucherCode)}
                  className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied to Clipboard!" : "Copy Voucher Code"}
                </Button>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/25 cursor-pointer"
                onClick={() => setActiveVoucherModal(null)}
              >
                Done & Return to Rewards
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Gift, Sparkles, Check, Copy, Loader2, CheckCircle2, Lock, Ticket, Zap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"

// ─── Custom Vector Logos for Municipal Partners ─────────────────────────────

export const BestLogo = () => (
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-red-900 p-1.5 shadow-md shadow-red-900/30 flex items-center justify-center overflow-hidden border border-red-400/40 group-hover:scale-105 transition-transform duration-300">
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
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-600 p-1.5 shadow-md shadow-amber-900/30 flex items-center justify-center overflow-hidden border border-yellow-300/40 group-hover:scale-105 transition-transform duration-300">
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
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-1.5 shadow-md shadow-emerald-950/40 flex items-center justify-center overflow-hidden border border-emerald-400/40 group-hover:scale-105 transition-transform duration-300">
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
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 p-1.5 shadow-md shadow-emerald-900/30 flex items-center justify-center overflow-hidden border border-emerald-300/40 group-hover:scale-105 transition-transform duration-300">
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
  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-blue-900 p-1.5 shadow-md shadow-cyan-950/30 flex items-center justify-center overflow-hidden border border-cyan-300/40 group-hover:scale-105 transition-transform duration-300">
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
  category: string
  pointsCost: number
  description: string
  partner: string
  logoComponent: React.ComponentType
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
  },
  {
    id: "library_pass",
    title: "BMC Central Library 1-Year Pass",
    category: "Culture",
    pointsCost: 80,
    description: "Full access to historic Asiatic Society & Mumbai Central Public libraries.",
    partner: "BMC Education & Culture Dept",
    logoComponent: LibraryLogo,
  },
  {
    id: "tree_cert",
    title: "Official BMC Tree Plantation & Geo-Tag",
    category: "Eco",
    pointsCost: 120,
    description: "Plant a native sapling in your ward with official certificate & GPS tracking.",
    partner: "Mumbai Tree Authority (PRD)",
    logoComponent: TreeLogo,
  },
  {
    id: "pool_pass",
    title: "Municipal Olympic Pool Weekend Pass",
    category: "Sports",
    pointsCost: 150,
    description: "Complimentary access to Shivaji Park / Chembur Olympic Sports Complex.",
    partner: "BMC Sports & Recreation",
    logoComponent: PoolLogo,
  },
  {
    id: "best_pass",
    title: "BEST AC Bus 3-Day Unlimited Pass",
    category: "Transit",
    pointsCost: 200,
    description: "Unlimited electric AC bus travel across South & Suburban Mumbai.",
    partner: "BEST Undertaking",
    logoComponent: BestLogo,
  },
]

export default function KarmaRewards() {
  const { user, updateUserKarma, refreshUserProfile } = useAuth()
  const [karmaPoints, setKarmaPoints] = useState<number>(user?.karmaPoints ?? 0)
  const [redeemedList, setRedeemedList] = useState<any[]>(user?.redeemedRewards || [])
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null)
  const [activeVoucherModal, setActiveVoucherModal] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

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
      toast.error(`You need ${perk.pointsCost - karmaPoints} more karma points to redeem this perk!`)
      return
    }

    setIsRedeeming(perk.id)
    try {
      const res = await api.post("/auth/redeem-reward", {
        rewardId: perk.id,
        title: perk.title,
        pointsCost: perk.pointsCost,
      })

      toast.success(res.data.message || "Perk redeemed successfully!")
      const newPoints = typeof res.data.remainingPoints === "number" ? res.data.remainingPoints : karmaPoints - perk.pointsCost
      setKarmaPoints(newPoints)
      updateUserKarma(newPoints)
      if (res.data.voucher) {
        setRedeemedList((prev) => [res.data.voucher, ...prev])
        setActiveVoucherModal(res.data.voucher)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to redeem reward.")
    } finally {
      setIsRedeeming(null)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Voucher code copied to clipboard!")
  }

  // Pre-calculate Badge Statuses
  const allBadges = [
    {
      name: "First Responder",
      icon: "🥉",
      level: "Bronze Tier",
      description: "Submitted your first verified civic issue",
      unlocked: true,
    },
    {
      name: "Ward Guardian",
      icon: "🥈",
      level: "Silver Tier",
      description: "Safeguarded neighborhood with 50+ Karma Points",
      unlocked: karmaPoints >= 50,
    },
    {
      name: "Mumbai Civic Hero",
      icon: "🥇",
      level: "Gold Tier",
      description: "Top civic champion with 150+ Karma Points",
      unlocked: karmaPoints >= 150,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-10 shadow-2xl border border-emerald-700/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 gap-1.5 py-1 px-3">
              <Sparkles className="w-3.5 h-3.5" />
              Municipal Citizen Rewards
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Civic Hero Badges & Karma Perks
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Earn Civic Karma by reporting valid neighborhood issues and verifying ground resolutions. Redeem your points for exclusive Mumbai municipal perks.
            </p>
          </div>

          {/* Karma Points Display Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 text-center w-full sm:w-auto sm:min-w-[200px] shadow-inner">
            <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold">Your Available Karma</span>
            <div className="text-3xl sm:text-5xl font-black text-amber-300 mt-1 font-mono">
              {karmaPoints} <span className="text-lg font-bold text-white">PTS</span>
            </div>
            <p className="text-[11px] text-emerald-200 mt-1.5">
              +10 pts per ticket • +5 pts per upvote
            </p>
          </div>
        </div>
      </div>

      {/* ── Badges Showcase ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Your Unlocked Civic Badges
            </h2>
            <p className="text-xs text-slate-500">Official BMC digital recognition tiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.015 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`transition-all duration-300 h-full ${
                  badge.unlocked
                    ? "bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-600/50 shadow-md hover:shadow-lg"
                    : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="text-3xl sm:text-4xl p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-700/40 shrink-0 select-none">
                    {badge.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{badge.name}</h3>
                      {badge.unlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">{badge.level}</p>
                    <p className="text-xs text-slate-500 leading-tight">{badge.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Municipal Perks Catalogue ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Redeem Municipal Perks & Vouchers
          </h2>
          <p className="text-xs text-slate-500">Redeem your hard-earned Karma for real-world benefits across Mumbai</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {MUNICIPAL_PERKS.map((perk) => {
            const canAfford = karmaPoints >= perk.pointsCost
            const progressPct = Math.min(100, Math.round((karmaPoints / perk.pointsCost) * 100))
            const Logo = perk.logoComponent

            return (
              <motion.div
                key={perk.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <Card
                  className={`flex flex-col justify-between h-full border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    canAfford
                      ? "border-emerald-400/80 dark:border-emerald-600/80 bg-white dark:bg-slate-900 shadow-md shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-500"
                      : "border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                  }`}
                >
                  {/* Glowing accent border for unlockable items */}
                  {canAfford && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
                  )}

                  <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="group">
                        <Logo />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge
                          className={`font-mono font-bold text-xs px-2.5 py-1 shadow-xs ${
                            canAfford
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {perk.pointsCost} PTS
                        </Badge>
                        {canAfford ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
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
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {perk.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Partner: {perk.partner}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px]">
                      {perk.description}
                    </p>

                    {/* Animated Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Karma Progress</span>
                        <span>{karmaPoints} / {perk.pointsCost} PTS</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            canAfford ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
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
                      className={`w-full font-bold text-xs gap-1.5 min-h-[44px] rounded-xl transition-all duration-200 ${
                        canAfford
                          ? "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-md shadow-emerald-600/20 cursor-pointer"
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
      </div>

      {/* ── Previously Redeemed Vouchers ── */}
      {redeemedList.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-600" />
            Your Redeemed Perk Vouchers ({redeemedList.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redeemedList.map((voucher, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {voucher.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Redeemed on: {new Date(voucher.redeemedAt || Date.now()).toLocaleDateString("en-IN")}
                  </p>
                  <span className="inline-block mt-2 font-mono text-xs font-extrabold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    {voucher.voucherCode}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(voucher.voucherCode)}
                  className="w-full sm:w-auto shrink-0 text-xs gap-1 border-emerald-300 text-emerald-800 dark:text-emerald-300 min-h-[38px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      <AnimatePresence>
        {activeVoucherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 w-[92%] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center relative"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-3xl shadow-inner">
                🎉
              </div>
              <div>
                <Badge className="bg-emerald-600 text-white text-xs px-3 py-1">Voucher Generated Successfully</Badge>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2.5">
                  {activeVoucherModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Present this digital voucher code at any official counter or scan into the partner app.
                </p>
              </div>

              {/* Voucher Code Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-emerald-400 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Your Unique Voucher Code</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-700 dark:text-emerald-400 select-all">
                  {activeVoucherModal.voucherCode}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(activeVoucherModal.voucherCode)}
                  className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Voucher Code"}
                </Button>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl cursor-pointer"
                onClick={() => setActiveVoucherModal(null)}
              >
                Done & Return
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

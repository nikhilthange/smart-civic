import { useState, useEffect } from "react"
import { Award, Gift, Sparkles, Check, Copy, Loader2, ShieldCheck, Ticket } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface PerkItem {
  id: string
  title: string
  category: string
  pointsCost: number
  description: string
  partner: string
  icon: string
}

const MUNICIPAL_PERKS: PerkItem[] = [
  {
    id: "metro_100",
    title: "Mumbai Metro Card ₹100 Recharge",
    category: "Transit",
    pointsCost: 50,
    description: "Instant top-up voucher valid across Metro Lines 1, 2A, 7 & 3.",
    partner: "Maha Mumbai Metro (MMMOCL)",
    icon: "🚇",
  },
  {
    id: "library_pass",
    title: "BMC Central Library 1-Year Pass",
    category: "Culture",
    pointsCost: 80,
    description: "Full access to historic Asiatic Society & Mumbai Central Public libraries.",
    partner: "BMC Education & Culture Dept",
    icon: "📚",
  },
  {
    id: "tree_cert",
    title: "Official BMC Tree Plantation & Geo-Tag",
    category: "Eco",
    pointsCost: 120,
    description: "Plant a native sapling in your ward with official certificate & GPS tracking.",
    partner: "Mumbai Tree Authority (PRD)",
    icon: "🌳",
  },
  {
    id: "pool_pass",
    title: "Municipal Olympic Pool Weekend Pass",
    category: "Sports",
    pointsCost: 150,
    description: "Complimentary access to Shivaji Park / Chembur Olympic Sports Complex.",
    partner: "BMC Sports & Recreation",
    icon: "🏊",
  },
  {
    id: "best_pass",
    title: "BEST AC Bus 3-Day Unlimited Pass",
    category: "Transit",
    pointsCost: 200,
    description: "Unlimited electric AC bus travel across South & Suburban Mumbai.",
    partner: "BEST Undertaking",
    icon: "🚌",
  },
]

export default function KarmaRewards() {
  const { user } = useAuth()
  const [karmaPoints, setKarmaPoints] = useState<number>(user?.karmaPoints || 65)
  const [redeemedList, setRedeemedList] = useState<any[]>((user as any)?.redeemedRewards || [])
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null)
  const [activeVoucherModal, setActiveVoucherModal] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch latest user profile state
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        if (res.data.user) {
          setKarmaPoints(res.data.user.karmaPoints || 0)
          setRedeemedList(res.data.user.redeemedRewards || [])
        }
      })
      .catch(() => {})
  }, [])

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
      setKarmaPoints(res.data.remainingPoints)
      setRedeemedList((prev) => [res.data.voucher, ...prev])
      setActiveVoucherModal(res.data.voucher)
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-indigo-700/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 gap-1.5 py-1 px-3">
              <Sparkles className="w-3.5 h-3.5" />
              Municipal Citizen Rewards
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Civic Hero Badges & Karma Perks
            </h1>
            <p className="text-indigo-200 text-sm max-w-xl">
              Earn Civic Karma by reporting valid neighborhood issues and verifying ground resolutions. Redeem your points for exclusive Mumbai municipal perks.
            </p>
          </div>

          {/* Karma Points Display Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[200px] shadow-inner">
            <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold">Your Available Karma</span>
            <div className="text-4xl sm:text-5xl font-black text-amber-300 mt-1 font-mono">
              {karmaPoints} <span className="text-lg font-bold text-white">PTS</span>
            </div>
            <p className="text-[11px] text-indigo-200 mt-1.5">
              +10 pts per ticket • +5 pts per upvote
            </p>
          </div>
        </div>
      </div>

      {/* ── Badges Showcase ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Your Unlocked Civic Badges
            </h2>
            <p className="text-xs text-slate-500">Official BMC digital recognition tiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allBadges.map((badge, idx) => (
            <Card
              key={idx}
              className={`transition-all duration-300 ${
                badge.unlocked
                  ? "border-amber-300 dark:border-amber-700 bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-md scale-[1.01]"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60"
              }`}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-5xl mx-auto drop-shadow-sm">{badge.icon}</div>
                <div>
                  <Badge variant="outline" className={badge.unlocked ? "border-amber-400 text-amber-700 dark:text-amber-300 font-bold" : ""}>
                    {badge.level}
                  </Badge>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {badge.description}
                  </p>
                </div>
                <div className="pt-2 text-xs font-bold">
                  {badge.unlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Unlocked & Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Locked (Reach tier threshold)</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Rewards Shop ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Municipal Partner Perks Store
          </h2>
          <p className="text-xs text-slate-500">Redeem your hard-earned Karma for real-world benefits across Mumbai</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MUNICIPAL_PERKS.map((perk) => {
            const canAfford = karmaPoints >= perk.pointsCost
            return (
              <Card
                key={perk.id}
                className="flex flex-col justify-between hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-3xl p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                      {perk.icon}
                    </div>
                    <Badge className="bg-indigo-600 text-white font-mono font-bold text-xs px-2.5 py-1">
                      {perk.pointsCost} PTS
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    {perk.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Partner: {perk.partner}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {perk.description}
                  </p>

                  <Button
                    onClick={() => handleRedeem(perk)}
                    disabled={!canAfford || isRedeeming === perk.id}
                    className={`w-full font-bold text-xs gap-1.5 ${
                      canAfford
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isRedeeming === perk.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Redeeming...
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redeemedList.map((voucher, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-4"
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
                  className="shrink-0 text-xs gap-1 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {activeVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center">
            <div className="text-5xl mx-auto">🎉</div>
            <div>
              <Badge className="bg-emerald-600 text-white text-xs">Voucher Generated Successfully</Badge>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {activeVoucherModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Present this voucher code at any official counter or scan into the partner app.
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-indigo-400 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Your Unique Voucher Code</span>
              <div className="text-2xl font-black font-mono tracking-widest text-indigo-700 dark:text-indigo-400">
                {activeVoucherModal.voucherCode}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyCode(activeVoucherModal.voucherCode)}
                className="gap-1.5 text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Voucher Code"}
              </Button>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={() => setActiveVoucherModal(null)}
            >
              Done & Return
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

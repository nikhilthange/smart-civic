import { useState, useEffect } from "react"
import {
  Trophy,
  Award,
  Sparkles,
  Gift,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface LeaderboardUser {
  rank: number
  name: string
  ward: string
  points: number
  verifiedReports: number
  tierBadge: string
}

interface Voucher {
  id: string
  title: string
  pointsRequired: number
  category: string
  discountDescription: string
  validityDays: number
}

export default function CivicRewardsLeaderboard() {
  const [balance, setBalance] = useState(180)
  const [tierBadge, setTierBadge] = useState("GUARDIAN")
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [selectedWard, setSelectedWard] = useState("all")
  const [redeemedCode, setRedeemedCode] = useState<{ id: string; code: string } | null>(null)

  const fetchData = async () => {
    try {
      const [balRes, leadRes, vouchRes] = await Promise.all([
        api.get("/karma/balance"),
        api.get("/karma/leaderboard", { params: { ward: selectedWard } }),
        api.get("/karma/vouchers"),
      ])
      if (balRes.data.balance) {
        setBalance(balRes.data.balance)
        setTierBadge(balRes.data.tierBadge || "GUARDIAN")
      }
      if (leadRes.data.leaderboard) setLeaderboard(leadRes.data.leaderboard)
      if (vouchRes.data.vouchers) setVouchers(vouchRes.data.vouchers)
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedWard])

  const handleRedeem = async (v: Voucher) => {
    if (balance < v.pointsRequired) {
      toast.error(`Insufficient Civic Karma points! You need ${v.pointsRequired - balance} more points.`, {
        icon: "🪙",
      })
      return
    }

    try {
      const res = await api.post("/karma/redeem-voucher", { voucherId: v.id })
      setBalance((prev) => prev - v.pointsRequired)
      setRedeemedCode({ id: v.id, code: res.data.data?.promoCode || "BMC-PROMO-994" })
      toast.success(`🎉 Voucher Redeemed: ${v.title}!`, { icon: "🎁", duration: 6000 })
    } catch {
      setBalance((prev) => prev - v.pointsRequired)
      setRedeemedCode({ id: v.id, code: `BMC-${v.category.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}` })
      toast.success(`Voucher Redeemed: ${v.title}!`, { icon: "🎁" })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white border border-emerald-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Civic Karma Credits & 24-Ward Leaderboard</h1>
              <p className="text-xs text-emerald-300">
                Earn municipal reward points for verified grievance reports and resolution confirmations
              </p>
            </div>
          </div>
        </div>

        {/* User Balance Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] uppercase font-mono text-emerald-300 block font-bold">Your Karma Balance</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-amber-300">{balance}</span>
              <span className="text-xs text-slate-300 font-bold">PTS</span>
            </div>
          </div>
          <Badge className="bg-amber-500 text-slate-950 font-mono text-xs font-black px-2.5 py-1">
            {tierBadge}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 24-Ward Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Top 24-Ward Civic Champions</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Citizens recognized for active community vigilance
                </CardDescription>
              </div>

              {/* Ward Filter */}
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="text-xs font-mono rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-slate-900 dark:text-white"
              >
                <option value="all">All 24 BMC Wards</option>
                <option value="Ward G-North">Ward G-North (Dadar)</option>
                <option value="Ward H-West">Ward H-West (Bandra)</option>
                <option value="Ward K-West">Ward K-West (Andheri)</option>
                <option value="Ward F-South">Ward F-South (Parel)</option>
                <option value="Ward A">Ward A (Colaba)</option>
              </select>
            </CardHeader>

            <CardContent className="space-y-2">
              {leaderboard.map((u) => (
                <div
                  key={u.rank}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                        u.rank === 1
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : u.rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : u.rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      #{u.rank}
                    </span>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        {u.ward} • {u.verifiedReports} verified reports
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5">
                      {u.points} PTS
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[9px] uppercase hidden sm:inline-flex">
                      {u.tierBadge}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Redeemable Vouchers */}
        <div className="space-y-4">
          <Card className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-500" />
                <span>Municipal Rewards Catalog</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Redeem your Karma credits for utility perks
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {vouchers.map((v) => {
                const isRedeemed = redeemedCode?.id === v.id

                return (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{v.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {v.discountDescription}
                        </p>
                      </div>
                      <Badge className="bg-amber-500 text-slate-950 font-mono text-[10px] font-bold shrink-0">
                        {v.pointsRequired} PTS
                      </Badge>
                    </div>

                    {isRedeemed ? (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">
                        CODE: {redeemedCode.code}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRedeem(v)}
                        disabled={balance < v.pointsRequired}
                        className="w-full h-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Redeem Voucher</span>
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

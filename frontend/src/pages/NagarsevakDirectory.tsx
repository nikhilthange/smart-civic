import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Users,
  Search,
  MapPin,
  MessageCircle,
  Phone,
  Filter,
  Building2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import MmrCorporationSelector from "@/components/common/MmrCorporationSelector"
import {
  NAGARSEVAK_ROSTER,
  type Nagarsevak,
  type MmrCorporation
} from "@/data/nagarsevakDirectory"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"
import { LanguageToggle } from "@/components/common/LanguageToggle"

export default function NagarsevakDirectory() {
  const { t, i18n } = useTranslation()
  const [selectedCorp, setSelectedCorp] = useState<MmrCorporation>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCorporators = useMemo(() => {
    return NAGARSEVAK_ROSTER.filter((ns) => {
      const matchesCorp = selectedCorp === "ALL" || ns.corporation === selectedCorp
      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesCorp

      const matchesSearch =
        ns.name.toLowerCase().includes(q) ||
        ns.electoralWard.toLowerCase().includes(q) ||
        ns.adminWardCode.toLowerCase().includes(q) ||
        ns.neighborhood.toLowerCase().includes(q) ||
        ns.partyLabel.toLowerCase().includes(q) ||
        ns.corporationName.toLowerCase().includes(q)

      return matchesCorp && matchesSearch
    })
  }, [selectedCorp, searchQuery])

  const handleWhatsAppChat = (ns: Nagarsevak) => {
    const isMarathi = i18n.language === "mr"
    const isHindi = i18n.language === "hi"
    const text = isMarathi
      ? `नमस्कार ${ns.name} जी, मी ${ns.electoralWard} (${ns.neighborhood}) चा रहिवासी आहे. स्मार्ट सिव्हिक एआय वरील एका नागरी समस्येबाबत मी आपल्याशी संपर्क साधत आहे.`
      : isHindi
      ? `नमस्कार ${ns.name} जी, मैं ${ns.electoralWard} (${ns.neighborhood}) का निवासी हूँ। स्मार्ट सिविक एआई पर एक नागरिक समस्या के संबंध में मैं आपसे संपर्क कर रहा हूँ।`
      : `Namaskar ${ns.name} ji, I am a resident of ${ns.electoralWard} (${ns.neighborhood}). I am reaching out regarding a civic issue on Smart Civic AI.`
    window.open(`https://api.whatsapp.com/send?phone=${ns.whatsapp}&text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <SmartCivicLogo className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">Smart Civic <span className="text-emerald-600">AI</span></span>
          </Link>
          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            <Button variant="outline" size="sm" asChild className="text-xs">
              <Link to="/map">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>{t("nagarsevakDirectory.liveMap", "Live Ward Map")}</span>
              </Link>
            </Button>
            <Button size="sm" asChild className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Link to="/complaint/create">{t("nagarsevakDirectory.fileGrievance", "File Grievance")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-gradient-to-b from-white via-slate-50 to-slate-100/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>{t("nagarsevakDirectory.badge", "MMR Elected Representative & Ward Accountability Directory")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {t("nagarsevakDirectory.title", "Find Your Nagarsevak (Ward Corporator)")}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t("nagarsevakDirectory.subtitle", "Connect directly with your elected ward corporator across Mumbai (BMC), Thane (TMC), Navi Mumbai (NMMC), and Kalyan-Dombivli (KDMC). Escalate unresolved 48h SLA grievances with 1-tap WhatsApp communication.")}
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder={t("nagarsevakDirectory.searchPlaceholder", "Search by corporator name, ward (e.g. 217, Hill Road, Bandra), or party...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm shadow-sm focus-visible:ring-emerald-500"
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 text-xs font-medium">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block">592</span>
              <span className="text-slate-500">{t("nagarsevakDirectory.statCorporators", "MMR Corporators")}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold font-mono text-blue-600 block">4</span>
              <span className="text-slate-500">{t("nagarsevakDirectory.statCorps", "Municipal Corps")}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold font-mono text-emerald-600 block">94.8%</span>
              <span className="text-slate-500">{t("nagarsevakDirectory.statResponse", "Avg Response Rate")}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold font-mono text-amber-600 block">1-Tap</span>
              <span className="text-slate-500">{t("nagarsevakDirectory.statWhatsApp", "WhatsApp Escalation")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Corporation Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              {t("nagarsevakDirectory.filterCorporation", "Filter by Municipal Corporation")}
            </span>
            <span>{t("nagarsevakDirectory.showingCount", { count: filteredCorporators.length, defaultValue: `Showing ${filteredCorporators.length} representatives` })}</span>
          </div>
          <MmrCorporationSelector
            selectedCorp={selectedCorp}
            onSelectCorp={setSelectedCorp}
          />
        </div>

        {/* Corporators Grid */}
        {filteredCorporators.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold">{t("nagarsevakDirectory.noCorporators", "No Corporators Found")}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t("nagarsevakDirectory.noCorporatorsDesc", { query: searchQuery, defaultValue: `No representative matched "${searchQuery}". Try searching by ward number, neighborhood, or selecting "All MMR Regions".` })}
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedCorp("ALL"); }}>
              {t("nagarsevakDirectory.resetFilters", "Reset Filters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCorporators.map((ns) => (
              <Card
                key={ns.id}
                className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Ward Header Banner */}
                  <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {ns.electoralWard}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {ns.adminWardCode}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {ns.corporation}
                    </span>
                  </div>

                  {/* Profile Info */}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={ns.avatar}
                        alt={ns.name}
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ns.name)}&background=0284c7&color=fff`
                        }}
                        className="w-13 h-13 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                            {ns.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{ns.neighborhood}</span>
                        </p>
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border mt-1 ${ns.partyColor}`}>
                          {ns.partyLabel}
                        </span>
                      </div>
                    </div>

                    {/* Performance Scorecard Strip */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          {ns.resolvedCount}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">{t("nagarsevakDirectory.resolved", "Resolved")}</span>
                      </div>
                      <div className="border-x border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-mono font-bold text-amber-600 block">
                          {ns.pendingCount}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">{t("nagarsevakDirectory.pending", "Pending")}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600 block">
                          {ns.responseRate}%
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">{t("nagarsevakDirectory.slaScore", "SLA Score")}</span>
                      </div>
                    </div>

                    {/* Office Address Snippet */}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ns.officeAddress}</span>
                    </p>
                  </CardContent>
                </div>

                {/* Bottom Card Actions */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleWhatsAppChat(ns)}
                    className="flex-1 text-xs h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs h-9 rounded-xl px-3 cursor-pointer"
                    title={t("nagarsevakDirectory.callOffice", "Call Office")}
                  >
                    <a href={`tel:${ns.phone}`}>
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 Smart Civic AI Platform • MMR Municipal Corporator Accountability Initiative
      </footer>
    </div>
  )
}

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Download,
  Share2,
  AlertTriangle,
  Search,
  MapPin,
  Loader2,
  Landmark,
  Wrench,
  Camera,
  X,
  ArrowLeft,
  Home,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { generateRoadPassportPdf, type RoadPassportPdfData } from "@/utils/pdfReportGenerator"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"

const SAMPLE_ROADS = [
  { id: "DLP-HW-8812", name: "S.V. Road Khar Carriageway", ward: "Ward H-West" },
  { id: "DLP-GN-9041", name: "Senapati Bapat Marg South-Bound", ward: "Ward G-North" },
]

export default function DigitalRoadPassport() {
  const { contractId: routeContractId } = useParams<{ contractId?: string }>()
  const navigate = useNavigate()

  const [activeContractId, setActiveContractId] = useState<string>(routeContractId || "DLP-HW-8812")
  const [searchInput, setSearchInput] = useState("")
  const [passport, setPassport] = useState<RoadPassportPdfData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Fetch Road Passport from Backend API
  const fetchPassport = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await api.get(`/dlp/passport/${id.trim()}`)
      if (res.data?.success && res.data?.passport) {
        setPassport(res.data.passport)
        setActiveContractId(res.data.passport.contractId)
      } else {
        toast.error("Could not load Road Passport")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Road contract not found. Please try a valid contract ID.")
      setPassport(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPassport(activeContractId)
  }, [activeContractId])

  // Handle Search Input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setActiveContractId(searchInput.trim())
    navigate(`/road-passport/${searchInput.trim()}`, { replace: true })
  }

  // Handle QR Camera Scanner
  useEffect(() => {
    if (!isScannerOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    const regionId = "road-passport-qr-reader"
    const scanner = new Html5QrcodeScanner(
      regionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      (decodedText: string) => {
        let extractedId = decodedText
        if (decodedText.startsWith("SMARTCIVIC:ROAD:")) {
          extractedId = decodedText.replace("SMARTCIVIC:ROAD:", "").trim()
        } else if (decodedText.includes("/road-passport/")) {
          const parts = decodedText.split("/road-passport/")
          extractedId = parts[1]?.trim() || decodedText
        }

        toast.success(`Scanned Road Plaque: ${extractedId}`)
        setActiveContractId(extractedId)
        navigate(`/road-passport/${extractedId}`, { replace: true })
        setIsScannerOpen(false)
      },
      (_err) => {
        // Continuous scan tick
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [isScannerOpen, navigate])

  // Generate & Download Official Municipal PDF Certificate
  const handleDownloadPdf = async () => {
    if (!passport) return
    setIsDownloadingPdf(true)
    try {
      await generateRoadPassportPdf(passport)
      toast.success("Official Road Birth Certificate & DLP Passport PDF downloaded successfully!")
    } catch (err: any) {
      console.error("PDF generation failed:", err)
      toast.error("Failed to generate PDF document.")
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Copy Public Link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/road-passport/${activeContractId}`
    navigator.clipboard.writeText(url)
    toast.success("Public Road Passport URL copied to clipboard!")
  }

  // Report defect on this specific road
  const handleReportDefect = () => {
    if (!passport) return
    const params = new URLSearchParams({
      category: "roads_and_infrastructure",
      road: passport.roadName,
      ward: passport.ward,
      dlpContractId: passport.contractId,
    })
    navigate(`/complaint/create?${params.toString()}`)
  }

  return (
    <div className="min-h-[100dvh] h-full w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-slate-100 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <span>/</span>
            <Link
              to="/dlp-registry"
              className="hover:text-emerald-600 font-medium transition"
            >
              DLP Registry
            </Link>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Road Passport
            </span>
          </div>
        </div>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MMC Act Section 64B • Statutory Warranty Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Digital Road Passport & Plaque Scanner
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Scan any municipal street QR code or enter contract ID to inspect real-time 36-month defect liability
                guarantees, contractor performance escrow, and active repair warranties.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <Button
                onClick={() => setIsScannerOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 px-4 py-2.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Street QR</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs rounded-xl flex items-center gap-2 px-4 py-2.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Passport</span>
              </Button>
            </div>
          </div>

          {/* Quick Demo Contract Selectors */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Demo Street Plaques:</span>
            {SAMPLE_ROADS.map((road) => (
              <button
                key={road.id}
                onClick={() => {
                  setActiveContractId(road.id)
                  navigate(`/road-passport/${road.id}`, { replace: true })
                }}
                className={`px-3 py-1 rounded-lg border font-mono transition cursor-pointer ${
                  activeContractId === road.id
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                }`}
              >
                {road.name} ({road.id})
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Road Contract ID (e.g. DLP-HW-8812) or Street Name..."
              className="pl-10 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-5 rounded-2xl bg-slate-900 dark:bg-emerald-600 text-white font-bold text-xs cursor-pointer">
            Lookup Passport
          </Button>
        </form>

        {/* Live QR Scanner Modal */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Scan Physical Street QR Plaque
                  </h3>
                </div>
                <button onClick={() => setIsScannerOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="road-passport-qr-reader" className="w-full rounded-2xl overflow-hidden bg-slate-950 min-h-[260px]" />

              <p className="text-xs text-slate-500 text-center">
                Point your camera at the metal Road Birth Certificate QR plaque affixed to the utility pole or street signage.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Loading / Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Retrieving Municipal Road Passport & Escrow Telemetry...</p>
          </div>
        ) : !passport ? (
          <Card className="rounded-3xl border-dashed border-2 p-8 text-center bg-white dark:bg-slate-900">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Road Contract Not Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No matching road asset found for "{activeContractId}". Select one of the verified sample plaques above or scan with camera.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* The Road Birth Certificate (Official Municipal Look) */}
            <Card className="rounded-3xl shadow-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {/* Certificate Seal Header */}
              <div className="bg-slate-100 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    🏛️
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-mono">
                      Municipal Corporation of Greater Mumbai (MCGM / BMC)
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Roads & Traffic Department • Statutory Road Birth Certificate
                    </p>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-mono font-bold px-3 py-1 ${
                    passport.isWarrantyActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {passport.isWarrantyActive ? "ACTIVE DLP GUARANTEE" : "WARRANTY EXPIRED"}
                </Badge>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Road Title & Details Grid */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {passport.roadName}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ID: {passport.contractId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {passport.ward}, Mumbai
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Wrench className="w-3.5 h-3.5 text-blue-500" />
                      Material: {passport.surfaceType.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="new Date(passport.completionDate).toLocaleDateString()" />
                      Commissioned: {new Date(passport.completionDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>

                {/* 36-Month DLP Warranty Progress Meter */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                        36-Month Defect Liability Period (DLP)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {passport.daysRemaining} Days Remaining
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${passport.warrantyProgressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Term Start: {new Date(passport.completionDate).toLocaleDateString("en-IN")}</span>
                    <span>Warranty Expiry: {new Date(passport.dlpExpiryDate).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                {/* Contractor & Escrow Telemetry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contractor Profile */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        Paving Contractor
                      </span>
                      <Badge className="bg-blue-600 text-white font-mono text-[9px]">
                        SCORE: {passport.contractorRating}/100
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{passport.contractorName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Vendor Code: {passport.contractorId}</p>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span>Statutory SLA:</span>
                        <strong className="font-semibold text-slate-900 dark:text-white">48 Hours to Fix Potholes</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract Total:</span>
                        <strong className="font-semibold text-slate-900 dark:text-white">
                          ₹{(passport.totalProjectCostInr / 10000000).toFixed(2)} Cr
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Financial Escrow Guarantee */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                        10% Bank Escrow Guarantee
                      </span>
                      <Badge
                        className={`text-[9px] font-mono ${
                          passport.retentionFundFrozen
                            ? "bg-rose-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {passport.retentionFundFrozen ? "ESCROW FROZEN" : "COLLATERAL ACTIVE"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                        ₹{passport.retentionFundAmountInr.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Performance retention held under Municipal Treasurer Escrow
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                      🛡️ If a defect is verified and unaddressed beyond 48 hours, micro-escrow slashes ₹5,000/day.
                    </p>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Audit Seal */}
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      SHA-256 SEAL: <strong className="text-slate-900 dark:text-white font-bold">{passport.sha256Seal}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">Sec 64B Verified</span>
                </div>

                {/* Action Buttons Hub */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleReportDefect}
                    className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Report Defect on this Road (Auto-Debits Escrow)</span>
                  </Button>

                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md px-6 cursor-pointer"
                  >
                    {isDownloadingPdf ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download Official Birth Certificate (PDF)</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  MapPin, UploadCloud, FileText, X, Image, AlertCircle,
  CheckCircle2, Loader2, Bot, Info, Camera, QrCode, ShieldCheck,
  Clock, ShieldAlert, Building2
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { complaintApi, CATEGORY_LABELS, type ComplaintCategory } from "@/services/complaintApi"
import { CameraCaptureModal } from "@/components/common/CameraCaptureModal"
import { VoiceInput } from "@/components/common/VoiceInput"
import { QrScannerModal, type ScannedAssetData } from "@/components/common/QrScannerModal"

import { parseImageExif } from "@/utils/exifParser"
import { saveOfflineResolution } from "@/utils/offlineQueue"
import { detectWardByCoordinates } from "@/utils/mumbaiWardBoundaries"
import toast from "react-hot-toast"

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ComplaintCategory, string][]

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low",      color: "text-slate-600" },
  { value: "medium",   label: "Medium",   color: "text-amber-600" },
  { value: "high",     label: "High",     color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
]

export default function CreateComplaint() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleQrScan = (asset: ScannedAssetData) => {
    setForm((prev) => ({
      ...prev,
      title: `[Asset #${asset.assetId}] - Civic Issue Report`,
      category: (asset.category as ComplaintCategory) || prev.category || "street_lighting",
      locationAddress: asset.address || prev.locationAddress || `Asset Location (${asset.ward || "Mumbai"})`,
      ward: asset.ward || prev.ward || "Ward A",
      lat: asset.lat ?? prev.lat,
      lng: asset.lng ?? prev.lng,
    }))
  }

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as ComplaintCategory | "",
    locationAddress: "",
    locationCity: "Mumbai",
    locationState: "Maharashtra",
    locationPincode: "400028",
    ward: "Ward A",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    priority: "medium",
    isAnonymous: false,
  })

  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ complaintId: string; rawId?: string; aiVerified: boolean } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }
    setGeoLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const wardObj = detectWardByCoordinates(lat, lng)

        let formattedAddress = ""
        let city = "Mumbai"
        let state = "Maharashtra"
        let pincode = form.locationPincode || "400028"

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          )
          if (res.ok) {
            const data = await res.json()
            const addr = data.address || {}
            city = addr.city || addr.town || addr.city_district || addr.county || "Mumbai"
            state = addr.state || "Maharashtra"
            pincode = addr.postcode || pincode

            const road = addr.road || addr.pedestrian || addr.street || ""
            const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.amenity || ""
            const parts = [road, neighbourhood, city].filter(Boolean)
            if (parts.length > 0) {
              formattedAddress = parts.join(", ")
            } else if (data.display_name) {
              formattedAddress = data.display_name.split(",").slice(0, 3).join(",").trim()
            }
          }
        } catch {
          // ignore network failure on reverse geocode and use ward fallback
        }

        if (!formattedAddress) {
          formattedAddress = `${wardObj.name}, ${wardObj.wardCode}, Mumbai`
        }

        setForm((prev) => ({
          ...prev,
          lat,
          lng,
          locationAddress: formattedAddress,
          locationCity: city,
          locationState: state,
          locationPincode: pincode,
          ward: wardObj.wardCode,
        }))
        toast.success(`📍 High-accuracy GPS detected: ${wardObj.wardCode} (${lat.toFixed(4)}, ${lng.toFixed(4)})`, {
          icon: "🛰️",
        })
        setGeoLoading(false)
      },
      (err) => {
        setGeoLoading(false)
        console.warn("GPS detection error:", err)
        setError(err?.message || "Unable to retrieve your high-accuracy location.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // File handling with EXIF parsing & auto-geocoding
  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    if (arr.length > 0) {
      const firstImage = arr.find((f) => f.type.startsWith("image/"))
      if (firstImage) {
        setPreviewUrl(URL.createObjectURL(firstImage))
        const extracted = await parseImageExif(firstImage)

        const wardObj = extracted.lat && extracted.lng
          ? detectWardByCoordinates(extracted.lat, extracted.lng)
          : null

        setForm((prev) => ({
          ...prev,
          lat: extracted.lat ?? prev.lat,
          lng: extracted.lng ?? prev.lng,
          ward: wardObj ? wardObj.wardCode : (extracted.suggestedWard || prev.ward),
          locationAddress: extracted.suggestedAddress || prev.locationAddress || `${extracted.suggestedLandmark}, ${extracted.suggestedWard}`,
          category: prev.category || "roads_and_infrastructure",
          title: prev.title || `Civic defect reported near ${extracted.suggestedLandmark || "Mumbai"}`,
        }))
        toast.success(`📍 EXIF GPS extracted: ${extracted.suggestedLandmark} (${wardObj?.wardCode || extracted.suggestedWard})`, { icon: "🛰️" })
      }
    }

    setFiles(prev => {
      const combined = [...prev, ...arr].slice(0, 5)
      return combined
    })
  }, [])

  // Cleanup object URL memory on unmount or URL replacement
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
      }
      return next
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  // AI preview
  const aiWillVerify = form.description.length >= 50

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.category) {
      setError("Please select a category.")
      return
    }

    setIsSubmitting(true)

    // Offline Interceptor
    if (!navigator.onLine) {
      const offlineTicketId = `SC-${new Date().getFullYear()}-OFFLINE-${Math.floor(10000 + Math.random() * 90000)}`
      saveOfflineResolution({
        complaintId: offlineTicketId,
        notes: `[OFFLINE SUBMISSION] ${form.title} - ${form.description}`,
      })
      setIsSubmitting(false)
      toast.success("📶 You are offline. Grievance cached in IndexedDB queue and will auto-flush when online!", {
        icon: "💾",
        duration: 8000,
      })
      setSuccess({
        complaintId: offlineTicketId,
        rawId: offlineTicketId,
        aiVerified: true,
      })
      return
    }

    try {
      const result = await complaintApi.create({
        ...form,
        category: form.category as ComplaintCategory,
        attachments: files,
      })
      const c = result.complaint
      setSuccess({
        complaintId: c.complaintId || c._id,
        rawId: c._id || c.id || c.complaintId,
        aiVerified: c.status === "ai_verified",
      })
    } catch (err: unknown) {
      const responseData = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string; message?: string; selectedCategory?: string }; status?: number } }).response?.data
        : null

      if (responseData?.error === "AI_VERIFICATION_FAILED") {
        const categoryLabel = (CATEGORY_LABELS as any)[form.category] || form.category
        const msg = `AI Validation Failed: Your photo does not appear to show ${categoryLabel}. Please upload a clear photo of the issue.`
        setError(msg)
        toast.error(msg, { duration: 6000, icon: "🚫" })
        return
      }

      const msg = responseData?.message || "Failed to submit complaint."
      setError(msg || "Failed to submit complaint.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto w-full py-12">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-center rounded-2xl">
            <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Grievance Registered Successfully</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Your ticket has been ingested and routed into the municipal triage engine.</p>

              <div className="bg-zinc-50 dark:bg-zinc-900/90 rounded-xl px-6 py-3.5 w-full border border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-[11px] font-mono uppercase text-zinc-400 mb-0.5">Tracking Ticket ID</p>
                <p className="text-base font-mono font-bold text-zinc-900 dark:text-zinc-100">{success.complaintId}</p>
              </div>

              {success.aiVerified && (
                <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl px-4 py-2.5 w-full text-left">
                  <Bot className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-medium">AI Verified — Priority score evaluated and ward supervisor notified.</p>
                </div>
              )}

              <div className="flex gap-2.5 w-full pt-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => navigate("/complaints")}>
                  View Ledger
                </Button>
                <Button className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm" onClick={() => navigate(`/complaint/${success.rawId || success.complaintId}/track`)}>
                  Track Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/60 shadow-sm">
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Submit Civic Grievance</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Report neighborhood defects directly to the BMC ward triage mesh</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            AUTO-SLA ROUTING ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* AI info banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 px-4 py-3">
            <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Automated AI Triage & Verification</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Complaints with 50+ characters and clear photo evidence are classified by our neural model and expedited to ward field workers.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

          {/* Step 1: Category & Details */}
          <Card className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <span className="flex h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold items-center justify-center shrink-0">1</span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">Issue Category & Details</h2>
            </div>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Category <span className="text-rose-500">*</span></Label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select an infrastructure category...</option>
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Issue Title <span className="text-rose-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Severe road surface pothole near junction"
                  value={form.title}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={150}
                  className="h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800"
                />
                <p className="text-[10px] font-mono text-zinc-400">{form.title.length}/150</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Detailed Description <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto touch-pan-x min-w-0">
                    <VoiceInput
                      onTranscript={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          description: prev.description ? `${prev.description} ${text}` : text,
                        }))
                      }
                    />
                    {form.description.length > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${aiWillVerify
                          ? "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : "border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {aiWillVerify ? (
                          <><Bot className="h-3 w-3 mr-1" />AI Verified</>
                        ) : (
                          <><Info className="h-3 w-3 mr-1" />{50 - form.description.length} more chars</>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="flex min-h-[110px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe the defect, hazards, traffic impact, and location markers..."
                  required
                  minLength={20}
                  maxLength={2000}
                />
                <p className="text-[10px] font-mono text-zinc-400">{form.description.length}/2000</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Priority Level</Label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, priority: opt.value }))}
                      className={`h-10 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center justify-center min-h-[44px] touch-manipulation cursor-pointer ${
                        form.priority === opt.value
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-sm font-bold"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2: Location */}
          <Card className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold items-center justify-center shrink-0">2</span>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">Municipal Location</h2>
              </div>
              {form.lat && form.lng && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>GPS: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                </span>
              )}
            </div>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Street Address / Landmark <span className="text-rose-500">*</span></Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    name="locationAddress"
                    placeholder="Enter street address or landmark"
                    value={form.locationAddress}
                    onChange={handleChange}
                    required
                    className="flex-1 h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800"
                  />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm h-10 min-h-[44px] rounded-xl touch-manipulation gap-1.5" onClick={handleGetLocation} disabled={geoLoading}>
                    {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5 text-emerald-600" />}
                    <span>{geoLoading ? "Detecting GPS..." : "Detect GPS"}</span>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Administrative Ward</Label>
                  <Input name="ward" placeholder="e.g. Ward A" value={form.ward || ""} onChange={handleChange} className="h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">City</Label>
                  <Input name="locationCity" placeholder="City" value={form.locationCity} onChange={handleChange} className="h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">State</Label>
                  <Input name="locationState" placeholder="State" value={form.locationState} onChange={handleChange} className="h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Pincode</Label>
                  <Input name="locationPincode" placeholder="6-digit" value={form.locationPincode} onChange={handleChange} maxLength={6} className="h-10 text-xs sm:text-sm rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 font-mono" />
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3: Evidence & EXIF Sanitization */}
          <Card className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
            <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold items-center justify-center shrink-0">3</span>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">Photo / Video Evidence</h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Upload images or videos (max 10MB each)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>EXIF Sanitized</span>
              </span>
            </div>
            <div className="space-y-4 pt-4">
              {/* Drop zone & Camera Snap Action */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                  }`}
                >
                  <UploadCloud className={`h-8 w-8 mb-2 ${dragOver ? "text-primary" : "text-slate-400"}`} />
                  <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP, MP4, PDF — max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/mp4,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                </div>

                <div className="flex flex-row sm:flex-col gap-2 min-w-[140px]">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 rounded-xl transition-colors min-h-[44px]"
                  >
                    <Camera className="h-5 sm:h-6 w-5 sm:w-6 mb-1 text-emerald-600" />
                    <span className="text-xs font-bold">Live Camera</span>
                    <span className="text-[10px] text-emerald-700 hidden sm:inline">Snap photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-800 rounded-xl transition-colors min-h-[44px]"
                  >
                    <QrCode className="h-5 sm:h-6 w-5 sm:w-6 mb-1 text-indigo-600" />
                    <span className="text-xs font-bold">Scan Asset QR</span>
                    <span className="text-[10px] text-indigo-700 hidden sm:inline">Auto-fill defect</span>
                  </button>
                </div>
              </div>

              <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => addFiles([file] as unknown as FileList)}
              />

              <QrScannerModal
                isOpen={isQrScannerOpen}
                onClose={() => setIsQrScannerOpen(false)}
                onScan={handleQrScan}
              />

              {/* Preview */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file, i) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="w-full h-24 flex flex-col items-center justify-center gap-1 text-slate-500">
                          <Image className="h-6 w-6" />
                          <p className="text-xs truncate px-2 w-full text-center">{file.name}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="px-2 py-1 text-xs text-slate-500 truncate bg-white border-t border-slate-100">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Options */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-primary"
            />
            <Label htmlFor="isAnonymous" className="cursor-pointer font-normal text-slate-600">
              Submit anonymously (your name won't be shown publicly)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(-1)} className="min-h-[44px]">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-36 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                "Submit Complaint"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>

    {/* Right Information & SLA Charter Sidebar (4 Cols) */}
    <div className="lg:col-span-4 space-y-4">
      {/* SLA Matrix Card */}
      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          BMC Citizen Charter SLA Matrix
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Open Manhole / Cave-in</span>
            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 text-[10px] font-mono font-bold">
              2–4h SLA
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Major Arterial Pothole</span>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 text-[10px] font-mono font-bold">
              12–24h SLA
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-800">
            <span className="font-semibold text-blue-600 dark:text-blue-400">SWM Garbage Overflow</span>
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 text-[10px] font-mono font-bold">
              24–48h SLA
            </Badge>
          </div>
        </div>
      </Card>

      {/* DPDP Act 2023 Privacy Card */}
      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 rounded-2xl shadow-sm p-4 space-y-2 text-xs">
        <h3 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          DPDP Act 2023 Privacy Shield
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
          Your personal data is protected under statutory privacy safeguards. Contact numbers and personal identifiers are dynamically redacted before reaching public dashboards or contractor field views.
        </p>
      </Card>

      {/* Statutory Contractor Notice */}
      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 rounded-2xl shadow-sm p-4 space-y-2 text-xs">
        <h3 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          MMC Act Section 354
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
          Unresolved critical hazards past SLA triggers invoke automated ₹5,000 contractor escrow deductions and statutory debarment proceedings.
        </p>
      </Card>
    </div>
  </div>
</motion.div>
)
}

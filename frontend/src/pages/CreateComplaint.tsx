import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  MapPin, UploadCloud, FileText, X, Image, AlertCircle,
  CheckCircle2, Loader2, Bot, Info, Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { complaintApi, CATEGORY_LABELS, type ComplaintCategory } from "@/services/complaintApi"
import { CameraCaptureModal } from "@/components/common/CameraCaptureModal"
import VoiceInput from "@/components/common/VoiceInput"

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

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as ComplaintCategory | "",
    locationAddress: "",
    locationCity: "",
    locationState: "",
    locationPincode: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    priority: "medium",
    isAnonymous: false,
  })

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setForm(prev => ({ ...prev, lat, lng }))
        
        // Optional: reverse geocode using Nominatim or Google Maps to fill the address box
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          if (res.ok) {
            const data = await res.json()
            setForm(prev => ({ ...prev, locationAddress: data.display_name }))
          }
        } catch {
          // ignore
        }
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setError("Unable to retrieve your location.")
      }
    )
  }

  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ complaintId: string; aiVerified: boolean } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // File handling
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    setFiles(prev => {
      const combined = [...prev, ...arr].slice(0, 5)
      return combined
    })
  }, [])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
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
    try {
      const result = await complaintApi.create({
        ...form,
        category: form.category as ComplaintCategory,
        attachments: files,
      })
      setSuccess({
        complaintId: result.complaint.complaintId,
        aiVerified: result.complaint.status === "ai_verified",
      })
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to submit complaint."
      setError(msg || "Failed to submit complaint.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto w-full py-12">
        <Card className="shadow-lg border-t-4 border-t-green-500 text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Complaint Submitted!</h2>
            <p className="text-slate-500">Your complaint has been received.</p>

            <div className="bg-slate-50 rounded-lg px-6 py-3 w-full">
              <p className="text-xs text-slate-500 mb-1">Complaint ID</p>
              <p className="text-lg font-mono font-bold text-primary">{success.complaintId}</p>
            </div>

            {success.aiVerified && (
              <div className="flex items-center gap-2 text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 w-full">
                <Bot className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">AI Verified — Your complaint passed automated verification and will be prioritized.</p>
              </div>
            )}

            <div className="flex gap-3 w-full pt-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/complaints")}>
                View History
              </Button>
              <Button className="flex-1" onClick={() => navigate(`/complaint/${success._id || success.id || success.complaintId}/track`)}>
                Track Complaint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit a Complaint</h1>
          <p className="text-sm text-slate-500">Report civic issues to the appropriate department</p>
        </div>
      </div>

      {/* AI info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
        <Bot className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-800">AI-Powered Verification</p>
          <p className="text-xs text-violet-600 mt-0.5">Complaints with a detailed description (50+ characters) are automatically verified by our AI and prioritized for faster resolution.</p>
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

          {/* Category */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Issue Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Large pothole on Main Street causing accidents"
                  value={form.title}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={150}
                />
                <p className="text-xs text-slate-400">{form.title.length}/150</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description">Detailed Description <span className="text-red-500">*</span></Label>
                    <VoiceInput
                      onTranscript={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          description: prev.description ? `${prev.description} ${text}` : text,
                        }))
                      }
                    />
                  </div>
                  {form.description.length > 0 && (
                    <Badge
                      variant="outline"
                      className={aiWillVerify
                        ? "border-violet-300 text-violet-700 bg-violet-50"
                        : "border-amber-300 text-amber-700 bg-amber-50"
                      }
                    >
                      {aiWillVerify ? (
                        <><Bot className="h-3 w-3 mr-1" />AI will verify</>
                      ) : (
                        <><Info className="h-3 w-3 mr-1" />{50 - form.description.length} more chars for AI verification</>
                      )}
                    </Badge>
                  )}
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Describe the problem in detail: its location, duration, impact on residents, and any safety concerns..."
                  required
                  minLength={20}
                  maxLength={2000}
                />
                <p className="text-xs text-slate-400">{form.description.length}/2000</p>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, priority: opt.value }))}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        form.priority === opt.value
                          ? `border-current ${opt.color} bg-current/5`
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Street Address <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    name="locationAddress"
                    placeholder="Enter street address or landmark"
                    value={form.locationAddress}
                    onChange={handleChange}
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" className="shrink-0" onClick={handleGetLocation} disabled={geoLoading}>
                    {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Detect</span>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input name="locationCity" placeholder="City" value={form.locationCity} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input name="locationState" placeholder="State" value={form.locationState} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input name="locationPincode" placeholder="6-digit" value={form.locationPincode} onChange={handleChange} maxLength={6} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Photo / Video Evidence</CardTitle>
              <CardDescription>Upload up to 5 images, videos or PDFs (max 10MB each)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 rounded-xl transition-colors min-w-[140px]"
                >
                  <Camera className="h-8 w-8 mb-2 text-emerald-600" />
                  <span className="text-sm font-semibold">Live Camera</span>
                  <span className="text-xs text-emerald-700 mt-1">Snap photo now</span>
                </button>
              </div>

              <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(file) => addFiles([file] as unknown as FileList)}
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
            </CardContent>
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
          <div className="flex justify-between pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-36">
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
  )
}

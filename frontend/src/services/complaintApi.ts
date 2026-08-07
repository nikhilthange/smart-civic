import api from "@/lib/axios"

export type ComplaintStatus =
  | "pending"
  | "ai_verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected"

export type ComplaintCategory =
  | "roads_and_infrastructure"
  | "water_and_sanitation"
  | "electricity"
  | "garbage_collection"
  | "public_safety"
  | "parks_and_recreation"
  | "noise_pollution"
  | "illegal_construction"
  | "street_lighting"
  | "public_transport"
  | "drainage"
  | "other"

export interface Attachment {
  url: string
  filename: string
  mimetype: string
  size: number
}

export interface StatusHistoryEntry {
  status: ComplaintStatus
  note?: string
  changedAt: string
  changedBy?: { name: string; role: string }
}

export interface Complaint {
  _id: string
  complaintId: string
  title: string
  description: string
  category: ComplaintCategory
  status: ComplaintStatus
  priority: "low" | "medium" | "high" | "critical"
  isAnonymous: boolean
  citizen: { _id: string; name: string; email: string; avatar?: string }
  location: {
    address: string
    city?: string
    state?: string
    pincode?: string
    coordinates?: {
      type: "Point"
      coordinates: [number, number] // [lng, lat]
    }
  }
  attachments: Attachment[]
  statusHistory: StatusHistoryEntry[]
  department?: { name: string; code: string; contactEmail?: string }
  assignedOfficer?: { user: { name: string; email: string } }
  estimatedResolution?: string
  resolvedAt?: string
  adminNotes?: string
  rejectionReason?: string
  feedbackSubmitted: boolean
  aiAnalysis?: {
    verified: boolean
    category: ComplaintCategory
    confidence: number
    severity: "low" | "medium" | "high" | "critical"
    recommendedDepartmentCode: string
    analysisNote: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateComplaintData {
  title: string
  description: string
  category: ComplaintCategory
  locationAddress: string
  locationCity?: string
  locationState?: string
  locationPincode?: string
  lat?: number
  lng?: number
  priority?: string
  isAnonymous?: boolean
  attachments?: File[]
}

export interface ComplaintsResponse {
  success: boolean
  total: number
  page: number
  pages: number
  complaints: Complaint[]
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  roads_and_infrastructure: "Roads & Infrastructure",
  water_and_sanitation: "Water & Sanitation",
  electricity: "Electricity",
  garbage_collection: "Garbage Collection",
  public_safety: "Public Safety",
  parks_and_recreation: "Parks & Recreation",
  noise_pollution: "Noise Pollution",
  illegal_construction: "Illegal Construction",
  street_lighting: "Street Lighting",
  public_transport: "Public Transport",
  drainage: "Drainage",
  other: "Other",
}

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending:      { label: "Pending",      color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300" },
  ai_verified:  { label: "AI Verified",  color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-300" },
  assigned:     { label: "Assigned",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300" },
  in_progress:  { label: "In Progress",  color: "text-cyan-700",   bg: "bg-cyan-50",   border: "border-cyan-300" },
  resolved:     { label: "Resolved",     color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300" },
  closed:       { label: "Closed",       color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-300" },
  rejected:     { label: "Rejected",     color: "text-red-700",    bg: "bg-red-50",    border: "border-red-300" },
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const complaintApi = {
  create: async (data: CreateComplaintData) => {
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("description", data.description)
    formData.append("category", data.category)
    formData.append("locationAddress", data.locationAddress)
    if (data.locationCity) formData.append("locationCity", data.locationCity)
    if (data.locationState) formData.append("locationState", data.locationState)
    if (data.locationPincode) formData.append("locationPincode", data.locationPincode)
    if (data.lat) formData.append("lat", String(data.lat))
    if (data.lng) formData.append("lng", String(data.lng))
    if (data.priority) formData.append("priority", data.priority)
    formData.append("isAnonymous", String(data.isAnonymous ?? false))
    if (data.attachments) {
      data.attachments.forEach((file) => formData.append("attachments", file))
    }
    const res = await api.post("/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },

  getAll: async (params?: Record<string, string | number>) => {
    const res = await api.get<ComplaintsResponse>("/complaints", { params })
    return res.data
  },

  getOne: async (id: string) => {
    const res = await api.get<{ success: boolean; complaint: Complaint }>(`/complaints/${id}`)
    return res.data.complaint
  },

  updateStatus: async (id: string, payload: { status: ComplaintStatus; note?: string }) => {
    const res = await api.patch(`/complaints/${id}/status`, payload)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/complaints/${id}`)
    return res.data
  },

  getStats: async () => {
    const res = await api.get<{
      success: boolean;
      total: number;
      byStatus: Record<string, number>;
      byCategory: { _id: string; count: number }[];
    }>("/complaints/stats")
    return res.data
  },

  assignOfficer: async (id: string, officerId: string) => {
    const res = await api.patch(`/complaints/${id}/assign`, { officerId })
    return res.data
  },
}

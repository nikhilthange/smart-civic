import api from "@/lib/axios"
import toast from "react-hot-toast"

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OfflineResolutionItem {
  id: string
  complaintId: string
  notes: string
  imageBase64?: string
  filename?: string
  timestamp: number
}

export interface OfflineAttachment {
  filename: string
  mime: string
  base64: string
}

export interface OfflineComplaintItem {
  id: string
  clientTicketId: string
  title: string
  description: string
  category: string
  locationAddress: string
  locationCity?: string
  locationState?: string
  locationPincode?: string
  ward?: string
  lat?: number
  lng?: number
  priority?: string
  isAnonymous?: boolean
  attachments?: OfflineAttachment[]
  timestamp: number
}

export interface SaveOfflineComplaintInput {
  title: string
  description: string
  category: string
  locationAddress: string
  locationCity?: string
  locationState?: string
  locationPincode?: string
  ward?: string
  lat?: number
  lng?: number
  priority?: string
  isAnonymous?: boolean
  files?: File[]
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const WORKER_QUEUE_KEY = "smart_civic_worker_offline_queue"
const CITIZEN_QUEUE_KEY = "smart_civic_citizen_offline_queue"
const CACHED_COMPLAINTS_KEY = "smart_civic_cached_complaints"
const CACHED_STATS_KEY = "smart_civic_cached_stats"

// ─── Binary / File Helpers ────────────────────────────────────────────────────

/**
 * Converts a base64 data URL to a File object
 */
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",")
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * Converts a File or Blob into a base64 data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// ─── Worker Offline Queue ─────────────────────────────────────────────────────

/**
 * Saves a resolution submission to local offline queue (Worker)
 */
export const saveOfflineResolution = (item: Omit<OfflineResolutionItem, "id" | "timestamp">) => {
  try {
    const queue = getOfflineQueue()
    const newItem: OfflineResolutionItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    }
    queue.push(newItem)
    localStorage.setItem(WORKER_QUEUE_KEY, JSON.stringify(queue))
    notifyQueueChange()

    // Request SW background sync
    requestSwBackgroundSync()

    toast.success("Saved to offline storage. Docket will synchronize automatically when connection is restored.", {
      duration: 5000,
    })
    return true
  } catch (err) {
    console.error("Failed to save offline resolution item:", err)
    return false
  }
}

/**
 * Retrieves all items in the worker offline queue
 */
export const getOfflineQueue = (): OfflineResolutionItem[] => {
  try {
    const raw = localStorage.getItem(WORKER_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Removes an item from the worker offline queue
 */
export const removeOfflineItem = (id: string) => {
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id)
    localStorage.setItem(WORKER_QUEUE_KEY, JSON.stringify(queue))
    notifyQueueChange()
  } catch (err) {
    console.error("Failed to remove item from worker offline queue:", err)
  }
}

/**
 * Synchronizes all queued worker resolutions
 */
export const syncOfflineQueue = async (onSuccess?: () => void): Promise<number> => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return 0

  let syncedCount = 0
  for (const item of queue) {
    try {
      const formData = new FormData()
      if (item.imageBase64) {
        const file = dataURLtoFile(item.imageBase64, item.filename || "offline_proof.jpg")
        formData.append("resolutionImage", file)
      }
      formData.append("notes", item.notes || "Offline synced resolution proof")

      await api.put(`/complaints/${item.complaintId}/worker-submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      removeOfflineItem(item.id)
      syncedCount++
    } catch (err: any) {
      console.warn(`Failed to sync offline item for ${item.complaintId}:`, err.message)
    }
  }

  if (syncedCount > 0) {
    toast.success(`Synchronized ${syncedCount} offline task resolution(s).`)
    if (onSuccess) onSuccess()
  }

  return syncedCount
}

// ─── Citizen Offline Complaints Queue ─────────────────────────────────────────

/**
 * Saves a full grievance report to the offline citizen queue
 */
export const saveOfflineComplaint = async (
  input: SaveOfflineComplaintInput
): Promise<{ success: boolean; clientTicketId: string }> => {
  try {
    const clientTicketId = `SC-${new Date().getFullYear()}-OFFLINE-${Math.floor(
      10000 + Math.random() * 90000
    )}`

    // Convert files to base64 for persistent offline storage
    const attachments: OfflineAttachment[] = []
    if (input.files && input.files.length > 0) {
      for (const file of input.files) {
        try {
          const base64 = await fileToDataURL(file)
          attachments.push({
            filename: file.name,
            mime: file.type || "image/jpeg",
            base64,
          })
        } catch (e) {
          console.warn("Failed to serialize attachment for offline storage:", e)
        }
      }
    }

    const newItem: OfflineComplaintItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      clientTicketId,
      title: input.title,
      description: input.description,
      category: input.category,
      locationAddress: input.locationAddress,
      locationCity: input.locationCity,
      locationState: input.locationState,
      locationPincode: input.locationPincode,
      ward: input.ward,
      lat: input.lat,
      lng: input.lng,
      priority: input.priority || "medium",
      isAnonymous: input.isAnonymous ?? false,
      attachments,
      timestamp: Date.now(),
    }

    const currentQueue = getOfflineComplaints()
    currentQueue.push(newItem)
    localStorage.setItem(CITIZEN_QUEUE_KEY, JSON.stringify(currentQueue))

    // Pre-insert into cached complaints so citizen immediately sees it in their lists
    injectProvisionalComplaint(newItem)
    notifyQueueChange()

    // Request SW background sync
    requestSwBackgroundSync()

    toast.success(
      `Saved offline. Provisional Docket #${clientTicketId}. Will synchronize automatically when connected.`,
      { duration: 7000 }
    )

    return { success: true, clientTicketId }
  } catch (err) {
    console.error("Failed to save citizen offline complaint:", err)
    return { success: false, clientTicketId: "" }
  }
}

/**
 * Retrieves all items in the citizen offline queue
 */
export const getOfflineComplaints = (): OfflineComplaintItem[] => {
  try {
    const raw = localStorage.getItem(CITIZEN_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Removes an item from the citizen offline queue
 */
export const removeOfflineComplaint = (id: string) => {
  try {
    const queue = getOfflineComplaints().filter((item) => item.id !== id)
    localStorage.setItem(CITIZEN_QUEUE_KEY, JSON.stringify(queue))
    notifyQueueChange()
  } catch (err) {
    console.error("Failed to remove citizen offline complaint:", err)
  }
}

/**
 * Synchronizes all queued citizen complaints with backend
 */
export const syncOfflineComplaints = async (onSuccess?: () => void): Promise<number> => {
  const queue = getOfflineComplaints()
  if (queue.length === 0) return 0

  let syncedCount = 0
  for (const item of queue) {
    try {
      const formData = new FormData()
      formData.append("title", item.title)
      formData.append("description", item.description)
      formData.append("category", item.category)
      formData.append("locationAddress", item.locationAddress)
      if (item.locationCity) formData.append("locationCity", item.locationCity)
      if (item.locationState) formData.append("locationState", item.locationState)
      if (item.locationPincode) formData.append("locationPincode", item.locationPincode)
      if (item.ward) formData.append("ward", item.ward)
      if (item.lat) formData.append("lat", String(item.lat))
      if (item.lng) formData.append("lng", String(item.lng))
      if (item.priority) formData.append("priority", item.priority)
      formData.append("isAnonymous", String(item.isAnonymous ?? false))

      if (item.attachments && item.attachments.length > 0) {
        item.attachments.forEach((att) => {
          const file = dataURLtoFile(att.base64, att.filename)
          formData.append("attachments", file)
        })
      }

      const res = await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const createdComplaint = res.data?.complaint
      const realId = createdComplaint?.complaintId || createdComplaint?._id

      // Replace provisional cached complaint with the confirmed server record
      replaceProvisionalComplaint(item.id, createdComplaint)

      removeOfflineComplaint(item.id)
      syncedCount++

      toast.success(
        `Grievance Synced: Docket [${item.clientTicketId}] registered as #${realId || "Confirmed"}`,
        { duration: 6000 }
      )
    } catch (err: any) {
      console.warn(`Failed to sync offline complaint ${item.clientTicketId}:`, err.message)
    }
  }

  if (syncedCount > 0 && onSuccess) {
    onSuccess()
  }

  return syncedCount
}

// ─── Unified Offline Sync Manager ─────────────────────────────────────────────

let isSyncing = false

/**
 * Synchronizes all pending citizen and worker offline items
 */
export const syncAllOfflineData = async (options?: {
  silent?: boolean
}): Promise<{ complaintsSynced: number; resolutionsSynced: number }> => {
  if (isSyncing || !navigator.onLine) {
    return { complaintsSynced: 0, resolutionsSynced: 0 }
  }

  const { total } = getPendingOfflineCount()
  if (total === 0) return { complaintsSynced: 0, resolutionsSynced: 0 }

  isSyncing = true
  if (!options?.silent) {
    toast.loading("Synchronizing offline civic dockets...", { id: "offline-syncing" })
  }

  try {
    const complaintsSynced = await syncOfflineComplaints()
    const resolutionsSynced = await syncOfflineQueue()

    if (!options?.silent) {
      toast.dismiss("offline-syncing")
      const totalSynced = complaintsSynced + resolutionsSynced
      if (totalSynced > 0) {
        toast.success(`Successfully synchronized ${totalSynced} offline record(s).`, {
          duration: 4000,
        })
      }
    }

    notifySyncCompleted({ complaintsSynced, resolutionsSynced })
    return { complaintsSynced, resolutionsSynced }
  } catch (err) {
    console.error("Offline sync error:", err)
    if (!options?.silent) toast.dismiss("offline-syncing")
    return { complaintsSynced: 0, resolutionsSynced: 0 }
  } finally {
    isSyncing = false
    notifyQueueChange()
  }
}

/**
 * Returns total count of all pending offline items
 */
export const getPendingOfflineCount = (): {
  total: number
  complaints: number
  resolutions: number
} => {
  const complaints = getOfflineComplaints().length
  const resolutions = getOfflineQueue().length
  return {
    total: complaints + resolutions,
    complaints,
    resolutions,
  }
}

// ─── Local Complaint Caching for Seamless Offline Read Access ─────────────────

export const cacheComplaintsLocally = (complaints: any[], total?: number) => {
  try {
    if (!Array.isArray(complaints)) return
    const payload = {
      complaints,
      total: total ?? complaints.length,
      cachedAt: Date.now(),
    }
    localStorage.setItem(CACHED_COMPLAINTS_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn("Could not cache complaints locally:", err)
  }
}

export const getCachedComplaintsLocally = (): { complaints: any[]; total: number } | null => {
  try {
    const raw = localStorage.getItem(CACHED_COMPLAINTS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const cacheStatsLocally = (stats: any) => {
  try {
    if (!stats) return
    localStorage.setItem(CACHED_STATS_KEY, JSON.stringify({ stats, cachedAt: Date.now() }))
  } catch {
    // ignore
  }
}

export const getCachedStatsLocally = (): any | null => {
  try {
    const raw = localStorage.getItem(CACHED_STATS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.stats || null
  } catch {
    return null
  }
}

/**
 * Injects a provisional offline complaint into local cache
 */
function injectProvisionalComplaint(item: OfflineComplaintItem) {
  try {
    const cached = getCachedComplaintsLocally() || { complaints: [], total: 0 }
    const provisional = {
      _id: item.id,
      id: item.id,
      complaintId: item.clientTicketId,
      title: item.title,
      description: item.description,
      category: item.category,
      status: "submitted",
      priority: item.priority || "medium",
      isAnonymous: item.isAnonymous,
      location: {
        address: item.locationAddress,
        city: item.locationCity || "Mumbai",
        state: item.locationState || "Maharashtra",
        pincode: item.locationPincode || "400028",
        coordinates:
          item.lat && item.lng
            ? { type: "Point", coordinates: [item.lng, item.lat] }
            : undefined,
      },
      attachments: (item.attachments || []).map((a) => ({
        url: a.base64,
        filename: a.filename,
        mimetype: a.mime,
        size: 0,
      })),
      statusHistory: [
        {
          status: "submitted",
          note: "Grievance securely queued in device offline storage. Sync will initiate once connection is restored.",
          changedAt: new Date(item.timestamp).toISOString(),
        },
      ],
      createdAt: new Date(item.timestamp).toISOString(),
      updatedAt: new Date(item.timestamp).toISOString(),
      isOfflinePending: true,
    }

    const updated = [provisional, ...cached.complaints]
    cacheComplaintsLocally(updated, cached.total + 1)
  } catch (err) {
    console.warn("Failed to inject provisional complaint:", err)
  }
}

/**
 * Replaces a provisional offline complaint with confirmed server data
 */
function replaceProvisionalComplaint(provisionalId: string, confirmedComplaint: any) {
  if (!confirmedComplaint) return
  try {
    const cached = getCachedComplaintsLocally()
    if (!cached) return
    const nextComplaints = cached.complaints.map((c) =>
      c._id === provisionalId || c.complaintId === provisionalId ? confirmedComplaint : c
    )
    cacheComplaintsLocally(nextComplaints, cached.total)
  } catch {
    // ignore
  }
}

// ─── Helpers: Event Dispatching & SW Sync ─────────────────────────────────────

function notifyQueueChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("smart_civic_offline_queue_changed", {
      detail: getPendingOfflineCount(),
    })
  )
}

function notifySyncCompleted(detail: { complaintsSynced: number; resolutionsSynced: number }) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("smart_civic_offline_sync_completed", { detail })
  )
}

function requestSwBackgroundSync() {
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "SyncManager" in window
  ) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if (reg.sync) {
          reg.sync.register("sync-offline-civic-tickets").catch(() => {})
        }
      })
      .catch(() => {})
  }
}

// ─── Global Event Listeners ───────────────────────────────────────────────────

if (typeof window !== "undefined") {
  // Auto-sync when internet returns
  window.addEventListener("online", () => {
    syncAllOfflineData()
  })

  // Listen for Service Worker background sync triggers
  window.addEventListener("smart_civic_sync_queue", () => {
    syncAllOfflineData({ silent: true })
  })
}

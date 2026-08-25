import api from "@/lib/axios"
import toast from "react-hot-toast"

export interface OfflineResolutionItem {
  id: string
  complaintId: string
  notes: string
  imageBase64: string
  filename: string
  timestamp: number
}

const STORAGE_KEY = "smart_civic_worker_offline_queue"

/**
 * Saves a resolution submission to local offline queue
 */
export const saveOfflineResolution = (item: Omit<OfflineResolutionItem, "id" | "timestamp">) => {
  try {
    const queue = getOfflineQueue()
    const newItem: OfflineResolutionItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    queue.push(newItem)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    toast.success("📱 Saved to offline queue! Will auto-sync when connection is restored.", {
      duration: 5000,
      icon: "💾",
    })
    return true
  } catch (err) {
    console.error("Failed to save offline item:", err)
    return false
  }
}

/**
 * Retrieves all items in the offline queue
 */
export const getOfflineQueue = (): OfflineResolutionItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Clears or removes an item from offline queue
 */
export const removeOfflineItem = (id: string) => {
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error("Failed to remove item from offline queue:", err)
  }
}

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
 * Synchronizes all queued items when internet returns
 */
export const syncOfflineQueue = async (onSuccess?: () => void) => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return

  let syncedCount = 0
  for (const item of queue) {
    try {
      const file = dataURLtoFile(item.imageBase64, item.filename || "offline_proof.jpg")
      const formData = new FormData()
      formData.append("resolutionImage", file)
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
    toast.success(`⚡ Synced ${syncedCount} offline task resolution(s) successfully!`, {
      icon: "🌐",
    })
    if (onSuccess) onSuccess()
  }
}

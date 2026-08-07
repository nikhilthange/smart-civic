import api from "@/lib/axios"

export interface AppNotification {
  _id: string
  recipient: string
  complaint?: string
  type: string
  title: string
  message: string
  isRead: boolean
  readAt?: string
  actionUrl?: string
  createdAt: string
}

export const notificationApi = {
  getAll: async (page = 1, limit = 20) => {
    const res = await api.get<{ success: boolean; notifications: AppNotification[]; unreadCount: number }>(
      "/notifications",
      { params: { page, limit } }
    )
    return res.data
  },

  markRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`, {})
    return res.data
  },

  markAllRead: async () => {
    const res = await api.patch("/notifications/read-all", {})
    return res.data
  },

  saveFcmToken: async (token: string) => {
    const res = await api.post("/notifications/fcm-token", { token })
    return res.data
  },

  removeFcmToken: async () => {
    const res = await api.delete("/notifications/fcm-token")
    return res.data
  },
}

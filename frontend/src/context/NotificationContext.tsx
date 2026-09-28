/**
 * NotificationContext.tsx
 *
 * Global context that manages notification state across the entire app:
 * - Shared unread count for the notification bell badge
 * - Shared notification list to avoid double-fetching between
 *   the NotificationBell dropdown and the /notifications page
 * - Real-time updates via WebSocket (SocketContext)
 * - FCM foreground message handling
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Bell, X } from "lucide-react"
import { notificationApi, type AppNotification } from "@/services/notificationApi"
import { onForegroundMessage, requestFCMToken } from "@/lib/firebase"
import { useSocket } from "@/context/SocketContext"
import { useAuth } from "@/context/AuthContext"
import { triggerHapticFeedback } from "@/utils/haptics"

// ─── Context shape ─────────────────────────────────────────────────────────────
interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteOne: (id: string) => Promise<void>
  clearRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  fetchNotifications: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  deleteOne: async () => {},
  clearRead: async () => {},
})

// ─── Provider ──────────────────────────────────────────────────────────────────
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const { socket } = useSocket()

  // Prevent state updates after unmount
  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      setLoading(true)
      const data = await notificationApi.getAll()
      if (!isMountedRef.current) return
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silently ignore
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [isAuthenticated, token])

  // ── Initial fetch + 60-second polling ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications, isAuthenticated, token])

  // ── FCM token registration ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return
    const initFCM = async () => {
      try {
        const fcmToken = await requestFCMToken()
        if (fcmToken) await notificationApi.saveFcmToken(fcmToken)
      } catch {
        // FCM not configured — skip silently
      }
    }
    initFCM()
  }, [isAuthenticated, token])

  // ── WebSocket live notifications ────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleSocketNotif = (payload: any) => {
      const notif: AppNotification = payload?.notification || payload
      const title  = notif?.title   || payload?.title   || "New Municipal Notification"
      const message = notif?.message || payload?.message || "You have a new civic update."
      const actionUrl = notif?.actionUrl || payload?.actionUrl

      triggerHapticFeedback("medium")

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id)
              if (actionUrl) navigate(actionUrl)
            }}
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-sm w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto border border-emerald-500/30 flex p-3.5 gap-3 items-start cursor-pointer hover:border-emerald-500 transition-all`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs">{title}</p>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">LIVE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed line-clamp-2">{message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
              aria-label="Dismiss"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        { duration: 6000 }
      )

      setUnreadCount((prev) => prev + 1)
      if (notif?._id) {
        setNotifications((prev) => [{ ...notif, isRead: false }, ...prev])
      } else {
        fetchNotifications()
      }
    }

    socket.on("notification", handleSocketNotif)
    socket.on("notification:new", handleSocketNotif)
    return () => {
      socket.off("notification", handleSocketNotif)
      socket.off("notification:new", handleSocketNotif)
    }
  }, [socket, navigate, fetchNotifications])

  // ── FCM foreground messages ─────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    onForegroundMessage((payload: any) => {
      const { title, body } = payload.notification || {}
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl pointer-events-auto border border-slate-200/80 dark:border-white/[0.08] flex p-3.5 gap-3 items-start`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-xs">{title || "Smart Civic"}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{body}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        { duration: 5000, position: "top-right" }
      )
      fetchNotifications()
    }).then((unsub) => { unsubscribe = unsub })
    return () => { if (unsubscribe) unsubscribe() }
  }, [fetchNotifications])

  // Keep fresh ref to notifications to reliably check state outside React batching
  const notificationsRef = useRef<AppNotification[]>([])
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  // ── Mutation helpers ────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markRead(id)
      const target = notificationsRef.current.find((n) => n._id === id)
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch { /* ignore */ }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Could not mark notifications as read")
    }
  }, [])

  const deleteOne = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteOne(id)
      const removed = notificationsRef.current.find((n) => n._id === id)
      if (removed && !removed.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      toast.success("Notification removed")
    } catch {
      toast.error("Could not delete notification")
    }
  }, [])

  const clearRead = useCallback(async () => {
    try {
      await notificationApi.clearRead()
      setNotifications((prev) => prev.filter((n) => !n.isRead))
      toast.success("Read notifications cleared")
    } catch {
      toast.error("Could not clear notifications")
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteOne,
        clearRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, BellRing, CheckCheck, ExternalLink, Loader2, X } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { useNavigate } from "react-router-dom"
import { notificationApi, type AppNotification } from "../../services/notificationApi"
import { requestFCMToken, messaging, onMessage } from "../../lib/firebase"
import toast from "react-hot-toast"

const TYPE_ICONS: Record<string, string> = {
  complaint_submitted:    "📋",
  complaint_assigned:     "👮",
  complaint_assigned_worker: "👷",
  complaint_status_update:"🔄",
  complaint_resolved:     "✅",
  complaint_rejected:     "❌",
  complaint_rework_requested: "⚠️",
  feedback_request:       "💬",
  general:                "📢",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notificationApi.getAll()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on open and poll every 60s when open
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Request FCM permission and register token on mount
  useEffect(() => {
    const initFCM = async () => {
      try {
        const token = await requestFCMToken()
        if (token) {
          await notificationApi.saveFcmToken(token)
        }
      } catch {
        // FCM not configured — silently skip
      }
    }
    initFCM()
  }, [])

  // Listen for foreground FCM messages
  useEffect(() => {
    if (!messaging) return
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {}
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto border border-slate-100 flex`}
          >
            <div className="flex-1 p-4">
              <p className="font-semibold text-slate-800 text-sm">{title || "Smart Civic"}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{body}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-2 text-slate-400 hover:text-slate-600 self-start"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ),
        { duration: 6000 }
      )
      fetchNotifications()
    })
    return () => unsubscribe()
  }, [fetchNotifications])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationApi.markRead(notif._id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setOpen((v) => !v)}
        id="notification-bell-btn"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-primary animate-bounce" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-[380px] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-white text-[10px] h-4 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Icon */}
                  <span className="text-xl shrink-0 mt-0.5">
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </span>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                        {notif.title}
                      </p>
                      {notif.actionUrl && (
                        <ExternalLink className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-slate-50 text-center">
            <button className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

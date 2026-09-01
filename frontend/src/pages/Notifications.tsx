import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Zap,
  Gift,
  RefreshCw,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notificationApi, type AppNotification } from "@/services/notificationApi"
import { EmptyState } from "@/components/common/EmptyState"
import { SkeletonActivityFeed } from "@/components/common/SkeletonLoader"
import { useSocket } from "@/context/SocketContext"
import { triggerHapticFeedback } from "@/utils/haptics"
import toast from "react-hot-toast"

type FilterTab = "all" | "unread" | "sla" | "rewards"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "sla_breached":
    case "complaint_rework_requested":
      return <Zap className="w-4 h-4 text-rose-500" />
    case "karma_awarded":
    case "reward_redeemed":
      return <Gift className="w-4 h-4 text-amber-500" />
    case "complaint_assigned":
    case "complaint_assigned_worker":
      return <ShieldAlert className="w-4 h-4 text-sky-500" />
    case "complaint_resolved":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case "ai_verified":
      return <Sparkles className="w-4 h-4 text-violet-500" />
    default:
      return <Building2 className="w-4 h-4 text-emerald-600" />
  }
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notificationApi.getAll()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  const { socket } = useSocket()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Live WebSocket notification receiver
  useEffect(() => {
    if (!socket) return

    const handleSocketNotif = (payload: any) => {
      const notif = payload?.notification || payload
      triggerHapticFeedback("medium")
      if (notif?.title) {
        toast.success(`Live Alert: ${notif.title}`, { icon: "🔔" })
      }
      setUnreadCount((prev) => prev + 1)
      if (notif?._id) {
        setNotifications((prev) => [notif, ...prev])
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
  }, [socket, fetchNotifications])

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Could not mark notifications as read")
    }
  }

  const handleClearAll = () => {
    setNotifications([])
    setUnreadCount(0)
    toast.success("Notification list cleared")
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markRead(notif._id)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // continue navigation
      }
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
    }
  }

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.isRead
    if (activeTab === "sla") {
      return (
        n.type?.includes("sla") ||
        n.type?.includes("assigned") ||
        n.type?.includes("rework") ||
        n.type?.includes("resolved")
      )
    }
    if (activeTab === "rewards") {
      return n.type?.includes("karma") || n.type?.includes("reward")
    }
    return true
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time status updates on filed grievances, SLA escalations, field dispatches, and civic rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark all read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 rounded-xl h-9 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear list</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "all"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>All</span>
          <span className="font-mono text-[10px] opacity-80">{notifications.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("unread")}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "unread"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>Unread</span>
          <span className="font-mono text-[10px] opacity-80">{unreadCount}</span>
        </button>

        <button
          onClick={() => setActiveTab("sla")}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "sla"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>SLA & Dispatches</span>
        </button>

        <button
          onClick={() => setActiveTab("rewards")}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "rewards"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Gift className="w-3 h-3" />
          <span>Karma & Rewards</span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNotifications}
          className="ml-auto text-slate-400 hover:text-emerald-600 h-8 px-2 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Notification List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-6">
            <SkeletonActivityFeed count={5} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={activeTab === "unread" ? "No unread alerts" : "No notifications found"}
              description={
                activeTab === "unread"
                  ? "You are all caught up! You'll receive real-time updates as your filed grievances advance through triage."
                  : "No notifications match this filter category."
              }
              icon={Bell}
              actionLabel="Return to Dashboard"
              onAction={() => navigate("/dashboard")}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredNotifications.map((notif) => {
              const icon = getNotificationIcon(notif.type)
              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                    !notif.isRead
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/[0.08] shadow-sm shrink-0 mt-0.5">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            !notif.isRead
                              ? "font-bold text-slate-900 dark:text-white"
                              : "font-medium text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.actionUrl && (
                      <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        <span>View Ticket Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

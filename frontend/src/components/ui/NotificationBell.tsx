/**
 * NotificationBell.tsx
 * Consumes the global NotificationContext — no duplicate fetches.
 */
import { useState, useEffect, useRef } from "react"
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  Zap,
  Gift,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Building2,
  Clock,
  ArrowRight,
  Trash2,
} from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { useNavigate } from "react-router-dom"
import type { AppNotification } from "../../services/notificationApi"
import { useNotifications } from "@/context/NotificationContext"

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
      return <Zap className="w-3.5 h-3.5 text-rose-500" />
    case "karma_awarded":
    case "reward_redeemed":
      return <Gift className="w-3.5 h-3.5 text-amber-500" />
    case "complaint_assigned":
    case "complaint_assigned_worker":
      return <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
    case "complaint_resolved":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    case "ai_verified":
      return <Sparkles className="w-3.5 h-3.5 text-violet-500" />
    default:
      return <Building2 className="w-3.5 h-3.5 text-emerald-600" />
  }
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, loading, markRead, markAllRead, deleteOne } =
    useNotifications()

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) await markRead(notif._id)
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setOpen(false)
    }
  }

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

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button with Pulsing Unread Badge */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((v) => !v)}
        id="notification-bell-btn"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold font-mono text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Sleek Frosted Glass Notification Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="font-bold font-display text-slate-900 dark:text-white text-xs sm:text-sm">
                Notifications
              </span>
              {unreadCount > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono h-4 px-1.5 rounded-full">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Bell className="h-7 w-7 opacity-30" />
                <p className="text-xs font-medium">No new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => {
                const icon = getNotificationIcon(notif.type)
                return (
                  <div
                    key={notif._id}
                    className={`p-3.5 transition-colors flex items-start gap-3 group ${
                      !notif.isRead ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    {/* Icon chip */}
                    <div
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/[0.06] shrink-0 mt-0.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs leading-snug ${
                              !notif.isRead
                                ? "font-bold text-slate-900 dark:text-white"
                                : "font-medium text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
                          )}
                        </div>
                        {notif.actionUrl && (
                          <ExternalLink className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Delete button — shows on group hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOne(notif._id) }}
                      aria-label="Delete notification"
                      className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 text-center">
            <button
              onClick={() => {
                setOpen(false)
                navigate("/notifications")
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 py-1 transition-colors"
            >
              <span>See all notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * LiveActivityFeed.tsx
 *
 * A real-time activity ticker for the Dashboard.
 * Shows live complaint events arriving over WebSocket.
 * Maintains a rolling window of the last 12 events.
 */
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  CheckCircle2,
  MapPin,
  UserCheck,
  Wrench,
  Bot,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useSocket } from "@/context/SocketContext"

interface ActivityEvent {
  id: string
  type: string
  title: string
  ward?: string
  category?: string
  timestamp: Date
}

const MAX_EVENTS = 12

function getEventIcon(type: string) {
  switch (type) {
    case "COMPLAINT_CREATED":
      return <Activity className="w-3.5 h-3.5 text-blue-500" />
    case "COMPLAINT_ASSIGNED":
      return <UserCheck className="w-3.5 h-3.5 text-sky-500" />
    case "STATUS_UPDATED":
      return <Wrench className="w-3.5 h-3.5 text-amber-500" />
    case "COMPLAINT_RESOLVED":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    case "NOTIFICATION":
      return <Bot className="w-3.5 h-3.5 text-violet-500" />
    default:
      return <Activity className="w-3.5 h-3.5 text-slate-400" />
  }
}

function getEventLabel(type: string, payload: any): string {
  const title = payload?.title || payload?.complaint?.title || payload?.notification?.title || "Civic event"
  switch (type) {
    case "COMPLAINT_CREATED":   return `New grievance filed: "${truncate(title, 38)}"`
    case "COMPLAINT_ASSIGNED":  return `Assigned: "${truncate(title, 38)}"`
    case "STATUS_UPDATED":      return `Status updated: "${truncate(title, 35)}"`
    case "COMPLAINT_RESOLVED":  return `Resolved: "${truncate(title, 40)}"`
    case "NOTIFICATION":        return payload?.notification?.title || title
    default:                    return `Update: "${truncate(title, 45)}"`
  }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str
}

function timeStr(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

export default function LiveActivityFeed() {
  const { isConnected, lastEvent } = useSocket()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const lastProcessedEventRef = useRef<any>(null)

  useEffect(() => {
    if (!lastEvent || lastProcessedEventRef.current === lastEvent) return
    lastProcessedEventRef.current = lastEvent

    const { type, payload } = lastEvent
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const event: ActivityEvent = {
      id,
      type,
      title: getEventLabel(type, payload),
      ward: payload?.ward || payload?.complaint?.ward || undefined,
      timestamp: new Date(),
    }

    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS))
  }, [lastEvent])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Live Municipal Feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400">Reconnecting</span>
            </>
          )}
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800/40 max-h-72 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
            <Wifi className="w-6 h-6 opacity-30" />
            <p className="text-xs font-medium">Listening for live civic events…</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600">Activity will appear here as it happens across Mumbai wards</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Icon chip */}
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {event.title}
                  </p>
                  {event.ward && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-mono">{event.ward}</span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeStr(event.timestamp)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

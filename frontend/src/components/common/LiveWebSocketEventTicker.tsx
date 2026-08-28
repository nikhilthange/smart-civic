import React, { useState, useEffect } from "react"
import { useSocket } from "@/context/SocketContext"

interface TickerEvent {
  id: string
  type: "ticket_created" | "sla_breach" | "iot_alert" | "subway_flood" | "audit_action"
  text: string
  timestamp: string
}

function LiveWebSocketEventTickerComponent() {
  const { lastEvent } = useSocket()
  const [events, setEvents] = useState<TickerEvent[]>([
    {
      id: "ev-01",
      type: "ticket_created",
      text: "New Pothole complaint SC-2026-9041 registered in Ward G-North (Dadar)",
      timestamp: "Just now",
    },
    {
      id: "ev-02",
      type: "iot_alert",
      text: "Smart Bin RFID-9921 fill level reached 88% on Senapati Bapat Marg",
      timestamp: "1m ago",
    },
    {
      id: "ev-03",
      type: "subway_flood",
      text: "Andheri Subway sensor recorded 32cm depth — barrier locked & flyover detour broadcasted",
      timestamp: "3m ago",
    },
  ])

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (lastEvent) {
      const msg = (lastEvent as any).message || (lastEvent as any).payload?.message || "Municipal Telemetry Broadcast"
      const newEv: TickerEvent = {
        id: `ev-${Date.now()}`,
        type: "ticket_created",
        text: `Live WebSocket Alert: ${lastEvent.type || "System Update"} — ${msg}`,
        timestamp: "Just now",
      }
      setEvents((prev) => [newEv, ...prev.slice(0, 5)])
    }
  }, [lastEvent])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [events.length])

  const current = events[currentIndex] || events[0]

  return (
    <div className="w-full h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 px-3 sm:px-4 flex items-center justify-between text-xs border-b border-emerald-100 dark:border-emerald-900/50 shadow-sm overflow-hidden shrink-0">
      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE STREAM</span>
        </div>

        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate animate-in fade-in transition-all">
          {current?.text}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400/80 shrink-0">
        <span className="font-semibold">WS: CONNECTED</span>
        <span>•</span>
        <span>{current?.timestamp}</span>
      </div>
    </div>
  )
}

export const LiveWebSocketEventTicker = React.memo(LiveWebSocketEventTickerComponent)


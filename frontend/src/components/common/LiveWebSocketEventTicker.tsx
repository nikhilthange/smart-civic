import React, { useState, useEffect } from "react"
import { useSocket } from "@/context/SocketContext"
import { Activity } from "lucide-react"

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
        text: `${lastEvent.type ? String(lastEvent.type).replace(/_/g, " ").toUpperCase() : "LIVE ALERT"}: ${msg}`,
        timestamp: "Just now",
      }
      setEvents((prev) => [newEv, ...prev.slice(0, 5)])
    }
  }, [lastEvent])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [events.length])

  const current = events[currentIndex] || events[0]

  return (
    <div className="w-full h-8 bg-slate-900 text-slate-300 dark:bg-zinc-950 dark:text-zinc-400 px-3 sm:px-6 flex items-center justify-between text-xs border-b border-slate-800/80 shrink-0 font-sans select-none">
      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </span>
        <span className="text-slate-600 dark:text-zinc-600 text-[11px]">•</span>
        <div className="text-[11px] text-slate-300 dark:text-zinc-300 truncate font-medium">
          {current?.text}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
        <Activity className="w-3 h-3 text-emerald-500" />
        <span>BMC WARD FEED</span>
        <span>•</span>
        <span>{current?.timestamp}</span>
      </div>
    </div>
  )
}

export const LiveWebSocketEventTicker = React.memo(LiveWebSocketEventTickerComponent)


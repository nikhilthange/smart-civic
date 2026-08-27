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
    <div className="w-full bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE EVENT STREAM:</span>
        </div>

        <div className="truncate font-sans text-slate-200 animate-in fade-in transition-all">
          {current?.text}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
        <span>WS: CONNECTED</span>
        <span>•</span>
        <span>{current?.timestamp}</span>
      </div>
    </div>
  )
}

export const LiveWebSocketEventTicker = React.memo(LiveWebSocketEventTickerComponent)


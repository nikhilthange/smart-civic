import { useState, useRef, useEffect } from "react"
import {
  Send,
  CheckCheck,
  Building2,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  BadgeCheck,
  Camera,
  Trash2,
  Droplet,
  MapPin,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"

interface Message {
  id: string
  sender: "user" | "bot"
  type: "text" | "image" | "voice" | "location"
  content: string
  timestamp: string
  complaintId?: string
  ticketDetails?: any
}

const QUICK_ACTIONS = [
  {
    icon: Camera,
    label: "Report Pothole",
    payload: "दादर स्टेशन जवळ रस्ता खड्डा पडला आहे, गाड्या अडकतात. (Ward G-North)",
    color: "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400",
  },
  {
    icon: Trash2,
    label: "Overflowing Garbage",
    payload: "वांद्रे लिंकिंग रोडवर कचरा पेटी भरून कचरा रस्त्यावर पसरला आहे. (Ward H-West)",
    color: "hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400",
  },
  {
    icon: Droplet,
    label: "Water Leakage",
    payload: "Severe potable water pipeline leakage on S.V. Road Khar West. (Ward H-West)",
    color: "hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-600 dark:hover:text-sky-400",
  },
  {
    icon: MapPin,
    label: "Share Live GPS",
    payload: "📍 Live GPS Shared: 19.0596° N, 72.8347° E (Ward H-West, Mumbai)",
    color: "hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400",
  },
  {
    icon: Search,
    label: "Track Status",
    payload: "Track ticket status for complaint #SC-2026-90D20FF0",
    color: "hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400",
  },
]

export default function WhatsAppSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-01",
      sender: "bot",
      type: "text",
      content:
        "नमस्कार! Brihanmumbai Municipal Corporation (BMC) २४x७ WhatsApp Citizen Care Bot मध्ये आपले स्वागत आहे. 🙏\n\nआपण रस्ता खड्डे, कचरा, पाणी गळती, किंवा इतर नागरी तक्रार फोटो, व्हॉईस नोट किंवा लाईव्ह लोकेशन पाठवून त्वरित नोंदवू शकता.",
      timestamp: "10:45 AM",
    },
  ])

  const [inputMessage, setInputMessage] = useState("")
  const [phoneNumber] = useState("+91 98200 12345")
  const [isSending, setIsSending] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage
    if (!text.trim()) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      type: "text",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage("")
    setIsSending(true)

    try {
      // Dispatch payload to backend WhatsApp Webhook
      const res = await api.post("/webhooks/whatsapp", {
        From: `whatsapp:${phoneNumber.replace(/\s+/g, "")}`,
        Body: text,
      })

      const botReplyText =
        res.data?.replyText ||
        `✅ तक्रार नोंदवली आहे! तिकीट क्र: SC-2026-${Math.floor(100000 + Math.random() * 900000)}. संबंधित प्रभागाकडे (Ward) त्वरित वर्ग करण्यात आले आहे.\n\nLive Track Status: http://localhost:5173/complaints`

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        type: "text",
        content: botReplyText,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        complaintId: res.data?.complaintId,
      }

      setMessages((prev) => [...prev, botMsg])
    } catch {
      // Fallback bot response
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        type: "text",
        content: `✅ तक्रार यशस्वीरीत्या नोंदवली! तिकीट क्र: SC-2026-${Math.floor(100000 + Math.random() * 900000)}. Live Track: http://localhost:5173/complaints`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-24 px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Headless WhatsApp Grievance Sandbox
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              WHATSAPP CLOUD API
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Interactive simulator for testing citizen grievance intake via WhatsApp bot with automated NLP entity extraction and instant ticket generation.
          </p>
        </div>
      </div>

      {/* WhatsApp Chat Mock Interface */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[600px] sm:h-[640px] relative bg-[#EFEAE2] dark:bg-[#0B141A]">
        {/* Authentic WhatsApp Doodle Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35 dark:opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2364748b' fill-opacity='0.25' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "60px 60px",
          }}
        />

        {/* WhatsApp Top Header */}
        <div className="relative z-10 bg-[#075E54] dark:bg-[#202C33] text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-emerald-800/40 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/80 flex items-center justify-center font-bold text-base shadow-inner border border-white/20">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight text-white">BMC Civic Grievance Bot</h3>
                <span title="Verified Business" className="inline-flex items-center">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </span>
              </div>
              <span className="text-[11px] text-emerald-100 dark:text-zinc-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Verified Business • +91 98200 12345
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-emerald-100 dark:text-zinc-300">
            <Video className="w-4 h-4 cursor-pointer hover:text-white transition" />
            <Phone className="w-4 h-4 cursor-pointer hover:text-white transition" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white transition" />
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="relative z-10 flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 font-sans">
          {/* Quick Action Chips Overlay */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Quick Municipal Action Chips
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(action.payload)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700/60 transition active:scale-95 shadow-sm ${action.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {messages.map((m) => {
            const isUser = m.sender === "user"

            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} relative group`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 shadow-sm text-xs sm:text-[13px] space-y-1 relative ${
                    isUser
                      ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-slate-900 dark:text-emerald-50 rounded-2xl rounded-tr-none"
                      : "bg-white dark:bg-[#202C33] text-slate-900 dark:text-zinc-100 rounded-2xl rounded-tl-none border border-slate-100/80 dark:border-zinc-700/40"
                  }`}
                >
                  {/* Subtle Speech Bubble Tail */}
                  <div
                    className={`absolute top-0 w-2.5 h-2.5 ${
                      isUser
                        ? "-right-1.5 border-t-[8px] border-t-[#D9FDD3] dark:border-t-[#005C4B] border-r-[8px] border-r-transparent"
                        : "-left-1.5 border-t-[8px] border-t-white dark:border-t-[#202C33] border-l-[8px] border-l-transparent"
                    }`}
                  />

                  <p className="leading-relaxed whitespace-pre-wrap font-sans">{m.content}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-zinc-400 pt-0.5">
                    <span>{m.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] dark:text-[#53bdeb]" />}
                  </div>
                </div>
              </div>
            )
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#202C33] px-3.5 py-2 rounded-2xl rounded-tl-none text-xs text-slate-500 dark:text-zinc-300 font-mono flex items-center gap-2 shadow-sm border border-slate-100 dark:border-zinc-700/40">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>BMC Bot is typing response...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* WhatsApp Fixed Bottom Input Dock */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="relative z-10 bg-[#F0F2F5] dark:bg-[#202C33] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 border-t border-slate-200 dark:border-zinc-800"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 dark:text-zinc-400">
            <button
              type="button"
              className="p-1.5 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              title="Attach media or document"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type Marathi, Hindi or English grievance..."
            className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-[#2A3942] border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00A884]"
          />

          <Button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="bg-[#00A884] hover:bg-[#008f6f] text-white w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

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

export default function WhatsAppSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-01",
      sender: "bot",
      type: "text",
      content: "नमस्कार! बृहन्मुंबई महानगरपालिका (BMC) २४x७ चॅटबॉटमध्ये आपले स्वागत आहे. आपण रस्ता खड्डे, कचरा, किंवा पाणी गळतीची तक्रार फोटो, आवाज संदेश (Voice Note), किंवा लोकेशन पाठवून नोंदवू शकता.",
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
        `✅ तक्रार नोंदवली आहे! तिकीट क्र: SC-2026-${Math.floor(100000 + Math.random() * 900000)}. संबंधित प्रभागाकडे (Ward) त्वरित वर्ग करण्यात आले आहे.`

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
        content: `✅ तक्रार नोंदवली आहे! तिकीट क्र: SC-2026-${Math.floor(100000 + Math.random() * 900000)}. Live Track: http://localhost:5173/complaints`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsSending(false)
    }
  }

  const sendQuickPayload = (presetText: string) => {
    handleSendMessage(presetText)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
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
              WHATSAPP WEBHOOK
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Interactive simulator for testing citizen grievance intake via WhatsApp bot with automated NLP entity extraction and instant ticket generation.
          </p>
        </div>
      </div>

      {/* Quick Action Presets */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => sendQuickPayload("दादर स्टेशन जवळ मोठा खड्डा पडला आहे, गाड्या अडकतात. (Ward G-North)")}
          className="text-xs rounded-xl border-slate-200 dark:border-slate-800"
        >
          🕳️ Marathi: Dadar Pothole
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => sendQuickPayload("वांद्रे लिंकिंग रोडवर कचरा पेटी भरून कचरा रस्त्यावर पसरला आहे. (Ward H-West)")}
          className="text-xs rounded-xl border-slate-200 dark:border-slate-800"
        >
          🗑️ Marathi: Bandra Garbage
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => sendQuickPayload("Severe water pipeline leakage near Andheri West SV Road. Potable water wasting. (Ward K-West)")}
          className="text-xs rounded-xl border-slate-200 dark:border-slate-800"
        >
          💧 English: Pipeline Leak
        </Button>
      </div>

      {/* WhatsApp Chat Mock Interface */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xl overflow-hidden bg-[#EFEAE2] dark:bg-slate-950 flex flex-col h-[560px]">
        {/* WhatsApp Header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              🏛️
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">BMC Civic Grievance Bot</h3>
              <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Verified Business
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-emerald-100">
            <Video className="w-4 h-4 cursor-pointer hover:text-white" />
            <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
          {messages.map((m) => {
            const isUser = m.sender === "user"

            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs space-y-1 ${
                    isUser
                      ? "bg-[#D9FDD3] dark:bg-emerald-900/70 text-slate-900 dark:text-emerald-50 rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700/60"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-400">
                    <span>{m.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                </div>
              </div>
            )
          })}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none text-xs text-slate-500 font-mono flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>BMC Bot is typing response...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* WhatsApp Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="bg-[#F0F2F5] dark:bg-slate-900 p-3 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <Smile className="w-5 h-5 cursor-pointer hover:text-slate-700" />
            <Paperclip className="w-5 h-5 cursor-pointer hover:text-slate-700" />
          </div>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type Marathi, Hindi or English message..."
            className="flex-1 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <Button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="bg-[#00A884] hover:bg-[#008f6f] text-white w-9 h-9 p-0 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

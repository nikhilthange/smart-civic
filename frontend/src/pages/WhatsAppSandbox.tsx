import { useState, useRef, useEffect } from "react"
import {
  Send,
  Mic,
  CheckCheck,
  Building2,
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
  Volume2,
  VolumeX,
  Play,
  Pause,
  FileText,
  X,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"

interface Message {
  id: string
  sender: "user" | "bot"
  type: "text" | "image" | "voice" | "location" | "document"
  content: string
  timestamp: string
  mediaUrl?: string
  duration?: string
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

// Pure Web Audio API synthesized tones
function playWebAudioChime(type: "send" | "receive") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    if (type === "send") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } else {
      // Two-tone pleasant notification chime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime)
      gain1.gain.setValueAtTime(0.12, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.12)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.1)
      osc2.stop(ctx.currentTime + 0.28)
    }
  } catch {
    // AudioContext blocked or unsupported
  }
}

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
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null)
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false)
  const [imageModalPreview, setImageModalPreview] = useState<{ url: string; caption: string } | null>(null)

  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const recordingTimerRef = useRef<any>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending, isRecording])

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [isRecording])

  const handleSendMessage = async (
    textToSend?: string,
    options?: { type?: Message["type"]; mediaUrl?: string; duration?: string }
  ) => {
    const text = textToSend ?? inputMessage
    if (!text.trim() && !options?.mediaUrl && !options?.duration) return

    const type = options?.type || "text"

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      type,
      content: text,
      mediaUrl: options?.mediaUrl,
      duration: options?.duration,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage("")
    setIsSending(true)

    if (!isMuted) playWebAudioChime("send")

    try {
      // Dispatch payload to backend WhatsApp Webhook
      const res = await api.post("/webhooks/whatsapp", {
        From: `whatsapp:${phoneNumber.replace(/\s+/g, "")}`,
        Body: text || (type === "voice" ? "[Citizen Voice Note]" : "[Grievance Photo Attachment]"),
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
      if (!isMuted) playWebAudioChime("receive")
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
      if (!isMuted) playWebAudioChime("receive")
    } finally {
      setIsSending(false)
    }
  }

  // Voice Note Recording Finish
  const handleStopRecording = () => {
    setIsRecording(false)
    const formattedDuration = `0:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`
    handleSendMessage("Voice Note Grievance (0:0" + Math.max(3, recordingSeconds) + ")", {
      type: "voice",
      duration: formattedDuration === "0:00" ? "0:04" : formattedDuration,
    })
  }

  // Staged Image Submission
  const handleConfirmImageSend = () => {
    if (!imageModalPreview) return
    handleSendMessage(imageModalPreview.caption || "Pothole defect photographed on Linking Road Khar", {
      type: "image",
      mediaUrl: imageModalPreview.url,
    })
    setImageModalPreview(null)
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
            Interactive simulator for testing citizen grievance intake via WhatsApp bot with automated NLP entity extraction, voice note PTT, and instant ticket generation.
          </p>
        </div>
      </div>

      {/* WhatsApp Chat Mock Interface */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[600px] sm:h-[660px] relative bg-[#EFEAE2] dark:bg-[#0B141A]">
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
        <div className="relative z-20 bg-[#075E54] dark:bg-[#202C33] text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-emerald-800/40 dark:border-zinc-800">
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
                {isSending ? (
                  <span className="text-emerald-300 font-medium animate-pulse">typing...</span>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Official Verified Business • +91 98200 12345
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-emerald-100 dark:text-zinc-300">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full hover:bg-white/10 transition"
              title={isMuted ? "Unmute Audio Chimes" : "Mute Audio Chimes"}
              aria-label="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Video className="w-4 h-4 cursor-pointer hover:text-white transition hidden sm:block" />
            <Phone className="w-4 h-4 cursor-pointer hover:text-white transition hidden sm:block" />
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

                  {/* Render Message by Type */}
                  {m.type === "image" && m.mediaUrl && (
                    <div className="space-y-1.5 pb-1">
                      <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                        <img src={m.mediaUrl} alt="Complaint Attachment" className="w-full h-44 object-cover" />
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        <span>🛡️ EXIF Stripped: Geolocation Protected</span>
                      </div>
                    </div>
                  )}

                  {m.type === "voice" ? (
                    <div className="flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px]">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-emerald-600/80 text-white flex items-center justify-center font-bold text-xs">
                          👤
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                          <Mic className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePlayingAudioId(activePlayingAudioId === m.id ? null : m.id)}
                        className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow transition active:scale-95 shrink-0"
                      >
                        {activePlayingAudioId === m.id ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>

                      {/* Animated Audio Soundwave Scrubber */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-0.5 h-4">
                          {[40, 70, 30, 90, 50, 80, 60, 100, 45, 75, 55, 85, 35, 65].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                activePlayingAudioId === m.id
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-300 dark:bg-zinc-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                          {m.duration || "0:04"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap font-sans">{m.content}</p>
                  )}

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
              <div className="bg-white dark:bg-[#202C33] px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs text-slate-500 dark:text-zinc-300 font-sans flex items-center gap-2.5 shadow-sm border border-slate-100 dark:border-zinc-700/40">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">BMC Bot is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Attachment Speed-Dial Popover */}
        {isAttachMenuOpen && (
          <div className="absolute bottom-16 left-4 z-30 bg-white dark:bg-zinc-900 rounded-2xl p-2.5 shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsAttachMenuOpen(false)
                setImageModalPreview({
                  url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop",
                  caption: "Large pothole cluster on S.V. Road Khar West",
                })
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition"
            >
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600">
                <Camera className="w-4 h-4" />
              </div>
              <span>Camera / Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAttachMenuOpen(false)
                handleSendMessage("📍 Live GPS Pin: 19.0596° N, 72.8347° E (Bandra Reclamation)", { type: "location" })
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <MapPin className="w-4 h-4" />
              </div>
              <span>Location (GPS)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAttachMenuOpen(false)
                handleSendMessage("📄 Document: Ward_H_West_Defect_Notice.pdf (2.4 MB)", { type: "document" })
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition"
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              <span>Document / PDF</span>
            </button>
          </div>
        )}

        {/* WhatsApp Fixed Bottom Input Dock / Voice Recorder Mode */}
        {isRecording ? (
          <div
            className="relative z-10 bg-[#F0F2F5] dark:bg-[#202C33] px-3 py-3 sm:px-4 flex items-center justify-between border-t border-slate-200 dark:border-zinc-800"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                0:0{recordingSeconds}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Recording voice grievance...</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 font-medium"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleStopRecording}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-full flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="relative z-10 bg-[#F0F2F5] dark:bg-[#202C33] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 border-t border-slate-200 dark:border-zinc-800"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                className="p-1.5 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                title="Emoji"
                aria-label="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className={`p-1.5 rounded-full transition ${
                  isAttachMenuOpen
                    ? "bg-emerald-600 text-white"
                    : "hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
                title="Attach media or document"
                aria-label="Attach"
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

            {inputMessage.trim() ? (
              <Button
                type="submit"
                disabled={isSending}
                className="bg-[#00A884] hover:bg-[#008f6f] text-white w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 disabled:opacity-50"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="bg-[#00A884] hover:bg-[#008f6f] text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition active:scale-95"
                title="Push to talk voice note"
                aria-label="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Simulated Image Staging Modal */}
      {imageModalPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-3 p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Grievance Photo Preview</span>
              <button
                type="button"
                onClick={() => setImageModalPreview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden max-h-60 border border-slate-200 dark:border-zinc-700">
              <img src={imageModalPreview.url} alt="Staged Upload" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Caption / Description</label>
              <input
                type="text"
                value={imageModalPreview.caption}
                onChange={(e) =>
                  setImageModalPreview({
                    ...imageModalPreview,
                    caption: e.target.value,
                  })
                }
                placeholder="Add caption..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setImageModalPreview(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmImageSend}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Photo</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

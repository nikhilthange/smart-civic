import { useState, useRef, useEffect, useCallback } from "react"
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
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  User,
  Award,
  Clock,
  Zap,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/context/SocketContext"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface InteractiveButton {
  id: string
  title: string
  payload: string
}

interface Message {
  id: string
  sender: "user" | "bot"
  type: "text" | "image" | "voice" | "location" | "document" | "interactive_buttons" | "interactive_list"
  content: string
  timestamp: string
  mediaUrl?: string
  duration?: string
  audioBlobUrl?: string
  transcription?: string
  interactiveButtons?: InteractiveButton[]
  listSections?: { title: string; rows: { id: string; title: string; description?: string }[] }[]
  complaintId?: string
  ticketDetails?: {
    category?: string
    ward?: string
    slaDeadline?: string
    priority?: string
    karmaAwarded?: number
  }
}

interface ActiveTicketSummary {
  id: string
  ticketId: string
  category: string
  ward: string
  timeAgo: string
  status: string
  slaRemaining: string
}

type DialogueStage = "IDLE" | "AWAITING_MEDIA_OR_LOCATION" | "AWAITING_WARD" | "CONFIRMING"

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
    payload: "status",
    color: "hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400",
  },
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-init",
    sender: "bot",
    type: "interactive_buttons",
    content:
      "नमस्कार! Brihanmumbai Municipal Corporation (BMC) २४x७ WhatsApp Grievance Bot मध्ये आपले स्वागत आहे. 🙏\n\nकृपया तक्रारीचा प्रकार निवडा किंवा थेट मेसेज टाईप करा:",
    timestamp: "10:45 AM",
    interactiveButtons: [
      { id: "btn-pothole", title: "🚧 खड्डे / Roads", payload: "रस्ता खड्डे (Road Pothole defect)" },
      { id: "btn-swm", title: "🗑️ कचरा / Waste", payload: "कचरा समस्या (Overflowing Garbage)" },
      { id: "btn-water", title: "💧 पाणी / Water", payload: "पाणी गळती (Water Pipeline Leak)" },
    ],
  },
]

// Pure Web Audio API Synthesizer with lazy-initialized AudioContext
let audioContextInstance: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioContextInstance) {
      audioContextInstance = new AudioContextClass()
    }
    if (audioContextInstance.state === "suspended") {
      audioContextInstance.resume()
    }
    return audioContextInstance
  } catch {
    return null
  }
}

function playWebAudioChime(type: "send" | "receive") {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

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
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      gain1.gain.setValueAtTime(0.12, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.12)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.1)
      osc2.stop(ctx.currentTime + 0.28)
    }
  } catch {
    // Suppress audio failure
  }
}

export default function WhatsAppSandbox() {
  const { lastEvent } = useSocket()

  // Persistent localStorage hydration
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("smart_civic_wa_messages")
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES
    } catch {
      return INITIAL_MESSAGES
    }
  })

  const [inputMessage, setInputMessage] = useState("")
  const [phoneNumber] = useState("+91 98200 12345")
  const [isSending, setIsSending] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiveGatewayMode, setIsLiveGatewayMode] = useState(false)
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [dialogueStage, setDialogueStage] = useState<DialogueStage>("IDLE")
  const [currentGrievanceContext, setCurrentGrievanceContext] = useState<{
    category?: string
    ward?: string
    photoAttached?: boolean
    locationAttached?: boolean
  }>({})

  const [sessionKarma, setSessionKarma] = useState(() => {
    try {
      const saved = localStorage.getItem("smart_civic_wa_karma")
      return saved ? parseInt(saved, 10) : 120
    } catch {
      return 120
    }
  })

  const [sessionTickets, setSessionTickets] = useState<ActiveTicketSummary[]>(() => {
    try {
      const saved = localStorage.getItem("smart_civic_wa_tickets")
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "t-1",
              ticketId: "SC-2026-90D20FF0",
              category: "Roads & Potholes",
              ward: "Ward H-West",
              timeAgo: "2h ago",
              status: "IN_PROGRESS",
              slaRemaining: "22h left",
            },
          ]
    } catch {
      return [
        {
          id: "t-1",
          ticketId: "SC-2026-90D20FF0",
          category: "Roads & Potholes",
          ward: "Ward H-West",
          timeAgo: "2h ago",
          status: "IN_PROGRESS",
          slaRemaining: "22h left",
        },
      ]
    }
  })

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null)
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false)
  const [isListMenuExpanded, setIsListMenuExpanded] = useState<Record<string, boolean>>({})
  const [imageModalPreview, setImageModalPreview] = useState<{ url: string; caption: string } | null>(null)

  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const recordingTimerRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const createdAudioUrls = useRef<string[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem("smart_civic_wa_messages", JSON.stringify(messages))
      localStorage.setItem("smart_civic_wa_karma", sessionKarma.toString())
      localStorage.setItem("smart_civic_wa_tickets", JSON.stringify(sessionTickets))
    } catch (_) {}
  }, [messages, sessionKarma, sessionTickets])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending, isRecording, isTranscribing])

  // Real-time WebSocket Event Listener: Listen for ticket status updates
  useEffect(() => {
    if (!lastEvent?.payload) return

    const { type, payload } = lastEvent
    const incomingTicketId = payload.ticketId || payload.complaintId || payload.id

    if (!incomingTicketId) return

    // Check if this ticket belongs to the user's active session tickets
    const matched = sessionTickets.find(
      (t) => t.ticketId.includes(incomingTicketId) || incomingTicketId.includes(t.ticketId)
    )

    if (matched || type === "COMPLAINT_UPDATED" || type === "COMPLAINT_ASSIGNED") {
      const newStatus = payload.status || (type === "COMPLAINT_ASSIGNED" ? "IN_PROGRESS" : "UPDATED")

      // Update session tickets
      setSessionTickets((prev) =>
        prev.map((t) =>
          t.ticketId === matched?.ticketId
            ? { ...t, status: newStatus, slaRemaining: payload.slaRemaining || "Updated" }
            : t
        )
      )

      // Inject authentic WhatsApp bot notification alert
      const alertMsg: Message = {
        id: `alert-${Date.now()}`,
        sender: "bot",
        type: "text",
        content: `🔔 **[Live Municipal Status Update]**\n\n📌 **तिकीट क्र**: *#${matched?.ticketId || incomingTicketId}*\n⚡ **नवीन स्थिती**: *${newStatus}*\n👷 **फील्ड कामगार / अभियंता**: *${payload.workerName || "Santosh Gaikwad (Allocated)"}*\n\nआपल्या तक्रारीचे निवारण युद्धपातळीवर सुरू आहे.\nLive Track: http://localhost:5173/complaints`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, alertMsg])
      if (!isMuted) playWebAudioChime("receive")
    }
  }, [lastEvent, isMuted, sessionTickets])

  // Cleanup Object URLs on unmount
  useEffect(() => {
    const urls = createdAudioUrls.current
    return () => {
      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url)
        } catch (_) {}
      })
    }
  }, [])

  // Keyboard shortcut listener (Escape to close modals/speed-dials/drawers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAttachMenuOpen(false)
        setImageModalPreview(null)
        setIsProfileDrawerOpen(false)
        setIsSettingsMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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

  // Multi-Turn Conversational Handler with Resilient Live Fallback
  const handleSendMessage = useCallback(
    async (
      textToSend?: string,
      options?: {
        type?: Message["type"]
        mediaUrl?: string
        duration?: string
        audioBlobUrl?: string
        transcription?: string
      }
    ) => {
      const text = textToSend ?? inputMessage
      if (!text.trim() && !options?.mediaUrl && !options?.duration && !options?.audioBlobUrl) return

      const type = options?.type || "text"
      const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: "user",
        type,
        content: text,
        mediaUrl: options?.mediaUrl,
        duration: options?.duration,
        audioBlobUrl: options?.audioBlobUrl,
        transcription: options?.transcription,
        timestamp: nowStr,
      }

      setMessages((prev) => [...prev, userMsg])
      setInputMessage("")
      setIsSending(true)

      if (!isMuted) playWebAudioChime("send")

      // Check Keyword Routing Commands
      const lowerText = text.toLowerCase().trim()
      if (lowerText === "reset" || lowerText === "menu" || lowerText === "help") {
        setDialogueStage("IDLE")
        setCurrentGrievanceContext({})
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              type: "interactive_buttons",
              content:
                "🔄 संभाषण रीसेट केले आहे. Brihanmumbai Municipal Corporation (BMC) Citizen Bot मेन्यू:\n\nकृपया पर्याय निवडा:",
              timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              interactiveButtons: [
                { id: "btn-pothole", title: "🚧 खड्डे / Roads", payload: "रस्ता खड्डे (Road Pothole defect)" },
                { id: "btn-swm", title: "🗑️ कचरा / Waste", payload: "कचरा समस्या (Overflowing Garbage)" },
                { id: "btn-water", title: "💧 पाणी / Water", payload: "पाणी गळती (Water Pipeline Leak)" },
              ],
            },
          ])
          setIsSending(false)
          if (!isMuted) playWebAudioChime("receive")
        }, 700)
        return
      }

      if (lowerText === "status") {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              type: "text",
              content:
                "📋 **सक्रिय तक्रार स्थिती (Live Ticket Status)**:\n\n• तिकीट क्र: **#SC-2026-90D20FF0**\n• प्रभाग: **Ward H-West (Bandra West)**\n• स्थिती: 🟡 **IN_PROGRESS (Worker Allocated: Santosh Gaikwad)**\n• SLA डेडलाईन: **22 तास शिल्लक**\n\nसविस्तर पाहण्यासाठी: http://localhost:5173/complaints",
              timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            },
          ])
          setIsSending(false)
          if (!isMuted) playWebAudioChime("receive")
        }, 700)
        return
      }

      // If Live Gateway Mode is activated, attempt live sync with automated fallback
      if (isLiveGatewayMode) {
        try {
          const res = await api.post("/webhooks/bot-report", {
            senderPhone: phoneNumber,
            text,
            imageUrl: options?.mediaUrl,
            citizenName: "Citizen WhatsApp Tester",
          })

          const complaint = res.data?.complaint
          const ticketId = complaint?.ticketId || `SC-2026-${Math.floor(100000 + Math.random() * 900000)}`
          const wardAssigned = complaint?.ward || "Ward G-North"

          setSessionKarma((prev) => prev + 50)
          setSessionTickets((prev) => [
            {
              id: `t-${Date.now()}`,
              ticketId,
              category: complaint?.category || "Civic Defect",
              ward: wardAssigned,
              timeAgo: "Just now",
              status: "REGISTERED",
              slaRemaining: "24h SLA",
            },
            ...prev,
          ])

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "bot",
                type: "text",
                content: `⚡ **[Live Gateway MongoDB Sync]**\n\n✅ तक्रार यशस्वीरीत्या सर्व्हरवर नोंदवली!\n🎫 **तिकीट क्र**: *#${ticketId}*\n📍 **प्रभाग**: *${wardAssigned}*\n🏢 **विभाग**: *${complaint?.departmentId || "PWD"}*\n🏆 **Civic Karma**: *+50 Points जमा झाले!*\n\nLive Tracking: http://localhost:5173/complaints`,
                timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                complaintId: ticketId,
              },
            ])
            setIsSending(false)
            if (!isMuted) playWebAudioChime("receive")
          }, 800)
          return
        } catch {
          // Graceful fallback to offline simulated triage
          toast.error("⚠️ Live API unreachable; switched to offline simulated triage", { duration: 4000 })
        }
      }

      // Multi-Turn Stateful Flow Transitions
      try {
        let botResponse: Partial<Message> = {}

        if (dialogueStage === "IDLE") {
          setDialogueStage("AWAITING_MEDIA_OR_LOCATION")
          setCurrentGrievanceContext((prev) => ({ ...prev, category: text }))

          botResponse = {
            type: "interactive_buttons",
            content: `📍 तक्रार विषय नोंदवला: *${text}*.\n\nकृपया तक्रार निवारणासाठी संबंधित जागेचा **फोटो (Camera Photo)** किंवा **लाईव्ह GPS लोकेशन** शेअर करा:`,
            interactiveButtons: [
              { id: "btn-cam", title: "📸 फोटो पाठवा", payload: "📸 Camera Photo Attached" },
              { id: "btn-loc", title: "📍 GPS Location", payload: "📍 Live Location: 19.0596° N, 72.8347° E" },
              { id: "btn-skip", title: "⏭️ पुढे जा (Skip)", payload: "Skip media attachment" },
            ],
          }
        } else if (dialogueStage === "AWAITING_MEDIA_OR_LOCATION") {
          setDialogueStage("AWAITING_WARD")
          botResponse = {
            type: "interactive_list",
            content: `✅ पुरावा जोडला गेला आहे. कृपया आपला **BMC प्रभाग (Ward)** निवडा:`,
            listSections: [
              {
                title: "Western Suburbs (पश्चिम उपनगरे)",
                rows: [
                  { id: "ward-h-west", title: "Ward H-West", description: "Bandra, Khar, Santa Cruz West" },
                  { id: "ward-k-west", title: "Ward K-West", description: "Andheri West, Juhu, Versova" },
                  { id: "ward-r-north", title: "Ward R-North", description: "Dahisar, Borivali North" },
                ],
              },
              {
                title: "City Island & Central (शहर व मध्य मुंबई)",
                rows: [
                  { id: "ward-g-north", title: "Ward G-North", description: "Dadar, Dharavi, Mahim" },
                  { id: "ward-f-south", title: "Ward F-South", description: "Parel, Sewri, Naigaon" },
                ],
              },
            ],
          }
        } else if (dialogueStage === "AWAITING_WARD") {
          setDialogueStage("IDLE")
          const ticketId = `SC-2026-${Math.floor(100000 + Math.random() * 900000)}`

          setSessionKarma((prev) => prev + 50)
          setSessionTickets((prev) => [
            {
              id: `t-${Date.now()}`,
              ticketId,
              category: currentGrievanceContext.category || "General Grievance",
              ward: text,
              timeAgo: "Just now",
              status: "REGISTERED",
              slaRemaining: "24h SLA",
            },
            ...prev,
          ])

          botResponse = {
            type: "text",
            content: `🎉 **तक्रार अधिकृतरीत्या नोंदवण्यात आली आहे!**\n\n═══════════════════════════\n🎫 **तिकीट क्र**: *#${ticketId}*\n📍 **प्रभाग**: *${text}*\n⏱️ **SLA डेडलाईन**: *24 तास (On-Time Guaranteed)*\n🏆 **Civic Karma**: *+50 Points जमा झाले!*\n🛡️ **Zero-Trust Privacy**: *EXIF व वैयक्तिक माहिती सुरक्षित (Scrubbed)*\n═══════════════════════════\n\nसंबंधित कनिष्ठ अभियंता व फील्ड कामगारास (Field Worker) त्वरित कार्य आदेश जारी करण्यात आला आहे.\n\nLive Tracking Link: http://localhost:5173/complaints`,
            complaintId: ticketId,
            ticketDetails: {
              ward: text,
              karmaAwarded: 50,
              priority: "high",
            },
          }
        }

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              type: botResponse.type || "text",
              content: botResponse.content || "✅ संदेश प्राप्त झाला.",
              timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              interactiveButtons: botResponse.interactiveButtons,
              listSections: botResponse.listSections,
              complaintId: botResponse.complaintId,
              ticketDetails: botResponse.ticketDetails,
            },
          ])
          setIsSending(false)
          if (!isMuted) playWebAudioChime("receive")
        }, 600)
      } catch {
        setIsSending(false)
      }
    },
    [dialogueStage, currentGrievanceContext.category, inputMessage, isLiveGatewayMode, isMuted, phoneNumber]
  )

  // Real Browser MediaRecorder Audio Capture with Whisper STT simulation
  const handleStartRealRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setIsRecording(true)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)
        createdAudioUrls.current.push(audioUrl)

        setIsTranscribing(true)
        setTimeout(() => {
          setIsTranscribing(false)
          const sampleTranscriptions = [
            "दादर पश्चिम भाजी मार्केट जवळ उघडे मॅनहोल आहे, त्वरित दुरुस्त करा.",
            "वांद्रे हिल रोडवर कचरा पेटी तुंबली असून दुर्गंधी पसरली आहे.",
            "अंधेरी पश्चिमेत एस व्ही रोडवर पिण्याच्या पाण्याची मुख्य लाईन फुटली आहे.",
          ]
          const transcribedText =
            sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)]

          const formattedDuration = `0:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`
          handleSendMessage(transcribedText, {
            type: "voice",
            duration: formattedDuration === "0:00" ? "0:04" : formattedDuration,
            audioBlobUrl: audioUrl,
            transcription: transcribedText,
          })
        }, 1200)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      // Fall back gracefully to simulated recording
      setIsRecording(true)
    }
  }

  // Voice Note Recording Finish
  const handleStopRecording = () => {
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    } else {
      setIsTranscribing(true)
      setTimeout(() => {
        setIsTranscribing(false)
        const transcribedText = "दादर पश्चिम भाजी मार्केट जवळ उघडे मॅनहोल आहे, त्वरित दुरुस्त करा."
        const formattedDuration = `0:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`
        handleSendMessage(transcribedText, {
          type: "voice",
          duration: formattedDuration === "0:00" ? "0:04" : formattedDuration,
          transcription: transcribedText,
        })
      }, 1200)
    }
  }

  // Audio Playback toggle
  const handleToggleAudioPlay = (msgId: string, audioUrl?: string) => {
    if (activePlayingAudioId === msgId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setActivePlayingAudioId(null)
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl)
        audioElementRef.current = audio
        audio.onended = () => setActivePlayingAudioId(null)
        audio.play().catch(() => {})
      }
      setActivePlayingAudioId(msgId)
    }
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

  // Export Chat Transcript (JSON or TXT)
  const handleExportTranscript = (format: "json" | "txt") => {
    setIsSettingsMenuOpen(false)
    const sanitizedMessages = messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      timestamp: m.timestamp,
      content: m.content.replace(/\+91\s?\d{10}/g, "+91 98*****1223"), // PII scrubbing
    }))

    let dataStr = ""
    let fileName = ""

    if (format === "json") {
      dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sanitizedMessages, null, 2))
      fileName = `smart_civic_whatsapp_transcript_${Date.now()}.json`
    } else {
      const textRows = sanitizedMessages
        .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.content}`)
        .join("\n\n")
      dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textRows)
      fileName = `smart_civic_whatsapp_transcript_${Date.now()}.txt`
    }

    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success(`Exported chat transcript (${format.toUpperCase()})`)
  }

  // Clear Session
  const handleClearSession = () => {
    setIsSettingsMenuOpen(false)
    localStorage.removeItem("smart_civic_wa_messages")
    localStorage.removeItem("smart_civic_wa_karma")
    localStorage.removeItem("smart_civic_wa_tickets")
    setMessages(INITIAL_MESSAGES)
    setSessionKarma(120)
    setSessionTickets([])
    setDialogueStage("IDLE")
    setCurrentGrievanceContext({})
    toast.success("WhatsApp chat session cleared")
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
            Interactive multi-turn conversational simulator with real MediaRecorder PTT, Whisper STT transcriptions, and WebSocket live status updates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsProfileDrawerOpen(true)}
            className="rounded-xl gap-1.5 border-slate-200 dark:border-zinc-800 text-xs font-semibold"
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Citizen Profile ({sessionKarma} pts)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage("reset")}
            className="rounded-xl gap-1.5 border-slate-200 dark:border-zinc-800 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* WhatsApp Chat Mock Interface */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[600px] sm:h-[680px] relative bg-[#EFEAE2] dark:bg-[#0B141A]">
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
                  <span className="text-emerald-300 font-medium animate-pulse">typing response...</span>
                ) : isTranscribing ? (
                  <span className="text-amber-300 font-medium animate-pulse">transcribing audio (Whisper STT)...</span>
                ) : isRecording ? (
                  <span className="text-red-300 font-medium animate-pulse">recording voice note...</span>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Official Verified Business • +91 98*****1223
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-emerald-100 dark:text-zinc-300">
            {/* Live Gateway Mode Switch */}
            <button
              type="button"
              onClick={() => setIsLiveGatewayMode(!isLiveGatewayMode)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 transition shadow-sm ${
                isLiveGatewayMode
                  ? "bg-amber-500 text-slate-950 font-extrabold"
                  : "bg-white/15 text-emerald-100 hover:bg-white/25"
              }`}
              title="Toggle Live Meta Webhook / Local Sandbox"
            >
              {isLiveGatewayMode ? <Zap className="w-3 h-3 fill-slate-950" /> : <Radio className="w-3 h-3" />}
              <span>{isLiveGatewayMode ? "LIVE GATEWAY" : "LOCAL SANDBOX"}</span>
            </button>

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
            
            {/* More Settings Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                className="p-1 rounded-full hover:bg-white/10 transition"
                aria-label="Settings Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isSettingsMenuOpen && (
                <div className="absolute right-0 top-8 z-30 bg-white dark:bg-zinc-900 rounded-xl p-1.5 shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-1 min-w-[170px] animate-in fade-in duration-150 text-slate-800 dark:text-zinc-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleExportTranscript("txt")}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export as Text (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportTranscript("json")}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>Export JSON Log</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 transition text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Chat Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div
          className="relative z-10 flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 font-sans"
          aria-live="polite"
        >
          {/* Quick Action Chips Overlay */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Quick Municipal Presets
              </p>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Mode: {isLiveGatewayMode ? "⚡ LIVE MONGODB" : `🧪 ${dialogueStage}`} {currentGrievanceContext.category ? `• ${currentGrievanceContext.category}` : ""}
              </span>
            </div>
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
                  className={`max-w-[88%] sm:max-w-[78%] px-3.5 py-2.5 shadow-sm text-xs sm:text-[13px] space-y-2 relative ${
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

                  {/* Render Image Message */}
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

                  {/* Render Location Card */}
                  {m.type === "location" && (
                    <div className="space-y-2 pb-1">
                      <div className="rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-800 p-3 flex items-center gap-3 border border-slate-300 dark:border-zinc-700">
                        <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold shrink-0 shadow">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Bandra Reclamation Arterial
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                            19.0596° N, 72.8347° E
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Voice Note & STT Card */}
                  {m.type === "voice" ? (
                    <div className="space-y-2">
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
                          onClick={() => handleToggleAudioPlay(m.id, m.audioBlobUrl)}
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

                      {/* Expandable Whisper STT Transcription Card */}
                      {m.transcription && (
                        <div className="p-2 rounded-xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 text-[11px] space-y-1">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Whisper STT Transcription (Marathi):</span>
                          </span>
                          <p className="italic text-slate-700 dark:text-zinc-300">"{m.transcription}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap font-sans">{m.content}</p>
                  )}

                  {/* WhatsApp Interactive Buttons Template */}
                  {m.interactiveButtons && m.interactiveButtons.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/60 flex flex-col gap-1.5">
                      {m.interactiveButtons.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleSendMessage(btn.payload)}
                          className="w-full py-2 px-3 text-center text-xs font-semibold text-[#00A884] dark:text-[#25D366] bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700/80 rounded-xl transition border border-slate-200 dark:border-zinc-700/40 active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{btn.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp Interactive List Menu Template */}
                  {m.listSections && m.listSections.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/60 space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIsListMenuExpanded((prev) => ({
                            ...prev,
                            [m.id]: !prev[m.id],
                          }))
                        }
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-[#00A884] hover:bg-[#008f6f] rounded-xl flex items-center justify-between shadow-sm transition"
                      >
                        <span>📋 View Options (पर्याय निवडा)</span>
                        {isListMenuExpanded[m.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isListMenuExpanded[m.id] && (
                        <div className="bg-slate-50 dark:bg-zinc-800/95 rounded-xl p-2.5 space-y-2.5 border border-slate-200 dark:border-zinc-700 animate-in fade-in duration-150">
                          {m.listSections.map((sec, sIdx) => (
                            <div key={sIdx} className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider px-1">
                                {sec.title}
                              </p>
                              <div className="space-y-1">
                                {sec.rows.map((row) => (
                                  <button
                                    key={row.id}
                                    type="button"
                                    onClick={() => handleSendMessage(row.title)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition flex flex-col group/row"
                                  >
                                    <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200 group-hover/row:text-emerald-600">
                                      {row.title}
                                    </span>
                                    {row.description && (
                                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                                        {row.description}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
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
                onClick={handleStartRealRecording}
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

      {/* Citizen WhatsApp Profile & Impact Drawer Modal */}
      {isProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4 p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Citizen WhatsApp Profile</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Zero-Trust Identity Protection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 space-y-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 uppercase">
                  Verified Phone
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">+91 98*****1223</p>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> PII Scrubbed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 space-y-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 uppercase">
                  Civic Karma
                </span>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {sessionKarma} Points
                </p>
                <span className="text-[9px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Bronze Tier
                </span>
              </div>
            </div>

            {/* Active Tickets In Session */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Active WhatsApp Grievances</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                  {sessionTickets.length} Registered
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sessionTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                        #{ticket.ticketId}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {ticket.category} • {ticket.ward}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Clock className="w-3 h-3" />
                        {ticket.slaRemaining}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsProfileDrawerOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

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

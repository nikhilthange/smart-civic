import { useState, useRef, useEffect } from "react"
import { Mic, Square, Sparkles, Volume2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"

interface VoiceGrievanceRecorderProps {
  onTranscriptionComplete?: (data: {
    text: string
    category: string
    department: string
    ward: string
    landmark: string
    title: string
    description: string
  }) => void
}

export default function VoiceGrievanceRecorder({ onTranscriptionComplete }: VoiceGrievanceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop()
        } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop()
          } catch (_) {}
        })
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Setup audio visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
        await processAudioGrievance()
      }

      mediaRecorder.start(200)
      setIsRecording(true)
      drawWaveform()
      toast.success("Recording Marathi / Hindi / English audio...", { icon: "🎙️" })
    } catch (err) {
      toast.error("Microphone access denied or unsupported in browser.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2.2
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85
        ctx.fillStyle = isRecording ? "rgba(225, 29, 72, 0.85)" : "rgba(100, 116, 139, 0.5)"
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 2
      }
    }

    render()
  }

  const processAudioGrievance = async () => {
    setIsProcessing(true)
    try {
      // Simulate NLP entity extraction with vernacular pipeline
      const sampleTranscripts = [
        {
          text: "दादर स्टेशन जवळ रस्त्यावर मोठा खड्डा पडला आहे, गाड्या अडकतात. (Ward G-North)",
          category: "roads_and_infrastructure",
          department: "PWD",
          ward: "Ward G-North",
          landmark: "Dadar Western Railway Station",
          title: "मोठा खड्डा - Dadar Station Road",
          description: "Citizen reported severe road crater causing traffic snarls near Dadar Station.",
        },
        {
          text: "वांद्रे लिंकिंग रोडवर कचरा पेटी भरून कचरा रस्त्यावर पसरला आहे. (Ward H-West)",
          category: "garbage_collection",
          department: "SWM",
          ward: "Ward H-West",
          landmark: "Linking Road Shopping Area, Bandra West",
          title: "कचरा समस्या - Bandra Linking Road",
          description: "Solid waste bin overflowing onto pedestrian footpath.",
        },
        {
          text: "अंधेरी पश्चिम मध्ये मुख्य पाणी पुरवठा पाईप फुटली आहे. (Ward K-West)",
          category: "water_and_sanitation",
          department: "WSD",
          ward: "Ward K-West",
          landmark: "S.V. Road Andheri West",
          title: "पाणी गळती - Andheri West Pipeline Burst",
          description: "Drinking water pipeline ruptured with continuous potable water loss.",
        },
      ]

      const chosen = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]

      setTranscriptionResult(chosen)
      if (onTranscriptionComplete) {
        onTranscriptionComplete(chosen)
      }
      toast.success("Voice transcribed & form auto-populated!", { icon: "✨" })
    } catch {
      toast.error("Audio entity parsing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold font-display text-slate-900 dark:text-white">
            Vernacular Voice Intake (मराठी / हिंदी / English)
          </span>
        </div>
        <Badge className="bg-rose-600/10 text-rose-600 border-rose-500/20 text-[10px] font-mono">
          WEB AUDIO API
        </Badge>
      </div>

      {/* Live Audio Visualizer Canvas */}
      <div className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1.5 overflow-hidden">
        <canvas ref={canvasRef} width={380} height={50} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5 shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Voice Grievance</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold h-9 gap-1.5 animate-pulse"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop & Process Speech</span>
          </Button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Transcribing...</span>
          </div>
        )}
      </div>

      {/* Transcription Preview Bubble */}
      {transcriptionResult && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-semibold text-[11px]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vernacular Speech Transcription</span>
            </span>
            <Badge className="bg-rose-600 text-white text-[10px]">{transcriptionResult.department}</Badge>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-sans italic text-[11px]">
            "{transcriptionResult.text}"
          </p>
          <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-0.5 border-t border-rose-200/50 dark:border-rose-900/40">
            <span>Ward: <strong>{transcriptionResult.ward}</strong></span>
            <span>Landmark: {transcriptionResult.landmark}</span>
          </div>
        </div>
      )}
    </div>
  )
}

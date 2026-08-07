import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  language?: string
  className?: string
  label?: string
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceInput({
  onTranscript,
  className = "",
  label,
}: VoiceInputProps) {
  const { t, i18n } = useTranslation()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionApi) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognitionApi()
    recognition.continuous = false
    recognition.interimResults = true

    // Map language code to BCP 47 locale tag
    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
    }
    recognition.lang = langMap[i18n.language.slice(0, 2)] || "en-IN"

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript)
        toast.success("Voice transcript captured!")
      }
    }

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition warning:", event.error)
      setIsListening(false)
      if (event.error !== "no-speech") {
        toast.error("Microphone issue: " + event.error)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [i18n.language, onTranscript])

  const toggleListening = () => {
    if (!isSupported) {
      toast.error(t("voice_input_error", "Speech recognition is not supported in this browser."))
      return
    }

    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast(t("listening", "Listening... Speak your complaint details"), { icon: "🎙️" })
      } catch (err) {
        console.error("Mic start error:", err)
        setIsListening(false)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
        isListening
          ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-300"
          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
      } ${className}`}
      title={isListening ? t("stop_listening", "Stop Listening") : t("speak_to_type", "Click mic to speak")}
    >
      {isListening ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{t("listening", "Listening...")}</span>
          <MicOff className="h-3.5 w-3.5 ml-1" />
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5 text-indigo-600" />
          <span>{label || t("speak_to_type", "Click mic to speak")}</span>
        </>
      )}
    </button>
  )
}

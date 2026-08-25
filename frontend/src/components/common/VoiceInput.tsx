import React, { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Globe } from "lucide-react"
import toast from "react-hot-toast"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  className?: string
}

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिंदी (Hindi)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
]

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = "" }) => {
  const [isListening, setIsListening] = useState<boolean>(false)
  const [selectedLang, setSelectedLang] = useState<string>("en-IN")
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
    }
  }, [])

  const startListening = () => {
    if (!isSupported) {
      toast.error("Speech Recognition is not supported in this browser. Please use Chrome/Edge.")
      return
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = selectedLang
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
        toast("🎙️ Listening... Speak your grievance clearly", {
          icon: "🎤",
          duration: 3000,
        })
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " "
          }
        }
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone permissions.")
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err.message)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Language Selector */}
      <div className="relative inline-flex items-center">
        <Globe className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
        <select
          value={selectedLang}
          onChange={(e) => {
            setSelectedLang(e.target.value)
            if (isListening) {
              stopListening()
            }
          }}
          disabled={isListening}
          className="text-[11px] font-semibold pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Microphone Toggle Button */}
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? "Stop Voice Dictation" : "Start Voice Dictation"}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
          isListening
            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-300 dark:ring-red-950"
            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800"
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span>Listening... (Stop)</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Dictation</span>
          </>
        )}
      </button>
    </div>
  )
}

import { useState, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface TextToSpeechButtonProps {
  text: string
  lang?: string
  size?: "sm" | "default" | "icon"
  className?: string
}

export function TextToSpeechButton({
  text,
  lang,
  size = "sm",
  className = "",
}: TextToSpeechButtonProps) {
  const { i18n } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)

  const currentLang = lang || (i18n.language ? i18n.language.slice(0, 2) : "en")

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!("speechSynthesis" in window)) {
      return
    }

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    if (currentLang === "mr") {
      utterance.lang = "mr-IN"
    } else if (currentLang === "hi") {
      utterance.lang = "hi-IN"
    } else {
      utterance.lang = "en-IN"
    }

    utterance.rate = 0.95

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleSpeak}
      title={isPlaying ? "Stop reading" : "Read status update aloud (TTS)"}
      className={`rounded-xl text-xs gap-1.5 transition-all ${
        isPlaying
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          : "text-slate-600 dark:text-slate-300 hover:text-emerald-600"
      } ${className}`}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span className="text-[11px] font-semibold">Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold">Read Aloud</span>
        </>
      )}
    </Button>
  )
}

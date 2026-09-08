import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language ? i18n.language.slice(0, 2) : "en"

  const setLanguage = (code: string) => {
    i18n.changeLanguage(code)
    try {
      localStorage.setItem("smart_civic_lang", code)
    } catch {
      // ignore
    }
  }

  const languages = [
    { code: "en", label: "EN" },
    { code: "mr", label: "मराठी" },
    { code: "hi", label: "हिंदी" },
  ]

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
      <div className="px-1.5 text-zinc-400 dark:text-zinc-500">
        <Globe className="h-3.5 w-3.5" />
      </div>
      {languages.map((lang) => {
        const isActive = currentLanguage === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
              isActive
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold border border-zinc-200/50 dark:border-zinc-700/50"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
            }`}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

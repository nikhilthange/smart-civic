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
    <div className="inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shrink-0">
      <div className="px-1 sm:px-1.5 text-slate-400 dark:text-slate-500">
        <Globe className="h-3.5 w-3.5" />
      </div>
      {languages.map((lang) => {
        const isActive = currentLanguage === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-lg transition-all duration-150 ${
              isActive
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language ? i18n.language.slice(0, 2) : "en"

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    try {
      localStorage.setItem("smart_civic_lang", lang)
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
    <div 
      role="group" 
      aria-label="Language selection" 
      className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 text-xs shadow-xs"
    >
      <div className="px-1 text-slate-500 dark:text-slate-400 flex items-center justify-center" aria-hidden="true">
        <Globe className="w-3.5 h-3.5" />
      </div>
      {languages.map((lang) => {
        const isActive = currentLang === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isActive
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            }`}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language || "en"

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    try {
      localStorage.setItem("smart_civic_lang", lang)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-mono font-bold">
      <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded-lg transition-all ${
          currentLang.startsWith("en")
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage("mr")}
        className={`px-2 py-0.5 rounded-lg transition-all ${
          currentLang.startsWith("mr")
            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-sans font-bold"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-sans"
        }`}
      >
        मराठी
      </button>

      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`px-2 py-0.5 rounded-lg transition-all ${
          currentLang.startsWith("hi")
            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-sans font-bold"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-sans"
        }`}
      >
        हिंदी
      </button>
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language ? i18n.language.slice(0, 2) : "en"

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    try {
      localStorage.setItem("smart_civic_lang", code)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono font-bold">
      <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5 mr-0.5" />
      <button
        type="button"
        onClick={() => handleLanguageChange("en")}
        className={`px-2 py-0.5 rounded-full transition-all text-[11px] ${
          currentLang === "en"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => handleLanguageChange("mr")}
        className={`px-2 py-0.5 rounded-full transition-all text-[11px] font-sans ${
          currentLang === "mr"
            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-bold"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        मराठी
      </button>

      <button
        type="button"
        onClick={() => handleLanguageChange("hi")}
        className={`px-2 py-0.5 rounded-full transition-all text-[11px] font-sans ${
          currentLang === "hi"
            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-bold"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        हिंदी
      </button>
    </div>
  )
}

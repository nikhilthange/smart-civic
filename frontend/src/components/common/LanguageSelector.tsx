import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem("smart_civic_lang", code)
  }

  return (
    <div className="relative flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-1 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
      <Globe className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <select
        value={i18n.language.slice(0, 2)}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
        aria-label="Select Language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}

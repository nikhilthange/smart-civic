import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StickyMobileCta() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after user scrolls down 300px on mobile
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center gap-2.5 max-w-md mx-auto">
            <Button
              asChild
              className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <Link to="/auth">
                <PlusCircle className="w-4 h-4" />
                <span>Report Issue</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Link to="/track">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Track Status</span>
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

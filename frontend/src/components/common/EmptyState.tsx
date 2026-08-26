import type { LucideIcon } from "lucide-react"
import { Inbox, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center ${className}`}
    >
      {/* Soft Emerald Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white max-w-sm">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md font-sans leading-relaxed">
        {description}
      </p>

      {children && <div className="mt-4 w-full max-w-md">{children}</div>}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 py-2 shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all gap-1.5"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className="border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
export default EmptyState

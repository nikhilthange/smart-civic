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
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center ${className}`}
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
          <Icon className="w-7 h-7" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 max-w-sm">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
        {description}
      </p>

      {children && <div className="mt-4 w-full max-w-md">{children}</div>}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 py-2 shadow-xs active:scale-[0.98] transition-all gap-1.5 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className="border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
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

import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, ChevronRight, Home } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  showBackButton?: boolean
  backFallbackUrl?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  showBackButton = true,
  backFallbackUrl = "/dashboard",
  backLabel = "Back",
  className = "",
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(backFallbackUrl)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Navigation Bar: Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-2.5 flex-wrap">
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all shadow-2xs font-medium cursor-pointer"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </button>
          )}

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap text-xs">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                title="Home Dashboard"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />
                    {crumb.href && !isLast ? (
                      <Link
                        to={crumb.href}
                        className="hover:text-slate-900 dark:hover:text-zinc-100 transition truncate max-w-[140px] sm:max-w-xs"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={`truncate max-w-[160px] sm:max-w-xs ${isLast ? "font-semibold text-slate-800 dark:text-zinc-200" : ""}`}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                )
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader

export function SkeletonKpiCard({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-8 w-8 bg-emerald-500/10 rounded-xl" />
          </div>
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonMap({ height = "400px" }: { height?: string }) {
  return (
    <div
      style={{ height }}
      className="w-full relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-900/90 shadow-inner flex flex-col items-center justify-center p-6 animate-pulse"
    >
      {/* Radar Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute h-48 w-48 rounded-full border border-emerald-500/20 animate-ping opacity-30" />
      <div className="absolute h-24 w-24 rounded-full border border-teal-500/30" />
      
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-44 bg-slate-700/60 rounded-md mx-auto" />
          <div className="h-3 w-60 bg-slate-800/60 rounded mx-auto" />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="h-6 w-28 bg-slate-800/80 rounded-lg border border-slate-700/50" />
        <div className="h-6 w-20 bg-slate-800/80 rounded-lg border border-slate-700/50" />
      </div>
    </div>
  )
}

export function SkeletonActivityFeed({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm animate-pulse flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          </div>
          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-pulse">
      <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`h-3.5 bg-slate-200 dark:bg-slate-800 rounded ${c === 0 ? "w-1/4" : "w-1/6"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

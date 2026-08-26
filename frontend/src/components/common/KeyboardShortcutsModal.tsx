import { Keyboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUT_GROUPS = [
  {
    group: "Navigation & Command",
    shortcuts: [
      { key: "⌘ K / Ctrl+K", desc: "Open global command palette" },
      { key: "? / Shift+/", desc: "Open keyboard shortcuts cheat sheet" },
      { key: "Esc", desc: "Close active modal, palette or drawer" },
    ],
  },
  {
    group: "Ticket List & Queue Operations",
    shortcuts: [
      { key: "J", desc: "Select next ticket in queue" },
      { key: "K", desc: "Select previous ticket in queue" },
      { key: "E", desc: "Quick-escalate selected ticket to Critical SLA" },
      { key: "R", desc: "Open field resolution proof drawer" },
      { key: "Enter", desc: "Inspect selected complaint details" },
    ],
  },
  {
    group: "Radar & GIS Map Views",
    shortcuts: [
      { key: "M", desc: "Toggle between Map View and Grid View" },
      { key: "C", desc: "Toggle Clustered Pins and Heatmap" },
      { key: "T", desc: "Focus timeline playback scrubber" },
    ],
  },
]

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-slate-100/10 text-slate-900 dark:text-white">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Power-User Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Quick commands and shortcuts for rapid municipal triage.
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group} className="space-y-2.5">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {group.group}
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl divide-y divide-slate-200/60 dark:divide-slate-700/60 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                {group.shortcuts.map((s) => (
                  <div key={s.key} className="p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium font-sans">
                      {s.desc}
                    </span>
                    <kbd className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
          Press <kbd className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">?</kbd> at any time to open this cheat sheet.
        </div>
      </div>
    </div>
  )
}

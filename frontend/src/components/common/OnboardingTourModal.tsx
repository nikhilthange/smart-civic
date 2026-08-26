import { useState, useEffect } from "react"
import { Camera, Truck, Trophy, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const TOUR_STEPS = [
  {
    step: 1,
    title: "1-Click Snap & Send AI Triage",
    desc: "Take a photo of any civic issue. Our Edge Vision AI auto-extracts GPS coordinates, tags the correct Ward, and files the grievance instantly.",
    icon: Camera,
    color: "from-emerald-500 to-teal-600",
    badge: "STEP 1 OF 3",
  },
  {
    step: 2,
    title: "Live Field Crew Dispatch Radar",
    desc: "Track assigned municipal Jetpatcher trucks and SWM compactors in real-time with live GPS telemetry, speed meters, and traffic ETAs.",
    icon: Truck,
    color: "from-sky-500 to-indigo-600",
    badge: "STEP 2 OF 3",
  },
  {
    step: 3,
    title: "Earn Civic Karma & Rewards",
    desc: "Gain Civic Karma credits for verified reports and ALM waste segregation. Redeem for 5% Property Tax Rebates and BEST transit passes.",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
    badge: "STEP 3 OF 3",
  },
]

export function OnboardingTourModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    try {
      const hasSeenTour = localStorage.getItem("smart_civic_onboarding_seen")
      if (!hasSeenTour) {
        // Auto show after 1.5s on first visit
        const timer = setTimeout(() => setIsOpen(true), 1500)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleClose = (dontShowAgain = true) => {
    setIsOpen(false)
    if (dontShowAgain) {
      try {
        localStorage.setItem("smart_civic_onboarding_seen", "true")
      } catch {
        // ignore
      }
    }
  }

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleClose(true)
    }
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStepIndex]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Step Visual Banner */}
        <div className={`p-8 bg-gradient-to-br ${step.color} text-white flex flex-col items-center justify-center text-center relative`}>
          <button
            onClick={() => handleClose(true)}
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>

          <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/20 mb-1">
            {step.badge}
          </span>
          <h2 className="text-xl font-bold font-display tracking-tight">{step.title}</h2>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center">
            {step.desc}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStepIndex ? "w-6 bg-emerald-600" : "w-2 bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleClose(true)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              Skip Tour
            </button>

            <Button
              onClick={handleNext}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-emerald-600/20 px-5"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Get Started" : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

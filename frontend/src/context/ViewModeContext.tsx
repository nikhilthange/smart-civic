import React, { createContext, useContext, useState, useEffect } from "react"

interface ViewModeContextType {
  isEasyView: boolean
  toggleEasyView: () => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [isEasyView, setIsEasyView] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_civic_easy_view") === "true"
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("smart_civic_easy_view", isEasyView ? "true" : "false")
      if (isEasyView) {
        document.documentElement.classList.add("easy-view-mode")
      } else {
        document.documentElement.classList.remove("easy-view-mode")
      }
    } catch {
      // ignore
    }
  }, [isEasyView])

  const toggleEasyView = () => {
    setIsEasyView((prev) => !prev)
  }

  return (
    <ViewModeContext.Provider value={{ isEasyView, toggleEasyView }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider")
  }
  return context
}

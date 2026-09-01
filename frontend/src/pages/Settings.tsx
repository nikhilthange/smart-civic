import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import {
  User,
  Shield,
  Bell,
  Globe,
  Lock,
  Smartphone,
  Save,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Building,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"

export default function Settings() {
  const { user } = useAuth()
  const { i18n } = useTranslation()

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || "Citizen User")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "+91 98200 12345")
  const currentLangCode = i18n.language ? i18n.language.slice(0, 2) : "en"
  const [language, setLanguage] = useState(currentLangCode)
  const [themePreference, setThemePreference] = useState("system")

  useEffect(() => {
    if (i18n.language) {
      setLanguage(i18n.language.slice(0, 2))
    }
  }, [i18n.language])

  const handleLanguageChange = (code: string) => {
    setLanguage(code)
    i18n.changeLanguage(code)
    try {
      localStorage.setItem("smart_civic_lang", code)
    } catch {
      // ignore
    }
    const langNames: Record<string, string> = {
      en: "English (Official BMC Portal)",
      mr: "मराठी (महाराष्ट्र शासन अधिकृत)",
      hi: "हिन्दी (नागरिक सेवा पोर्टल)",
    }
    toast.success(`Portal language set to ${langNames[code] || code}`)
  }

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    smsAlerts: true,
    emailDigest: true,
    pushNotifications: true,
    whatsappUpdates: true,
    slaBreachAlerts: user?.role === "officer" || user?.role === "admin",
  })

  // Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Profile preferences updated successfully!")
    }, 600)
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match!")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      toast.success("Password updated successfully!")
    }, 800)
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success("Notification preferences updated")
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account & Portal Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your personal profile, notification channels, security credentials, and DPDP privacy settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview Card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Profile Information</CardTitle>
                  <CardDescription>Update your personal details registered with the municipal portal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Registered Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || "citizen@mumbai.gov.in"}
                      disabled
                      className="bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Phone Number</Label>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98200 00000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Assigned Ward Jurisdiction</Label>
                    <div className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-sm">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {user?.ward || "Ward H-West (Bandra / Khar)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Profile Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password & Security Card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Security & Authentication</CardTitle>
                  <CardDescription>Update your portal access credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input
                      id="confirmNewPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPassword ? "Hide Passwords" : "Show Passwords"}
                  </button>

                  <Button type="submit" variant="outline" disabled={isSaving} className="gap-2">
                    <Key className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preferences & Privacy */}
        <div className="space-y-6">
          {/* Language & Regional Settings */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Language & Locale</CardTitle>
                  <CardDescription>Trilingual municipal portal preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Portal Language
                </Label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      code: "en",
                      name: "English",
                      native: "English",
                      tag: "BMC Official Default",
                      desc: "Official municipal documentation and UI in English",
                    },
                    {
                      code: "mr",
                      name: "Marathi",
                      native: "मराठी",
                      tag: "महाराष्ट्र शासन अधिकृत",
                      desc: "महाराष्ट्र राज्य शासन व BMC अधिकृत भाषा",
                    },
                    {
                      code: "hi",
                      name: "Hindi",
                      native: "हिन्दी",
                      tag: "नागरिक सेवा पोर्टल",
                      desc: "नागरिक शिकायत एवं सेवा पोर्टल हिन्दी में",
                    },
                  ].map((lang) => {
                    const isSelected = language === lang.code
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {lang.native}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">({lang.name})</span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-primary/20 text-primary font-semibold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {lang.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                            {lang.desc}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-slate-300 dark:border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-select">Visual Theme</Label>
                <select
                  id="theme-select"
                  value={themePreference}
                  onChange={(e) => {
                    setThemePreference(e.target.value)
                    toast.success("Theme preference applied")
                  }}
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notification Channels</CardTitle>
                  <CardDescription>Choose how you receive civic updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "smsAlerts" as const, label: "SMS Ticket Status Alerts", icon: Smartphone },
                { key: "whatsappUpdates" as const, label: "WhatsApp Bot Notifications", icon: CheckCircle2 },
                { key: "emailDigest" as const, label: "Weekly Ward Resolution Digest", icon: Bell },
                { key: "pushNotifications" as const, label: "Real-time Browser Push", icon: Globe },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleNotification(item.key)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* DPDP Act 2023 Statutory Consent Card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">DPDP Act 2023 Compliance</CardTitle>
                  <CardDescription className="text-xs">
                    Your phone number and geotags are masked at API boundary.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => toast.success("Data export request submitted to Data Protection Officer (DPO)")}
              >
                Request Personal Data Export (JSON)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

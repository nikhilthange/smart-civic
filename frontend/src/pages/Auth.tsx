import { useState, useEffect } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Building2,
  UserCheck,
  ShieldCheck,
  Lock,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"
import { LanguageToggle } from "@/components/common/LanguageToggle"
import { useTranslation } from "react-i18next"

export default function Auth() {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [portalType, setPortalType] = useState<"citizen" | "staff">("citizen")
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // 60-second cooldown timer for resend action
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    phoneNumber: string
    role: "citizen" | "officer" | "worker" | "admin"
    ward: string
  }>({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "citizen",
    ward: "Ward H-West",
  })

  const {
    user,
    login,
    register,
    loginWithFirebaseGoogle,
    loginWithFirebaseEmail,
    registerWithFirebaseEmail,
    resendEmailVerification,
    isLoading,
    isAuthenticated,
  } = useAuth()
  const navigate = useNavigate()

  const getTargetRoute = (fallbackRole?: string) => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.role === "officer") return "/officer-portal"
        if (u.role === "worker") return "/worker-queue"
        if (u.role === "admin") return "/admin"
        if (u.role === "citizen") return "/dashboard"
      }
    } catch {}
    if (fallbackRole === "officer") return "/officer-portal"
    if (fallbackRole === "worker") return "/worker-queue"
    if (fallbackRole === "admin") return "/admin"
    return "/dashboard"
  }

  // If already authenticated redirect away to appropriate role dashboard
  if (isAuthenticated) {
    return <Navigate to={getTargetRoute(user?.role)} replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    setLocalError(null)
  }

  const handlePortalSwitch = (type: "citizen" | "staff") => {
    setPortalType(type)
    setLocalError(null)
    if (type === "staff") {
      setFormData((prev) => ({
        ...prev,
        role: prev.role === "citizen" ? "officer" : prev.role,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        role: "citizen",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setResendSuccess(null)

    if (!isLogin && formData.password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    try {
      if (isLogin) {
        try {
          await loginWithFirebaseEmail({ email: formData.email, password: formData.password })
          navigate(getTargetRoute(formData.role), { replace: true })
        } catch (err: any) {
          if (err.message === "EMAIL_NOT_VERIFIED") {
            setVerificationEmail(formData.email)
            setNeedsVerification(true)
            setResendCooldown(60)
            return
          }
          // If Firebase rejects credentials, try backend login fallback
          try {
            await login({ email: formData.email, password: formData.password })
            navigate(getTargetRoute(formData.role), { replace: true })
          } catch {
            throw err
          }
        }
      } else {
        // Sign Up Flow (Firebase Auth email verification - No auto-login)
        try {
          const res = await registerWithFirebaseEmail({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            ward: formData.ward,
            phoneNumber: formData.phoneNumber || undefined,
          })
          if (res.needsVerification) {
            setVerificationEmail(formData.email)
            setNeedsVerification(true)
            setResendCooldown(60)
            return
          }
        } catch (firebaseErr: any) {
          if (firebaseErr?.message?.includes("auth/email-already-in-use")) {
            throw new Error("This email address is already registered. Please sign in.")
          }
          await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            ward: formData.ward,
            phoneNumber: formData.phoneNumber || undefined,
          })
          navigate(getTargetRoute(formData.role), { replace: true })
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "EMAIL_NOT_VERIFIED") {
          setVerificationEmail(formData.email)
          setNeedsVerification(true)
          setResendCooldown(60)
          return
        }
        setLocalError(err.message)
      }
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setLocalError(null)
    setResendSuccess(null)
    setNeedsVerification(false)
    setConfirmPassword("")
    setFormData({
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: portalType === "staff" ? "officer" : "citizen",
      ward: "Ward H-West",
    })
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-950 font-sans">
      {/* ═══ LEFT HERO PANEL: MUMBAI MUNICIPAL HERITAGE ARCHITECTURE ═══ */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Background Photograph */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700"
          style={{ backgroundImage: "url('/bmc_heritage_bg.jpg')" }}
        />
        {/* Atmospheric Institutional Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />

        {/* Top Civic Brand Identity */}
        <div className="relative z-10 space-y-3">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <SmartCivicLogo className="w-11 h-11 rounded-xl shadow-md border border-white/20" />
            <div>
              <p className="text-white font-black text-xl tracking-tight leading-tight">
                {t("auth.corporationName", "Brihanmumbai Municipal Corporation")}
              </p>
              <p className="text-emerald-400 text-xs font-semibold tracking-wide">
                {t("auth.corporationSub", "बृहन्मुंबई महानगरपालिका • Smart Civic AI")}
              </p>
            </div>
          </Link>
        </div>

        {/* Center Civic Governance Pillar Highlights */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-emerald-300 border border-white/15 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {t("auth.unifiedPortal", "Unified Municipal Portal")}
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t("auth.heroTitle", "Official Grievance Redressal & SLA Governance Platform")}
            </h1>
            <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
              {t("auth.heroSubtitle", "Serving citizens, municipal ward officers, and field repair crews across all 24 administrative wards with AI computer-vision triage and verified field audit proofs.")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white space-y-1">
              <p className="text-xs text-slate-300 font-mono uppercase tracking-wider">{t("auth.coverageLabel", "Coverage")}</p>
              <p className="text-base font-bold text-white">{t("auth.coverageTitle", "24 Mumbai Wards")}</p>
              <p className="text-xs text-slate-200 font-medium">{t("auth.coverageSubtitle", "Colaba to Dahisar & Mulund")}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white space-y-1">
              <p className="text-xs text-slate-300 font-mono uppercase tracking-wider">{t("auth.mandateLabel", "Rapid Mandate")}</p>
              <p className="text-base font-bold text-white">{t("auth.mandateTitle", "48-Hour SLA")}</p>
              <p className="text-xs text-slate-200 font-medium">{t("auth.mandateSubtitle", "Pothole & Solid Waste protocol")}</p>
            </div>
          </div>
        </div>

        {/* Bottom Civic Support & Copyright */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("auth.helpline", "24x7 BMC Helpline: 1916")}</span>
          </div>
          <p className="text-slate-400 text-xs">
            © 2026 {t("auth.corporationName", "Brihanmumbai Municipal Corporation")}
          </p>
        </div>
      </div>

      {/* ═══ RIGHT AUTHENTICATION PANEL ═══ */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Mobile Header (Visible only on < lg) */}
        <div className="w-full max-w-md flex items-center justify-between mb-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2.5">
            <SmartCivicLogo className="w-9 h-9 rounded-xl shadow-xs" />
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                Smart Civic AI
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                BMC Greater Mumbai
              </span>
            </div>
          </Link>
          <LanguageToggle />
        </div>

        {/* Main Authentication Card */}
        <div className="w-full max-w-md">
          {needsVerification ? (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
              <CardHeader className="space-y-2 text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t("auth.checkEmail", "Check your email & verify, then log in")}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {t("auth.verificationSentTo", "We've sent a verification link to:")}
                </CardDescription>
                <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 break-all">
                  {verificationEmail}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-2 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("auth.verificationInstructions", "Please click the link in your email to activate your account. Once verified, click below to log in.")}
                </p>

                {resendSuccess && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {localError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-400">
                    {localError}
                  </div>
                )}

                <Button
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-semibold cursor-pointer"
                  onClick={() => {
                    setNeedsVerification(false)
                    setIsLogin(true)
                    setLocalError(null)
                    setResendSuccess(null)
                  }}
                >
                  {t("auth.verifiedLoginBtn", "I have verified my email — Sign In")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[44px] rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer"
                  disabled={isResending || resendCooldown > 0}
                  onClick={async () => {
                    if (!formData.password) {
                      setLocalError(t("auth.enterPasswordForResend", "Please enter your password or sign in to request a fresh verification link."))
                      setNeedsVerification(false)
                      setIsLogin(true)
                      return
                    }

                    setIsResending(true)
                    setLocalError(null)
                    setResendSuccess(null)
                    try {
                      await resendEmailVerification(verificationEmail, formData.password)
                      setResendSuccess(t("auth.resendSuccess", "Verification email resent successfully! Check your inbox."))
                      setResendCooldown(60)
                    } catch (err: any) {
                      setLocalError(err.message || t("auth.resendFailed", "Could not resend email. Please try again."))
                    } finally {
                      setIsResending(false)
                    }
                  }}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.resending", "Resending...")}
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin text-slate-400" />
                      {t("auth.resendIn", { seconds: resendCooldown, defaultValue: `Resend in ${resendCooldown}s` })}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t("auth.resendVerification", "Resend verification email")}
                    </>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="pt-0 pb-6">
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mx-auto flex items-center gap-1.5 min-h-[44px] py-2 px-3 cursor-pointer"
                  onClick={() => {
                    setNeedsVerification(false)
                    setLocalError(null)
                    setResendSuccess(null)
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.backToHome", "Back to Sign In")}
                </button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
              {/* Card Header with in-card language switcher */}
              <CardHeader className="space-y-3 pb-4 sm:pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SmartCivicLogo className="w-6 h-6 rounded-md" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                      Civic Auth
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <LanguageToggle />
                  </div>
                </div>

                {/* Portal Mode Switcher (Citizen vs Municipal Staff) */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch("citizen")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      portalType === "citizen"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{t("auth.tabCitizen", "Citizen Portal")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch("staff")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      portalType === "staff"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t("auth.tabStaff", "Municipal Staff & Field Crew")}</span>
                  </button>
                </div>

                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {portalType === "staff"
                      ? isLogin ? t("auth.staffSignIn", "Municipal Staff Portal") : t("auth.staffRegister", "Register Municipal Staff")
                      : isLogin ? t("auth.citizenSignIn", "Citizen Sign In") : t("auth.citizenCreateAccount", "Create Citizen Account")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {portalType === "staff"
                      ? isLogin
                        ? t("auth.staffSignInDesc", "Official access for BMC Ward Officers, Sub-Engineers, and Field Repair Crews.")
                        : t("auth.staffRegisterDesc", "Register as an authorized BMC field supervisor or ward squad engineer.")
                      : isLogin
                        ? t("auth.citizenSignInDesc", "Sign in to report civic issues, track 48h SLA progress, and earn Civic Karma.")
                        : t("auth.citizenRegisterDesc", "Create a verified citizen account for automated grievance tracking & SMS alerts.")}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Banner */}
                {localError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-400">
                    {localError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {portalType === "staff" ? t("auth.fullName", "Official Full Name") : t("auth.fullName", "Full Name")}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("auth.fullNamePlaceholder", "Enter full name")}
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                        autoComplete="name"
                        className="min-h-[44px] h-10 text-xs sm:text-sm rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {portalType === "staff" ? t("auth.emailAddress", "Employee Email / Staff ID") : t("auth.emailAddress", "Email Address")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={portalType === "staff" ? "officer@mcgm.gov.in or name@domain.com" : t("auth.emailPlaceholder", "name@domain.com")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="min-h-[44px] h-10 text-xs sm:text-sm rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  {!isLogin && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="role" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {portalType === "staff" ? t("auth.designation", "Official Municipal Designation") : t("auth.designation", "Portal Role")}
                        </Label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 min-h-[44px] bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {portalType === "citizen" ? (
                            <option value="citizen">{t("auth.roleCitizen", "Citizen (Public Grievance Reporter)")}</option>
                          ) : (
                            <>
                              <option value="officer">{t("auth.roleOfficer", "Ward Officer (Admin / Inspection)")}</option>
                              <option value="worker">{t("auth.roleWorker", "Field Worker (Ground Crew / Mukadam)")}</option>
                              <option value="admin">{t("auth.roleAdmin", "System Administrator")}</option>
                            </>
                          )}
                        </select>
                      </div>

                      {(formData.role === "officer" || formData.role === "worker") && (
                        <div className="space-y-1.5">
                          <Label htmlFor="ward" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {t("auth.assignedWard", "Assigned Municipal Ward")}
                          </Label>
                          <select
                            id="ward"
                            value={formData.ward}
                            onChange={handleChange}
                            className="w-full text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 min-h-[44px] bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Ward A">Ward A (Colaba / Fort / Marine Lines)</option>
                            <option value="Ward G-South">Ward G-South (Worli / Lower Parel)</option>
                            <option value="Ward H-West">Ward H-West (Bandra West / Khar)</option>
                            <option value="Ward K-East">Ward K-East (Andheri East / Jogeshwari)</option>
                            <option value="Ward L">Ward L (Kurla / Sakinaka)</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("auth.password", "Password")}
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        className="pr-10 min-h-[44px] h-10 text-xs sm:text-sm rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("auth.confirmPassword", "Confirm Password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setLocalError(null)
                          }}
                          required
                          autoComplete="new-password"
                          className="pr-10 min-h-[44px] h-10 text-xs sm:text-sm rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="phoneNumber" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("auth.phoneNumber", "Phone Number")}{" "}
                        <span className="text-slate-400 text-xs">{t("auth.phoneOptional", "(optional for SMS notifications)")}</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+91 98000 00000"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        autoComplete="tel"
                        className="min-h-[44px] h-10 text-xs sm:text-sm rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  )}

                  <Button
                    className="w-full min-h-[44px] h-11 text-xs sm:text-sm font-semibold rounded-xl mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isLogin ? t("auth.authenticating", "Authenticating...") : t("auth.creatingAccount", "Creating account...")}
                      </>
                    ) : isLogin ? (
                      portalType === "staff" ? t("auth.staffSignInBtn", "Sign In to Staff Dashboard") : t("auth.signInBtn", "Sign In")
                    ) : (
                      portalType === "staff" ? t("auth.staffRegisterBtn", "Register Municipal Staff") : t("auth.createAccountBtn", "Create Account")
                    )}
                  </Button>

                  {/* Contextual Security Assurance directly under form submit */}
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>256-Bit TLS Municipal Encryption • RBAC</span>
                  </div>
                </form>

                {/* Google OAuth (Offered primarily for Citizens) */}
                {portalType === "citizen" && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                          {t("auth.orContinueWith", "Or continue with")}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-[44px] h-11 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium cursor-pointer"
                      onClick={async () => {
                        try {
                          setIsGoogleLoading(true)
                          setLocalError(null)
                          await loginWithFirebaseGoogle(!isLogin ? {
                            name: formData.name || undefined,
                            role: formData.role,
                            ward: formData.ward,
                            phoneNumber: formData.phoneNumber || undefined,
                          } : undefined)
                          navigate(getTargetRoute(formData.role), { replace: true })
                        } catch (err: unknown) {
                          if (err instanceof Error) setLocalError(err.message)
                        } finally {
                          setIsGoogleLoading(false)
                        }
                      }}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                          <span>{isLogin ? t("auth.googleSigningIn", "Signing in with Google...") : t("auth.googleRegistering", "Registering with Google...")}</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              fill="#EA4335"
                            />
                          </svg>
                          <span>{isLogin ? t("auth.googleSignIn", "Sign in with Google") : t("auth.googleRegister", "Register with Google")}</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-center text-xs text-slate-500 w-full">
                  {isLogin ? t("auth.dontHaveAccount", "Don't have an account?") + " " : t("auth.alreadyHaveAccount", "Already have an account?") + " "}
                  <button
                    type="button"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline ml-1 inline-flex items-center cursor-pointer"
                    onClick={switchMode}
                  >
                    {isLogin ? t("auth.signUpLink", "Sign up") : t("auth.signInLink", "Sign in")}
                  </button>
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Legal Compliance Footer Links */}
          <div className="text-center pt-6 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              {t("auth.termsNotice", "By accessing the portal, you agree to our")}{" "}
              <Link to="/terms" className="underline hover:text-slate-900 dark:hover:text-white transition-colors">
                {t("auth.termsLink", "Terms of Service")}
              </Link>{" "}
              {t("auth.and", "and")}{" "}
              <Link to="/privacy" className="underline hover:text-slate-900 dark:hover:text-white transition-colors">
                {t("auth.privacyLink", "Privacy Policy")}
              </Link>
              .
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official Grievance Desk: <a href="mailto:grievance@smartcivic.mumbai" className="underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">grievance@smartcivic.mumbai</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

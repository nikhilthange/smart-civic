import { useState, useEffect } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { Building2, Eye, EyeOff, Loader2, Mail, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react"
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

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

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

  // If already authenticated redirect away
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    setLocalError(null)
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
          navigate("/dashboard", { replace: true })
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
            navigate("/dashboard", { replace: true })
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
          // If Firebase throws, check if backend registration is preferred
          if (firebaseErr?.message?.includes("auth/email-already-in-use")) {
            throw new Error("This email address is already registered. Please sign in.")
          }
          // Fallback to backend registration if needed
          await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            ward: formData.ward,
            phoneNumber: formData.phoneNumber || undefined,
          })
          navigate("/dashboard", { replace: true })
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
    setFormData({ name: "", email: "", password: "", phoneNumber: "", role: "citizen", ward: "Ward H-West" })
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70 pointer-events-none"></div>
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary/10 opacity-40 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Smart Civic AI
            </span>
          </Link>
        </div>

        {needsVerification ? (
          <Card className="glass-card border-t-4 border-t-emerald-500 border-x-slate-200/50 border-b-slate-200/50 dark:border-x-slate-800/50 dark:border-b-slate-800/50 rounded-2xl shadow-xl shadow-emerald-500/5">
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <Mail className="h-7 w-7 animate-pulse" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Check your email & verify, then log in
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                We've sent a verification link to:
              </CardDescription>
              <div className="font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 break-all">
                {verificationEmail}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Please click the link in your email to activate your account. Once verified, click below to log in.
              </p>

              {resendSuccess && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {localError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">
                  {localError}
                </div>
              )}

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 font-semibold"
                onClick={() => {
                  setNeedsVerification(false)
                  setIsLogin(true)
                  setLocalError(null)
                  setResendSuccess(null)
                }}
              >
                Login
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium"
                disabled={isResending || resendCooldown > 0}
                onClick={async () => {
                  if (!formData.password) {
                    setLocalError("Please enter your password or sign in to request a fresh verification link.")
                    setNeedsVerification(false)
                    setIsLogin(true)
                    return
                  }

                  setIsResending(true)
                  setLocalError(null)
                  setResendSuccess(null)
                  try {
                    await resendEmailVerification(verificationEmail, formData.password)
                    setResendSuccess("Verification email resent successfully! Check your inbox.")
                    setResendCooldown(60)
                  } catch (err: any) {
                    setLocalError(err.message || "Could not resend email. Please try again.")
                  } finally {
                    setIsResending(false)
                  }
                }}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Resending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-slate-400" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="pt-0">
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mx-auto flex items-center gap-1"
                onClick={() => {
                  setNeedsVerification(false)
                  setLocalError(null)
                  setResendSuccess(null)
                }}
              >
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="glass-card border-t-4 border-t-primary border-x-slate-200/50 border-b-slate-200/50 dark:border-x-slate-800/50 dark:border-b-slate-800/50 rounded-2xl shadow-xl shadow-primary/5">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl tracking-tight">
                {isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Sign in to access your citizen portal"
                  : "Register to submit and track civic complaints"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Error Banner */}
              {localError && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                  {localError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Citizen / Officer Name"
                      value={formData.name}
                      onChange={handleChange}
                      required={!isLogin}
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. user@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="role">Register As (Testing Role)</Label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="citizen">Citizen (Public Grievance Reporter)</option>
                        <option value="officer">Municipal Officer (Ward Manager)</option>
                        <option value="worker">Field Worker (Ground Operations)</option>
                        <option value="admin">Admin (BMC Headquarters)</option>
                      </select>
                    </div>

                    {(formData.role === "officer" || formData.role === "worker") && (
                      <div className="space-y-2">
                        <Label htmlFor="ward">Assigned BMC Ward</Label>
                        <select
                          id="ward"
                          value={formData.ward}
                          onChange={handleChange}
                          className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Ward A">Ward A (Colaba/Fort)</option>
                          <option value="Ward G-South">Ward G-South (Worli)</option>
                          <option value="Ward H-West">Ward H-West (Bandra)</option>
                          <option value="Ward K-East">Ward K-East (Andheri)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <a
                        href="#"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </a>
                    )}
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
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword((s) => !s)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-slate-400">
                      Must contain uppercase, lowercase, and a number.
                    </p>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        tabIndex={-1}
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
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number{" "}
                      <span className="text-slate-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      autoComplete="tel"
                    />
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={async () => {
                    try {
                      setLocalError(null)
                      await loginWithFirebaseGoogle()
                      navigate("/dashboard", { replace: true })
                    } catch (err: unknown) {
                      if (err instanceof Error) setLocalError(err.message)
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </Button>
              </div>
            </CardContent>

            <CardFooter>
              <p className="text-center text-sm text-slate-500 w-full">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={switchMode}
                >
                  {isLogin ? "Register now" : "Sign in instead"}
                </button>
              </p>
            </CardFooter>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}

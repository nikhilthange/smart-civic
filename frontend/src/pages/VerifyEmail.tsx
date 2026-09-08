import { useState, useEffect } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { CheckCircle2, XCircle, Loader2, Building2, ArrowRight, RefreshCw, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const initialEmail = searchParams.get("email") || ""
  const navigate = useNavigate()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")
  const [resendEmail, setResendEmail] = useState<string>(initialEmail)
  const [isResending, setIsResending] = useState<boolean>(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token found in URL. Please use the link provided in your verification email.")
      return
    }

    const performVerification = async () => {
      try {
        const query = new URLSearchParams()
        query.set("token", token)
        if (initialEmail) {
          query.set("email", initialEmail)
        }
        const response = await api.get(`/auth/verify-email?${query.toString()}`)
        setStatus("success")
        setMessage(response.data.message || "Your email has been verified successfully! Your account is now fully active.")

        if (response.data.token && response.data.user) {
          localStorage.setItem("token", response.data.token)
          localStorage.setItem("user", JSON.stringify(response.data.user))
          api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
        }
      } catch (err: any) {
        setStatus("error")
        const errorMsg =
          err.response?.data?.message ||
          "This verification link is invalid or has expired. Please request a fresh verification link below."
        setMessage(errorMsg)
      }
    }

    performVerification()
  }, [token, initialEmail])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) {
      setResendError("Please enter your registered email address.")
      return
    }

    setIsResending(true)
    setResendError(null)
    setResendSuccess(null)

    try {
      const response = await api.post("/auth/resend-verification", { email: resendEmail })
      setResendSuccess(response.data.message || "A fresh verification link has been sent to your email address!")
    } catch (err: any) {
      setResendError(err.response?.data?.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="fixed inset-0 h-full w-full overflow-y-auto overscroll-y-contain bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-12 pb-24 z-10 flex flex-col items-center justify-start">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70 pointer-events-none -z-10"></div>
      <div className="fixed left-1/2 top-0 -z-10 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary/10 opacity-40 blur-[120px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="w-full max-w-md flex items-center justify-center gap-3 mb-6 sm:mb-8 shrink-0 relative z-10">
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="bg-primary/10 p-2.5 rounded-2xl">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Civic AI
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md shrink-0 relative z-10">
        <Card className="glass-card border-t-4 border-t-primary border-x-slate-200/50 border-b-slate-200/50 dark:border-x-slate-800/50 dark:border-b-slate-800/50 rounded-2xl shadow-xl">
          {status === "loading" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Verifying Email Address...</CardTitle>
                <CardDescription>Communicating with the municipal security gateway</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <p className="text-sm text-slate-500">Please hold on while we authenticate your registration token.</p>
              </CardContent>
            </>
          )}

          {status === "success" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Email Verified!
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Official Citizen Registration Activated
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

                <Button
                  className="w-full min-h-[44px] h-11 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  onClick={() => navigate("/dashboard", { replace: true })}
                >
                  <span>Proceed to Citizen Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {status === "error" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
                  <XCircle className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Verification Failed
                </CardTitle>
                <CardDescription className="text-rose-600 dark:text-rose-400 font-medium">
                  Token Expired or Invalid
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                  {message}
                </div>

                {resendSuccess && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {resendError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
                    {resendError}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="resend-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enter your email to receive a new link:
                    </label>
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="name@domain.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      className="min-h-[44px] h-11 text-sm rounded-xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isResending}
                    className="w-full min-h-[44px] h-11 text-sm font-semibold rounded-xl"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending New Link...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          <CardFooter className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Link
              to="/auth"
              className="text-xs sm:text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

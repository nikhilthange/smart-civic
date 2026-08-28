import { useState } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
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

import { GoogleLogin } from "@react-oauth/google"

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

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

  const { login, register, loginWithGoogle, isLoading, isAuthenticated } = useAuth()
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

    if (!isLogin && formData.password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password })
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          ward: formData.ward,
          phoneNumber: formData.phoneNumber || undefined,
        })
      }
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) setLocalError(err.message)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setLocalError(null)
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

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      navigate("/dashboard", { replace: true });
                    } catch (err: unknown) {
                      if (err instanceof Error) setLocalError(err.message);
                    }
                  }
                }}
                onError={() => {
                  setLocalError("Google Sign-In failed.");
                }}
                useOneTap
              />
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

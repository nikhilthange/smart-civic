import { Link } from "react-router-dom"
import { ShieldX, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <div className="mb-6 p-6 bg-red-50 dark:bg-red-950/30 rounded-full">
        <ShieldX className="h-16 w-16 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
        Access Denied
      </h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mb-2">
        You don't have permission to view this page.
      </p>
      {user && (
        <p className="text-sm text-slate-400 mb-8">
          Your current role is <span className="font-semibold text-primary capitalize">{user.role}</span>.
        </p>
      )}
      <div className="flex gap-4">
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  )
}

import { Navigate, Outlet } from "react-router-dom"
import { useAuth, type UserRole } from "@/context/AuthContext"
import { Building2 } from "lucide-react"

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show a full-screen spinner while we validate the stored token
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Building2 className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-slate-500 text-sm">Authenticating...</p>
      </div>
    )
  }

  // Not logged in → redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Role check — redirect to unauthorized page if role not allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Render nested routes
  return <Outlet />
}

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import CreateComplaint from "./pages/CreateComplaint"
import ComplaintHistory from "./pages/ComplaintHistory"
import ComplaintTracking from "./pages/ComplaintTracking"
import Unauthorized from "./pages/Unauthorized"
import AdminDashboard from "./pages/AdminDashboard"
import DashboardLayout from "./components/layout/DashboardLayout"

import { GoogleOAuthProvider } from '@react-oauth/google'

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here'

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes — all roles allowed */}
          <Route element={<ProtectedRoute allowedRoles={["citizen", "admin", "officer"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/complaint/new" element={<CreateComplaint />} />
              <Route path="/complaints" element={<ComplaintHistory />} />
              <Route path="/complaint/:id/track" element={<ComplaintTracking />} />
            </Route>
          </Route>

          {/* Protected Routes — admin/officer only */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "officer"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
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
import Donation from "./pages/Donation"
import AnalyticsDashboard from "./pages/AnalyticsDashboard"
import SearchComplaints from "./pages/SearchComplaints"
import DashboardLayout from "./components/layout/DashboardLayout"
import OfficerDashboard from "./pages/OfficerDashboard"
import WorkerDashboard from "./pages/WorkerDashboard"

import { GoogleOAuthProvider } from '@react-oauth/google'

import MapView from "./pages/MapView"

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
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/public-map" element={<MapView />} />

          {/* Protected Routes — Citizen & Admin */}
          <Route element={<ProtectedRoute allowedRoles={["citizen", "worker", "officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/citizen-dashboard" element={<Dashboard />} />
              <Route path="/complaint/new" element={<CreateComplaint />} />
              <Route path="/complaints" element={<ComplaintHistory />} />
              <Route path="/complaint/:id/track" element={<ComplaintTracking />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/donate" element={<Donation />} />
              <Route path="/search" element={<SearchComplaints />} />
            </Route>
          </Route>

          {/* Protected Routes — Worker, Officer, Admin */}
          <Route element={<ProtectedRoute allowedRoles={["worker", "officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/worker-dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes — Officer & Admin */}
          <Route element={<ProtectedRoute allowedRoles={["officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer-dashboard" element={<OfficerDashboard />} />
              <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes — Admin only */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            </Route>
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App

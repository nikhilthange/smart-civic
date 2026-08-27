import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
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
import KarmaRewards from "./pages/KarmaRewards"
import Notifications from "./pages/Notifications"
import MonsoonRadar from "./pages/MonsoonRadar"
import DlpRegistry from "./pages/DlpRegistry"
import SwmFleetRadar from "./pages/SwmFleetRadar"
import ParticipatoryBudget from "./pages/ParticipatoryBudget"
import TrenchingCoordinator from "./pages/TrenchingCoordinator"
import AqiEnforcement from "./pages/AqiEnforcement"
import WaterGovernance from "./pages/WaterGovernance"
import DisasterSubways from "./pages/DisasterSubways"
import StructuralCollapseRadar from "./pages/StructuralCollapseRadar"
import CoastalSentinel from "./pages/CoastalSentinel"
import FireSafetyRadar from "./pages/FireSafetyRadar"
import PropertyTaxAudit from "./pages/PropertyTaxAudit"
import BestTransitRadar from "./pages/BestTransitRadar"
import AnimalWelfareRadar from "./pages/AnimalWelfareRadar"
import WhatsAppSandbox from "./pages/WhatsAppSandbox"
import AuditLedger from "./pages/AuditLedger"
import CctvSurveillanceRadar from "./pages/CctvSurveillanceRadar"
import DigitalTwinSim from "./pages/DigitalTwinSim"
import GreenBondLedger from "./pages/GreenBondLedger"
import SocialMediaRadar from "./pages/SocialMediaRadar"
import CivicRewardsLeaderboard from "./pages/CivicRewardsLeaderboard"
import ContractorRegistry from "./pages/ContractorRegistry"
import AlmSocietyDashboard from "./pages/AlmSocietyDashboard"
import DailySitrepDashboard from "./pages/DailySitrepDashboard"
import EmergencyBroadcastHub from "./pages/EmergencyBroadcastHub"
import QuickReport from "./pages/QuickReport"
import AdminDataStudio from "./pages/AdminDataStudio"

import { GoogleOAuthProvider } from '@react-oauth/google'

import ErrorBoundary from "./components/common/ErrorBoundary"
import MapView from "./pages/MapView"

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here'

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <SocketProvider>
            <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/public-map" element={<MapView />} />

          {/* Citizen-only Routes — Create Complaint */}
          <Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/complaint/create" element={<CreateComplaint />} />
              <Route path="/complaint/new" element={<CreateComplaint />} />
              <Route path="/quick-report" element={<QuickReport />} />
              <Route path="/complaints/new" element={<CreateComplaint />} />
              <Route path="/create-complaint" element={<CreateComplaint />} />
            </Route>
          </Route>

          {/* Protected Routes — All Authenticated Users */}
          <Route element={<ProtectedRoute allowedRoles={["citizen", "worker", "officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/citizen-dashboard" element={<Dashboard />} />
              <Route path="/complaints" element={<ComplaintHistory />} />
              <Route path="/complaint/:id/track" element={<ComplaintTracking />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/donate" element={<Donation />} />
              <Route path="/rewards" element={<KarmaRewards />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/monsoon-radar" element={<MonsoonRadar />} />
              <Route path="/dlp-registry" element={<DlpRegistry />} />
              <Route path="/swm-fleet" element={<SwmFleetRadar />} />
              <Route path="/ward-budget" element={<ParticipatoryBudget />} />
              <Route path="/trenching-coordinator" element={<TrenchingCoordinator />} />
              <Route path="/aqi-enforcement" element={<AqiEnforcement />} />
              <Route path="/water-governance" element={<WaterGovernance />} />
              <Route path="/disaster-subways" element={<DisasterSubways />} />
              <Route path="/structural-collapse" element={<StructuralCollapseRadar />} />
              <Route path="/coastal-sentinel" element={<CoastalSentinel />} />
              <Route path="/fire-safety" element={<FireSafetyRadar />} />
              <Route path="/property-tax-audit" element={<PropertyTaxAudit />} />
              <Route path="/best-transit" element={<BestTransitRadar />} />
              <Route path="/animal-welfare" element={<AnimalWelfareRadar />} />
              <Route path="/whatsapp-sandbox" element={<WhatsAppSandbox />} />
              <Route path="/audit-ledger" element={<AuditLedger />} />
              <Route path="/cctv-surveillance" element={<CctvSurveillanceRadar />} />
              <Route path="/digital-twin" element={<DigitalTwinSim />} />
              <Route path="/green-bonds" element={<GreenBondLedger />} />
              <Route path="/social-radar" element={<SocialMediaRadar />} />
              <Route path="/civic-karma" element={<CivicRewardsLeaderboard />} />
              <Route path="/contractor-registry" element={<ContractorRegistry />} />
              <Route path="/alm-societies" element={<AlmSocietyDashboard />} />
              <Route path="/sitrep" element={<DailySitrepDashboard />} />
              <Route path="/emergency-broadcast" element={<EmergencyBroadcastHub />} />
              <Route path="/search" element={<SearchComplaints />} />
            </Route>
          </Route>

          {/* Protected Routes — Worker, Officer, Admin */}
          <Route element={<ProtectedRoute allowedRoles={["worker", "officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/worker-queue" element={<WorkerDashboard />} />
              <Route path="/worker-dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes — Officer & Admin */}
          <Route element={<ProtectedRoute allowedRoles={["officer", "admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/officer-portal" element={<OfficerDashboard />} />
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer-dashboard" element={<OfficerDashboard />} />
              <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes — Admin only */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              <Route path="/admin/data-studio" element={<AdminDataStudio />} />
              <Route path="/data-studio" element={<AdminDataStudio />} />
            </Route>
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </ErrorBoundary>
  )
}

export default App

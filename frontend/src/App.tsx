import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import DashboardLayout from "./components/layout/DashboardLayout"
import ErrorBoundary from "./components/common/ErrorBoundary"
import { GoogleOAuthProvider } from "@react-oauth/google"

// ─── Route-Level Dynamic Lazy Imports (Code-Splitting) ─────────────────────────
const Home = lazy(() => import("./pages/Home"))
const Auth = lazy(() => import("./pages/Auth"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const CreateComplaint = lazy(() => import("./pages/CreateComplaint"))
const ComplaintHistory = lazy(() => import("./pages/ComplaintHistory"))
const ComplaintTracking = lazy(() => import("./pages/ComplaintTracking"))
const Unauthorized = lazy(() => import("./pages/Unauthorized"))
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"))
const Donation = lazy(() => import("./pages/Donation"))
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"))
const SearchComplaints = lazy(() => import("./pages/SearchComplaints"))
const OfficerDashboard = lazy(() => import("./pages/OfficerDashboard"))
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"))
const KarmaRewards = lazy(() => import("./pages/KarmaRewards"))
const Notifications = lazy(() => import("./pages/Notifications"))
const MonsoonRadar = lazy(() => import("./pages/MonsoonRadar"))
const DlpRegistry = lazy(() => import("./pages/DlpRegistry"))
const SwmFleetRadar = lazy(() => import("./pages/SwmFleetRadar"))
const ParticipatoryBudget = lazy(() => import("./pages/ParticipatoryBudget"))
const TrenchingCoordinator = lazy(() => import("./pages/TrenchingCoordinator"))
const AqiEnforcement = lazy(() => import("./pages/AqiEnforcement"))
const WaterGovernance = lazy(() => import("./pages/WaterGovernance"))
const DisasterSubways = lazy(() => import("./pages/DisasterSubways"))
const StructuralCollapseRadar = lazy(() => import("./pages/StructuralCollapseRadar"))
const CoastalSentinel = lazy(() => import("./pages/CoastalSentinel"))
const FireSafetyRadar = lazy(() => import("./pages/FireSafetyRadar"))
const PropertyTaxAudit = lazy(() => import("./pages/PropertyTaxAudit"))
const BestTransitRadar = lazy(() => import("./pages/BestTransitRadar"))
const AnimalWelfareRadar = lazy(() => import("./pages/AnimalWelfareRadar"))
const WhatsAppSandbox = lazy(() => import("./pages/WhatsAppSandbox"))
const AuditLedger = lazy(() => import("./pages/AuditLedger"))
const CctvSurveillanceRadar = lazy(() => import("./pages/CctvSurveillanceRadar"))
const DigitalTwinSim = lazy(() => import("./pages/DigitalTwinSim"))
const GreenBondLedger = lazy(() => import("./pages/GreenBondLedger"))
const SocialMediaRadar = lazy(() => import("./pages/SocialMediaRadar"))
const CivicRewardsLeaderboard = lazy(() => import("./pages/CivicRewardsLeaderboard"))
const ContractorRegistry = lazy(() => import("./pages/ContractorRegistry"))
const AlmSocietyDashboard = lazy(() => import("./pages/AlmSocietyDashboard"))
const DailySitrepDashboard = lazy(() => import("./pages/DailySitrepDashboard"))
const EmergencyBroadcastHub = lazy(() => import("./pages/EmergencyBroadcastHub"))
const QuickReport = lazy(() => import("./pages/QuickReport"))
const AdminDataStudio = lazy(() => import("./pages/AdminDataStudio"))
const MapView = lazy(() => import("./pages/MapView"))

// ─── Loading Fallback Component ───────────────────────────────────────────────
const RouteLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
    <div className="relative w-12 h-12">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500 animate-pulse tracking-wide">
      Loading Smart Civic Module...
    </p>
  </div>
)

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id_here"

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Suspense fallback={<RouteLoadingFallback />}>
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
              </Suspense>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  )
}

export default App

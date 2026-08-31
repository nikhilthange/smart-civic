import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import DashboardLayout from "./components/layout/DashboardLayout"
import ErrorBoundary from "./components/common/ErrorBoundary"
import { GoogleOAuthProvider } from "@react-oauth/google"

// ─── Chunk Mismatch & Dynamic Import Resilience Helper ────────────────────────
export function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page-refreshed") || "false"
    )

    try {
      const component = await componentImport()
      window.sessionStorage.setItem("page-refreshed", "false")
      return component
    } catch (error: any) {
      const isChunkError =
        error?.name === "ChunkLoadError" ||
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("error loading dynamically imported module")

      if (isChunkError && !pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem("page-refreshed", "true")
        window.location.reload()
        // Return a persistent unresolved promise so the fallback loader stays mounted until reload finishes
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}

// ─── Route-Level Dynamic Lazy Imports (Code-Splitting with Auto-Recovery) ──────
const Home = lazyRetry(() => import("./pages/Home"))
const Auth = lazyRetry(() => import("./pages/Auth"))
const VerifyEmail = lazyRetry(() => import("./pages/VerifyEmail"))
const Dashboard = lazyRetry(() => import("./pages/Dashboard"))
const CreateComplaint = lazyRetry(() => import("./pages/CreateComplaint"))
const ComplaintHistory = lazyRetry(() => import("./pages/ComplaintHistory"))
const ComplaintTracking = lazyRetry(() => import("./pages/ComplaintTracking"))
const TrackComplaint = lazyRetry(() => import("./pages/TrackComplaint"))
const Unauthorized = lazyRetry(() => import("./pages/Unauthorized"))
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"))
const AnalyticsDashboard = lazyRetry(() => import("./pages/AnalyticsDashboard"))
const SearchComplaints = lazyRetry(() => import("./pages/SearchComplaints"))
const OfficerDashboard = lazyRetry(() => import("./pages/OfficerDashboard"))
const WorkerDashboard = lazyRetry(() => import("./pages/WorkerDashboard"))
const KarmaRewards = lazyRetry(() => import("./pages/KarmaRewards"))
const Notifications = lazyRetry(() => import("./pages/Notifications"))
const MonsoonRadar = lazyRetry(() => import("./pages/MonsoonRadar"))
const DlpRegistry = lazyRetry(() => import("./pages/DlpRegistry"))
const SwmFleetRadar = lazyRetry(() => import("./pages/SwmFleetRadar"))
const ParticipatoryBudget = lazyRetry(() => import("./pages/ParticipatoryBudget"))
const TrenchingCoordinator = lazyRetry(() => import("./pages/TrenchingCoordinator"))
const AqiEnforcement = lazyRetry(() => import("./pages/AqiEnforcement"))
const WaterGovernance = lazyRetry(() => import("./pages/WaterGovernance"))
const DisasterSubways = lazyRetry(() => import("./pages/DisasterSubways"))
const StructuralCollapseRadar = lazyRetry(() => import("./pages/StructuralCollapseRadar"))
const CoastalSentinel = lazyRetry(() => import("./pages/CoastalSentinel"))
const FireSafetyRadar = lazyRetry(() => import("./pages/FireSafetyRadar"))
const PropertyTaxAudit = lazyRetry(() => import("./pages/PropertyTaxAudit"))
const BestTransitRadar = lazyRetry(() => import("./pages/BestTransitRadar"))
const AnimalWelfareRadar = lazyRetry(() => import("./pages/AnimalWelfareRadar"))
const WhatsAppSandbox = lazyRetry(() => import("./pages/WhatsAppSandbox"))
const AuditLedger = lazyRetry(() => import("./pages/AuditLedger"))
const CctvSurveillanceRadar = lazyRetry(() => import("./pages/CctvSurveillanceRadar"))
const DigitalTwinSim = lazyRetry(() => import("./pages/DigitalTwinSim"))
const GreenBondLedger = lazyRetry(() => import("./pages/GreenBondLedger"))
const SocialMediaRadar = lazyRetry(() => import("./pages/SocialMediaRadar"))
const ContractorRegistry = lazyRetry(() => import("./pages/ContractorRegistry"))
const AlmSocietyDashboard = lazyRetry(() => import("./pages/AlmSocietyDashboard"))
const DailySitrepDashboard = lazyRetry(() => import("./pages/DailySitrepDashboard"))
const EmergencyBroadcastHub = lazyRetry(() => import("./pages/EmergencyBroadcastHub"))
const QuickReport = lazyRetry(() => import("./pages/QuickReport"))
const AdminDataStudio = lazyRetry(() => import("./pages/AdminDataStudio"))
const MapView = lazyRetry(() => import("./pages/MapView"))
const Settings = lazyRetry(() => import("./pages/Settings"))
const Support = lazyRetry(() => import("./pages/Support"))

// ─── Loading Fallback Component ───────────────────────────────────────────────
const RouteLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
    <div className="relative w-12 h-12">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-700 rounded-full animate-pulse"></div>
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
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/public-map" element={<MapView />} />

                  {/* Citizen-only Routes — Create Complaint & Rewards */}
                  <Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/complaint/create" element={<CreateComplaint />} />
                      <Route path="/complaint/new" element={<CreateComplaint />} />
                      <Route path="/complaints/new" element={<CreateComplaint />} />
                      <Route path="/create-complaint" element={<CreateComplaint />} />
                      
                      {/* Rewards Routes */}
                      <Route path="/rewards" element={<KarmaRewards />} />
                      <Route path="/civic-karma" element={<KarmaRewards />} />
                    </Route>
                  </Route>

                  {/* Protected Routes — All Authenticated Users */}
                  <Route element={<ProtectedRoute allowedRoles={["citizen", "worker", "officer", "admin"]} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/citizen-dashboard" element={<Dashboard />} />
                      <Route path="/quick-report" element={<QuickReport />} />
                      <Route path="/snap-send" element={<QuickReport />} />
                      <Route path="/snap" element={<QuickReport />} />
                      <Route path="/complaints" element={<ComplaintHistory />} />
                      
                      {/* Tracking Routes (Preserved & Enhanced) */}
                      <Route path="/track" element={<TrackComplaint />} />
                      <Route path="/track/:id" element={<ComplaintTracking />} />
                      <Route path="/track-complaint" element={<TrackComplaint />} />
                      <Route path="/complaint/:id/track" element={<ComplaintTracking />} />
                      
                      <Route path="/map" element={<MapView />} />
                      
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
                      <Route path="/contractor-registry" element={<ContractorRegistry />} />
                      <Route path="/alm-societies" element={<AlmSocietyDashboard />} />
                      <Route path="/sitrep" element={<DailySitrepDashboard />} />
                      <Route path="/emergency-broadcast" element={<EmergencyBroadcastHub />} />
                      <Route path="/search" element={<SearchComplaints />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/help" element={<Support />} />
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

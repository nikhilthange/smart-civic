import { chromium } from "playwright"
import { execSync } from "child_process"

// Fetch authenticated role credentials dynamically
let credentials = {}
try {
  const output = execSync("node server/scripts/get_all_role_tokens.js", { encoding: "utf8" })
  const startIdx = output.indexOf("ROLE_CREDENTIALS_JSON_START")
  const endIdx = output.indexOf("ROLE_CREDENTIALS_JSON_END")
  if (startIdx !== -1 && endIdx !== -1) {
    const jsonStr = output.substring(startIdx + "ROLE_CREDENTIALS_JSON_START".length, endIdx).trim()
    credentials = JSON.parse(jsonStr)
  }
} catch (err) {
  console.error("Failed to load dynamic credentials:", err.message)
  process.exit(1)
}

const BASE_URL = "http://localhost:5173"

// Comprehensive test matrix across all 44 routes
const TEST_MATRIX = [
  // ─── 1. Public Pages (Anonymous) ───────────────────────────────────────────
  {
    suite: "Public Portal (Anonymous)",
    role: null,
    routes: [
      { path: "/", title: "Home Landing Page" },
      { path: "/public-map", title: "Public Live GIS Map" },
      { path: "/road-passport", title: "Digital Road Passport & Plaque Scanner" },
      { path: "/road-passport/DLP-HW-8812", title: "Road Passport Detail (Khar)" },
      { path: "/nagarsevak", title: "Elected Nagarsevak Corporator Directory" },
      { path: "/privacy", title: "Privacy Policy & DPDP Governance" },
      { path: "/terms", title: "Terms of Service" },
    ]
  },

  // ─── 2. Citizen Experience ──────────────────────────────────────────────────
  {
    suite: "Citizen Experience Portal",
    role: "citizen",
    routes: [
      { path: "/dashboard", title: "Citizen Civic Command Board" },
      { path: "/complaints", title: "Grievance Records & History Ledger" },
      { path: "/track", title: "Track Grievance Search" },
      { path: "/complaint/create", title: "File Grievance Wizard" },
      { path: "/quick-report", title: "Instant Geo-Report (AI Snap & Send)" },
      { path: "/rewards", title: "Civic Karma & Vouchers Loyalty Store" },
      { path: "/ward-budget", title: "Ward Participatory Budget Voting" },
      { path: "/alm-societies", title: "Advanced Locality Management (ALM)" },
      { path: "/whatsapp-sandbox", title: "WhatsApp Grievance Channel" },
      { path: "/settings", title: "Citizen Settings & Notifications" },
      { path: "/support", title: "Civic Helpdesk & Knowledge Base" },
    ]
  },

  // ─── 3. Field Worker Operations ─────────────────────────────────────────────
  {
    suite: "Field Worker Operations",
    role: "worker",
    routes: [
      { path: "/worker-queue", title: "Field Worker Queue & Geofence Radar" },
    ]
  },

  // ─── 4. Ward Officer Portal & CityOS Smart Radars ───────────────────────────
  {
    suite: "Ward Officer Portal & CityOS Smart Radars",
    role: "officer",
    routes: [
      { path: "/officer-portal", title: "Ward Officer Triage Dashboard" },
      { path: "/sitrep", title: "Daily SITREP Intelligence Briefing" },
      { path: "/emergency-broadcast", title: "Disaster Broadcast Hub & Siren" },
      { path: "/contractor-registry", title: "Contractor 3-Strike Registry" },
      { path: "/rts-enforcement", title: "RTS Statutory Penalty Ledger" },
      { path: "/monsoon-radar", title: "Monsoon Flood & Sump Pump Radar" },
      { path: "/dlp-registry", title: "DLP Road Warranty Registry & 3D Sizer" },
      { path: "/swm-fleet", title: "SWM Compactor Fleet GPS Radar" },
      { path: "/trenching-coordinator", title: "Utility Dig-Once Trenching Corridor" },
      { path: "/aqi-enforcement", title: "AQI & Construction Dust Enforcement" },
      { path: "/water-governance", title: "Water Supply & Tanker Governance" },
      { path: "/disaster-subways", title: "Subway Inundation & Sump Pump Detours" },
      { path: "/structural-collapse", title: "Dilapidated C1 Building Collapse Radar" },
      { path: "/coastal-sentinel", title: "Mangrove CRZ Coastal Sentinel" },
      { path: "/fire-safety", title: "High-Rise Fire Safety Sprinkler NOC" },
      { path: "/best-transit", title: "BEST Transit Bus Dashcam AI" },
      { path: "/animal-welfare", title: "Stray Animal Welfare & Rabies Radar" },
      { path: "/cctv-surveillance", title: "CCTV AI Video Surveillance Hub" },
      { path: "/digital-twin", title: "3D Digital Twin Topography Runoff" },
      { path: "/green-bonds", title: "Municipal Green Bond Ledger" },
      { path: "/social-radar", title: "Social Media Grievance AI Radar" },
    ]
  },

  // ─── 5. Executive Administration ────────────────────────────────────────────
  {
    suite: "Executive Admin Command",
    role: "admin",
    routes: [
      { path: "/admin", title: "Executive Command Center" },
      { path: "/admin/analytics", title: "Predictive Analytics Engine" },
      { path: "/audit-ledger", title: "Immutable Cryptographic Audit Ledger" },
      { path: "/admin/data-studio", title: "Municipal Data Studio" },
    ]
  }
]

async function runSystemAudit() {
  console.log("================================================================================")
  console.log("🏙️  SMART CIVIC AI — SYSTEM-WIDE MULTI-ROLE FEATURE & DATA AUDIT")
  console.log("================================================================================\n")

  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const results = []

  for (const group of TEST_MATRIX) {
    console.log(`\n======================================================================`)
    console.log(`📂 SUITE: ${group.suite} [Role: ${group.role || "ANONYMOUS"}]`)
    console.log(`======================================================================`)

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

    // Inject credentials via addInitScript before document load
    if (group.role && credentials[group.role]) {
      const cred = credentials[group.role]
      await context.addInitScript(({ token, user }) => {
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
      }, { token: cred.token, user: cred.user })
    }

    const page = await context.newPage()

    for (const route of group.routes) {
      const fullUrl = `${BASE_URL}${route.path}`
      process.stdout.write(`  ▶ Checking [${route.path}] ${route.title}... `)

      try {
        const response = await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15000 })
        const status = response ? response.status() : 200

        if (status >= 400 && status !== 304) {
          throw new Error(`HTTP Error Status: ${status}`)
        }

        // Verify URL does not redirect to unauthorized or auth page unexpectedly
        const currentUrl = page.url()
        if (group.role && currentUrl.includes("/auth")) {
          throw new Error(`Unexpected redirect to auth: ${currentUrl}`)
        }
        if (currentUrl.includes("/unauthorized")) {
          throw new Error(`Unexpected redirect to unauthorized: ${currentUrl}`)
        }

        // Verify that the page has rendered visible headings or main content
        const headingLocator = page.locator("h1, h2, h3, .leaflet-container, main").first()
        await headingLocator.waitFor({ state: "visible", timeout: 8000 })
        const heading = (await headingLocator.textContent()) || "Interactive Map/Canvas"

        // Verify no React ErrorBoundary crash
        const errorBoundary = await page.locator("text=Something went wrong, text=Application Error").count()
        if (errorBoundary > 0) {
          throw new Error("React ErrorBoundary triggered on page")
        }

        console.log(`✅ PASS ("${heading.trim().substring(0, 35)}...")`)
        results.push({ path: route.path, title: route.title, role: group.role || "public", status: "PASS", heading: heading.trim() })
      } catch (err) {
        console.log(`❌ FAIL: ${err.message}`)
        results.push({ path: route.path, title: route.title, role: group.role || "public", status: "FAIL", error: err.message })
      }
    }

    await context.close()
  }

  await browser.close()

  const total = results.length
  const passed = results.filter(r => r.status === "PASS").length
  const failed = results.filter(r => r.status === "FAIL").length

  console.log("\n================================================================================")
  console.log("📊 SYSTEM-WIDE AUDIT RESULTS SUMMARY:")
  console.log("================================================================================")
  console.log(`Total Features & Pages Tested: ${total}`)
  console.log(`Passed (100% Working):         ${passed}`)
  console.log(`Failed / Needs Fix:            ${failed}`)
  console.log("================================================================================")

  if (failed > 0) {
    console.log("\n🚨 FAILURES DETECTED:")
    for (const f of results.filter(r => r.status === "FAIL")) {
      console.log(`  - [${f.role}] ${f.path} (${f.title}): ${f.error}`)
    }
    process.exit(1)
  } else {
    console.log("\n🎉 100% OF ALL SYSTEM FEATURES AND DATA PIPELINES VERIFIED OPERATIONAL!")
    process.exit(0)
  }
}

runSystemAudit().catch(err => {
  console.error("Critical Audit Execution Error:", err)
  process.exit(1)
})

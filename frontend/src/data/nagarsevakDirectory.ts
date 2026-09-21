/**
 * ─── Nagarsevak (Ward Corporator) Directory & Performance Roster ───────────────
 * Comprehensive directory of elected municipal corporators across the
 * Mumbai Metropolitan Region (MMR): BMC (Mumbai), TMC (Thane), NMMC (Navi Mumbai), KDMC (Kalyan-Dombivli).
 */

export type MmrCorporation = "ALL" | "BMC" | "TMC" | "NMMC" | "KDMC"

export type PoliticalParty =
  | "BJP"
  | "SHIV_SENA_UBT"
  | "SHIV_SENA"
  | "INC"
  | "NCP"
  | "MNS"
  | "IND"

export interface Nagarsevak {
  id: string
  name: string
  electoralWard: string
  adminWardCode: string
  neighborhood: string
  corporation: "BMC" | "TMC" | "NMMC" | "KDMC"
  corporationName: string
  party: PoliticalParty
  partyLabel: string
  partyColor: string // badge style
  phone: string
  whatsapp: string
  email?: string
  officeAddress: string
  resolvedCount: number
  pendingCount: number
  responseRate: number // %
  avatar: string
  status: "Active" | "In Office"
}

export const MMR_CORPORATIONS = [
  { id: "ALL", name: "All MMR Regions", badge: "592 Wards", color: "border-slate-300" },
  { id: "BMC", name: "Mumbai BMC", badge: "227 Wards", color: "border-blue-500 text-blue-600" },
  { id: "TMC", name: "Thane TMC", badge: "132 Wards", color: "border-violet-500 text-violet-600" },
  { id: "NMMC", name: "Navi Mumbai NMMC", badge: "111 Wards", color: "border-teal-500 text-teal-600" },
  { id: "KDMC", name: "Kalyan-Dombivli KDMC", badge: "122 Wards", color: "border-orange-500 text-orange-600" },
] as const

export const NAGARSEVAK_ROSTER: Nagarsevak[] = [
  // ─── BMC Mumbai Wards ────────────────────────────────────────────────────────
  {
    id: "ns-bmc-217",
    name: "Gaurang Nutan Chetan Jhaveri",
    electoralWard: "Ward 217",
    adminWardCode: "Ward D",
    neighborhood: "Malabar Hill / Walkeshwar / Girgaon",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "BJP",
    partyLabel: "Bharatiya Janata Party (BJP)",
    partyColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
    phone: "+91 98200 41217",
    whatsapp: "919820041217",
    email: "ward217.bmc@gov.in",
    officeAddress: "Walkeshwar Road, Teen Batti, Malabar Hill, Mumbai 400006",
    resolvedCount: 142,
    pendingCount: 6,
    responseRate: 96,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-bmc-179",
    name: "Aysha Sufiyan Vanu",
    electoralWard: "Ward 179",
    adminWardCode: "Ward F-North",
    neighborhood: "Antop Hill / Sion / GTB Nagar",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "INC",
    partyLabel: "Indian National Congress (INC)",
    partyColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
    phone: "+91 98202 55179",
    whatsapp: "919820255179",
    email: "ward179.bmc@gov.in",
    officeAddress: "Near CGS Colony, Sector 1, Antop Hill, Mumbai 400037",
    resolvedCount: 98,
    pendingCount: 9,
    responseRate: 91,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-bmc-205",
    name: "Supriya Dilip Dalvi",
    electoralWard: "Ward 205",
    adminWardCode: "Ward F-South",
    neighborhood: "Sewri / Kalachowki / Parel",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "MNS",
    partyLabel: "Maharashtra Navnirman Sena (MNS)",
    partyColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
    phone: "+91 98210 99205",
    whatsapp: "919821099205",
    email: "ward205.bmc@gov.in",
    officeAddress: "TJ Road, Near Fatima High School, Sewri East, Mumbai 400015",
    resolvedCount: 114,
    pendingCount: 8,
    responseRate: 93,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-bmc-101",
    name: "Asif Zakaria",
    electoralWard: "Ward 101",
    adminWardCode: "Ward H-West",
    neighborhood: "Bandra West / Hill Road / Perry Cross",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "INC",
    partyLabel: "Indian National Congress (INC)",
    partyColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
    phone: "+91 98201 11101",
    whatsapp: "919820111101",
    officeAddress: "St. Martin Road, Off Turner Road, Bandra West, Mumbai 400050",
    resolvedCount: 230,
    pendingCount: 12,
    responseRate: 95,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-bmc-68",
    name: "Rohan Rathod",
    electoralWard: "Ward 68",
    adminWardCode: "Ward K-West",
    neighborhood: "Andheri West / Lokhandwala / Versova",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "BJP",
    partyLabel: "Bharatiya Janata Party (BJP)",
    partyColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
    phone: "+91 98203 77068",
    whatsapp: "919820377068",
    officeAddress: "Lokhandwala Complex, 4th Cross Road, Andheri West, Mumbai 400053",
    resolvedCount: 310,
    pendingCount: 14,
    responseRate: 96,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-bmc-191",
    name: "Vishakha Sharad Raut",
    electoralWard: "Ward 191",
    adminWardCode: "Ward G-North",
    neighborhood: "Dadar West / Shivaji Park",
    corporation: "BMC",
    corporationName: "Brihanmumbai Municipal Corporation",
    party: "SHIV_SENA_UBT",
    partyLabel: "Shiv Sena (UBT)",
    partyColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    phone: "+91 98200 88191",
    whatsapp: "919820088191",
    officeAddress: "Cadell Road, Shivaji Park, Dadar West, Mumbai 400028",
    resolvedCount: 185,
    pendingCount: 7,
    responseRate: 96,
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },

  // ─── TMC Thane Wards ────────────────────────────────────────────────────────
  {
    id: "ns-tmc-12",
    name: "Naresh Mhaske",
    electoralWard: "Ward 12",
    adminWardCode: "Naupada-Kopri",
    neighborhood: "Naupada / Gokhale Road / Thane West",
    corporation: "TMC",
    corporationName: "Thane Municipal Corporation",
    party: "SHIV_SENA",
    partyLabel: "Shiv Sena",
    partyColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    phone: "+91 98205 12012",
    whatsapp: "919820512012",
    officeAddress: "M.G. Road, Near Tower Naka, Naupada, Thane West 400602",
    resolvedCount: 275,
    pendingCount: 15,
    responseRate: 95,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-tmc-28",
    name: "Sanjay Bhoir",
    electoralWard: "Ward 28",
    adminWardCode: "Majiwada-Manpada",
    neighborhood: "Ghodbunder Road / Manpada / Kapurbawdi",
    corporation: "TMC",
    corporationName: "Thane Municipal Corporation",
    party: "SHIV_SENA",
    partyLabel: "Shiv Sena",
    partyColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    phone: "+91 98206 28028",
    whatsapp: "919820628028",
    officeAddress: "Ghodbunder Road, Near Khewra Circle, Thane West 400607",
    resolvedCount: 195,
    pendingCount: 18,
    responseRate: 91,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },

  // ─── NMMC Navi Mumbai Wards ─────────────────────────────────────────────────
  {
    id: "ns-nmmc-45",
    name: "Suresh Kulkarni",
    electoralWard: "Ward 45",
    adminWardCode: "Vashi Ward",
    neighborhood: "Sector 17 / Sector 9 / Vashi Plaza",
    corporation: "NMMC",
    corporationName: "Navi Mumbai Municipal Corporation",
    party: "BJP",
    partyLabel: "Bharatiya Janata Party (BJP)",
    partyColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
    phone: "+91 98207 45045",
    whatsapp: "919820745045",
    officeAddress: "Sector 17, Near Vashi Station Road, Navi Mumbai 400703",
    resolvedCount: 320,
    pendingCount: 8,
    responseRate: 97,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },
  {
    id: "ns-nmmc-78",
    name: "Netra Shirke",
    electoralWard: "Ward 78",
    adminWardCode: "Nerul Ward",
    neighborhood: "Nerul West / Seawoods / Sector 42",
    corporation: "NMMC",
    corporationName: "Navi Mumbai Municipal Corporation",
    party: "NCP",
    partyLabel: "Nationalist Congress Party (NCP)",
    partyColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
    phone: "+91 98208 78078",
    whatsapp: "919820878078",
    officeAddress: "Near Seawoods Grand Central, Sector 40, Nerul, Navi Mumbai 400706",
    resolvedCount: 240,
    pendingCount: 11,
    responseRate: 95,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  },

  // ─── KDMC Kalyan-Dombivli Wards ─────────────────────────────────────────────
  {
    id: "ns-kdmc-34",
    name: "Deepesh Mhatre",
    electoralWard: "Ward 34",
    adminWardCode: "Dombivli-East Ward",
    neighborhood: "Tilak Road / Phadke Road / Dombivli East",
    corporation: "KDMC",
    corporationName: "Kalyan-Dombivli Municipal Corporation",
    party: "SHIV_SENA_UBT",
    partyLabel: "Shiv Sena (UBT)",
    partyColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    phone: "+91 98209 34034",
    whatsapp: "919820934034",
    officeAddress: "Phadke Road, Near Appa Pendse Chowk, Dombivli East 421201",
    resolvedCount: 165,
    pendingCount: 16,
    responseRate: 91,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "Active"
  }
]

/**
 * Helper to lookup corporator by ward identifier
 */
export function findNagarsevakByWard(wardQuery: string): Nagarsevak | undefined {
  const q = wardQuery.toLowerCase().trim()
  return NAGARSEVAK_ROSTER.find(
    (ns) =>
      ns.adminWardCode.toLowerCase().includes(q) ||
      ns.electoralWard.toLowerCase().includes(q) ||
      ns.neighborhood.toLowerCase().includes(q)
  )
}

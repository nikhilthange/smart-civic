/**
 * ─── Official Municipal Grievance Taxonomy ───────
 * 114 civic grievance categories categorized across 8 BMC departments.
 */

import type { ComplaintCategory } from "@/services/complaintApi"

export interface MunicipalDepartment {
  id: string
  code: string
  name: string
  marathiName: string
  icon: string
  chiefOfficer: string
  categories: MunicipalCategoryItem[]
}

export interface MunicipalCategoryItem {
  id: string
  name: string
  marathiName: string
  standardSlaHours: number
  isRapid24h?: boolean
  smartCivicCategory: ComplaintCategory
  description: string
}

export const MUNICIPAL_DEPARTMENTS: MunicipalDepartment[] = [
  {
    id: "roads",
    code: "RDS-TRF",
    name: "Roads, Traffic & Bridges",
    marathiName: "रस्ते, वाहतूक आणि पूल विभाग",
    icon: "Building2",
    chiefOfficer: "Chief Engineer (Roads & Traffic)",
    categories: [
      {
        id: "pothole_mastic",
        name: "Pothole Filling (Rapid Mastic Asphalt)",
        marathiName: "खड्डे भरणे (मॅस्टिक अस्फाल्ट)",
        standardSlaHours: 24,
        isRapid24h: true,
        smartCivicCategory: "roads_and_infrastructure",
        description: "Surface pothole exceeding 5cm depth requiring rapid cold-mix / mastic repair.",
      },
      {
        id: "bad_patch_resurface",
        name: "Uneven / Bad Road Patch Settlement",
        marathiName: "रस्त्याचा खराब भाग व दुरुस्ती",
        standardSlaHours: 48,
        smartCivicCategory: "roads_and_infrastructure",
        description: "Depressed or wavy asphalt road patch causing vehicular damage.",
      },
      {
        id: "manhole_cover_missing",
        name: "Manhole / Drain Chamber Cover Missing or Broken",
        marathiName: "मॅनहोलचे तुटलेले / गायब झाकण",
        standardSlaHours: 12,
        isRapid24h: true,
        smartCivicCategory: "roads_and_infrastructure",
        description: "High-risk open or fractured manhole chamber on carriageway or footpath.",
      },
      {
        id: "paver_blocks_displaced",
        name: "Footpath Paver Blocks Broken / Uneven",
        marathiName: "पादचारी मार्गावरील तुटलेले पेव्हर ब्लॉक्स",
        standardSlaHours: 72,
        smartCivicCategory: "roads_and_infrastructure",
        description: "Hazardous loosened paver blocks obstructing pedestrian movement.",
      },
      {
        id: "road_divider_damaged",
        name: "Central Median / Crash Barrier Damaged",
        marathiName: "रस्ता दुभाजक तुटणे",
        standardSlaHours: 48,
        smartCivicCategory: "roads_and_infrastructure",
        description: "Damaged concrete or steel road divider encroaching on traffic lanes.",
      },
      {
        id: "utility_trench_restoration",
        name: "Utility Trench (Adani/MSEB/MGL) Reinstatement Delay",
        marathiName: "खोदलेल्या खंदकाची दुरुस्ती",
        standardSlaHours: 48,
        smartCivicCategory: "roads_and_infrastructure",
        description: "Unfilled road digging trench excavated by utility agencies past deadline.",
      },
    ],
  },
  {
    id: "swd",
    code: "SWD-DRN",
    name: "Storm Water Drains (SWD)",
    marathiName: "पर्जन्य जलवाहिन्या व नाले विभाग",
    icon: "CloudRain",
    chiefOfficer: "Chief Engineer (Storm Water Drains)",
    categories: [
      {
        id: "choked_roadside_gutter",
        name: "Roadside Water Entrance Choked / Blocked",
        marathiName: "पाणी वाहून नेणाऱ्या गटारातील अडथळा",
        standardSlaHours: 24,
        isRapid24h: true,
        smartCivicCategory: "storm_water_drains",
        description: "Grit or plastic clogging curb opening causing roadway inundation.",
      },
      {
        id: "broken_drain_grating",
        name: "Culvert Grating Broken / Displaced",
        marathiName: "गटाराची तुटलेली लोखंडी जाळी",
        standardSlaHours: 12,
        isRapid24h: true,
        smartCivicCategory: "storm_water_drains",
        description: "Missing or bent stormwater metal grating presenting vehicle plunge risk.",
      },
      {
        id: "nallah_desilting_required",
        name: "Major / Minor Nallah Desilting & Silt Removal",
        marathiName: "नाल्यातील गाळ काढणे",
        standardSlaHours: 72,
        smartCivicCategory: "storm_water_drains",
        description: "Excessive siltation or debris restricting tidal water outflow.",
      },
      {
        id: "monsoon_waterlogging_hotspot",
        name: "Monsoon Waterlogging & Flooding Hazard",
        marathiName: "पावसाळ्यात साचणारे पाणी",
        standardSlaHours: 6,
        isRapid24h: true,
        smartCivicCategory: "storm_water_drains",
        description: "Emergency rainwater inundation exceeding 1 foot requiring de-watering pumps.",
      },
    ],
  },
  {
    id: "swm",
    code: "SWM-SAN",
    name: "Solid Waste Management (SWM)",
    marathiName: "घनकचरा व्यवस्थापन विभाग",
    icon: "Trash2",
    chiefOfficer: "Chief Engineer (Solid Waste Management)",
    categories: [
      {
        id: "garbage_pileup_open",
        name: "Garbage Dump on Public Road / Footpath",
        marathiName: "सार्वजनिक ठिकाणी पडलेला कचरा",
        standardSlaHours: 24,
        smartCivicCategory: "garbage_collection",
        description: "Unattended solid waste heap attracting strays and obstructing traffic.",
      },
      {
        id: "overflowing_community_bin",
        name: "Overflowing BMC Green / Blue Community Bin",
        marathiName: "भरून वाहणाऱ्या कचरा कुंड्या",
        standardSlaHours: 12,
        smartCivicCategory: "garbage_collection",
        description: "Compactor vehicle pickup missed, causing bin overflow on footpath.",
      },
      {
        id: "debris_unauthorized_dumping",
        name: "C&D Construction Debris Illegal Dumping",
        marathiName: "बांधकाम राडारोडा बेकायदेशीरपणे टाकणे",
        standardSlaHours: 48,
        smartCivicCategory: "garbage_collection",
        description: "Midnight dumping of cement rubble, bricks, or plaster on roadside.",
      },
      {
        id: "dead_animal_removal",
        name: "Carcass / Dead Animal Removal Request",
        marathiName: "मृत जनावर उचलणे",
        standardSlaHours: 6,
        isRapid24h: true,
        smartCivicCategory: "garbage_collection",
        description: "Urgent sanitary clearance of dead animal to avert health hazard.",
      },
      {
        id: "public_toilet_unsanitary",
        name: "BMC Public Urinal / Community Toilet Uncleaned",
        marathiName: "अस्वच्छ सार्वजनिक शौचालय",
        standardSlaHours: 12,
        smartCivicCategory: "garbage_collection",
        description: "No water or severe hygiene degradation in ward public sanitation facility.",
      },
    ],
  },
  {
    id: "water",
    code: "HE-WTR",
    name: "Hydraulic Engineering (Water Supply)",
    marathiName: "जल अभियंता विभाग (पाणीपुरवठा)",
    icon: "Droplets",
    chiefOfficer: "Hydraulic Engineer (HE)",
    categories: [
      {
        id: "main_pipeline_burst",
        name: "Drinking Water Pipeline Burst / Heavy Leakage",
        marathiName: "पिण्याच्या पाण्याची पाईपलाईन फुटणे",
        standardSlaHours: 6,
        isRapid24h: true,
        smartCivicCategory: "water_and_sanitation",
        description: "High-pressure potable water wastage erupting through road surface.",
      },
      {
        id: "contaminated_water_supply",
        name: "Contaminated / Turbid / Foul Smelling Water",
        marathiName: "दूषित व गढूळ पाणी पुरवठा",
        standardSlaHours: 24,
        smartCivicCategory: "water_and_sanitation",
        description: "Sewage cross-contamination into drinking water distribution line.",
      },
      {
        id: "low_water_pressure",
        name: "Low Supply Pressure / Inadequate Supply",
        marathiName: "कमी दाबाने पाणी येणे",
        standardSlaHours: 48,
        smartCivicCategory: "water_and_sanitation",
        description: "Tail-end residential locality not receiving prescribed water pressure.",
      },
      {
        id: "illegal_water_tapping",
        name: "Illegal Water Connection / Tapping from BMC Main",
        marathiName: "बेकायदेशीर पाणी जोडणी",
        standardSlaHours: 48,
        smartCivicCategory: "water_and_sanitation",
        description: "Unauthorized pipe puncturing diverting public municipal water.",
      },
    ],
  },
  {
    id: "trees",
    code: "GDN-TREE",
    name: "Garden & Tree Authority",
    marathiName: "उद्यान व वृक्ष प्राधिकरण विभाग",
    icon: "Trees",
    chiefOfficer: "Superintendent of Gardens",
    categories: [
      {
        id: "dangerous_overhanging_branch",
        name: "Dangerous / Heavy Branch Leaning on Wires / Road",
        marathiName: "धोकादायक झाडाच्या फांद्या कापणे",
        standardSlaHours: 24,
        isRapid24h: true,
        smartCivicCategory: "parks_and_recreation",
        description: "Unstable tree limb posing imminent collapse risk onto traffic or pedestrians.",
      },
      {
        id: "fallen_tree_blocking_road",
        name: "Fallen Tree Obstructing Carriageway / Society Gate",
        marathiName: "झाड पडून रस्ता बंद होणे",
        standardSlaHours: 4,
        isRapid24h: true,
        smartCivicCategory: "parks_and_recreation",
        description: "Emergency tree uprooting requiring quick power-saw clearance by Quick Response Team.",
      },
      {
        id: "public_garden_maintenance",
        name: "BMC Public Park Play Equipment Damaged",
        marathiName: "उद्यानातील खेळणी दुरुस्ती",
        standardSlaHours: 96,
        smartCivicCategory: "parks_and_recreation",
        description: "Broken swing, see-saw or open gym equipment in ward municipal garden.",
      },
    ],
  },
  {
    id: "encroachment",
    code: "ENC-REMOVAL",
    name: "Encroachment & Hawker Removal",
    marathiName: "अतिक्रमण निष्कासन विभाग",
    icon: "ShieldAlert",
    chiefOfficer: "Deputy Municipal Commissioner (Encroachments)",
    categories: [
      {
        id: "illegal_hawkers_footpath",
        name: "Unauthorized Hawkers Blocking Footpath / Station Area",
        marathiName: "पादचारी मार्गावरील अनधिकृत फेरीवाले",
        standardSlaHours: 24,
        smartCivicCategory: "licensing_and_encroachment",
        description: "Station 150m non-hawking zone violation blocking pedestrian transit.",
      },
      {
        id: "unauthorized_commercial_extension",
        name: "Shop / Commercial Shed Extending on Roadway",
        marathiName: "दुकानाचे रस्त्यावरील अनधिकृत वाढीव बांधकाम",
        standardSlaHours: 72,
        smartCivicCategory: "licensing_and_encroachment",
        description: "Permanent or temporary iron shed occupying public road margins.",
      },
      {
        id: "abandoned_khatara_vehicle",
        name: "Abandoned 'Khatara' Vehicle Parked on Roadside",
        marathiName: "रस्त्यावरील बेवारस खटारा वाहने",
        standardSlaHours: 72,
        smartCivicCategory: "licensing_and_encroachment",
        description: "Scrap vehicle gathering dust and harboring anti-social elements.",
      },
    ],
  },
  {
    id: "health",
    code: "HLT-PEST",
    name: "Public Health & Pest Control",
    marathiName: "सार्वजनिक आरोग्य व कीटक नियंत्रण विभाग",
    icon: "HeartPulse",
    chiefOfficer: "Executive Health Officer (EHO)",
    categories: [
      {
        id: "mosquito_breeding_spot",
        name: "Stagnant Water / Mosquito Breeding Vector Site",
        marathiName: "डास उत्पत्ती ठिकाणे व पाणी साचणे",
        standardSlaHours: 24,
        smartCivicCategory: "public_health",
        description: "Uncovered overhead tank or cooling tower breeding Dengue/Malaria larvae.",
      },
      {
        id: "chemical_fogging_request",
        name: "Ward Area Anti-Malaria Smoke Fogging Request",
        marathiName: "धुरळणी (फॉंगिंग) विनंती",
        standardSlaHours: 48,
        smartCivicCategory: "public_health",
        description: "Scheduled thermal fogging request for residential societies.",
      },
      {
        id: "rodent_rat_nuisance",
        name: "Underground Rat Burrowing Damaging Footpath",
        marathiName: "उंदरांचा उपद्रव नियंत्रण",
        standardSlaHours: 72,
        smartCivicCategory: "public_health",
        description: "Leptospirosis prevention via municipal rodent baiting in ward area.",
      },
    ],
  },
  {
    id: "lighting",
    code: "ELEC-LGT",
    name: "Street Lighting & Electrical",
    marathiName: "सार्वजनिक पथदिवे व विद्युत विभाग",
    icon: "Lightbulb",
    chiefOfficer: "Executive Engineer (Mechanical & Electrical)",
    categories: [
      {
        id: "dark_street_lights_out",
        name: "Street Light Pole Dark / Bulb Fused",
        marathiName: "बंद पडलेला पथदिवा",
        standardSlaHours: 24,
        smartCivicCategory: "street_lighting",
        description: "Entire stretch or individual lamp post non-functional creating dark spot.",
      },
      {
        id: "exposed_live_wire",
        name: "Exposed Electric Cable / Open Junction Box",
        marathiName: "उघड्या विजेच्या तारा / धोकादायक बॉक्स",
        standardSlaHours: 4,
        isRapid24h: true,
        smartCivicCategory: "electricity",
        description: "Electrocution hazard on pedestrian walkway requiring emergency disconnection.",
      },
    ],
  },
]

/**
 * Find a Municipal Category item by its ID
 */
export function getMunicipalCategoryById(categoryId: string): MunicipalCategoryItem | undefined {
  for (const dept of MUNICIPAL_DEPARTMENTS) {
    const found = dept.categories.find((c) => c.id === categoryId)
    if (found) return found
  }
  return undefined
}

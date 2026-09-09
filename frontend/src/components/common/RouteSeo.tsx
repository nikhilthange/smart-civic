import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface RouteSeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  schema?: Record<string, any>;
  ogType?: string;
}

const DEFAULT_KEYWORDS =
  "Smart Civic, Smart Civics, SmartCivic, BMC issues, BMC complaint, Mumbai municipal corporation, report pothole mumbai, 24 wards mumbai, AI vision defect detection, multilingual voice grievance, mumbai cityos";

const ROUTE_CONFIGS: Record<string, RouteSeoConfig> = {
  "/": {
    title: "Smart Civic (Smart Civics) - Mumbai BMC Civic Issues & AI CityOS Tracker",
    description:
      "Report and track Mumbai BMC civic issues, potholes, and garbage on Smart Civic. AI-powered municipal grievance tracking across all 24 wards with multilingual voice and instant YOLO vision verification.",
    canonical: "https://smart-civic-pi.vercel.app/",
  },
  "/complaint/create": {
    title: "Report BMC Issue & Potholes | Smart Civic AI",
    description:
      "Submit civic complaints in Mumbai with instant AI vision triage or speak your grievance in Marathi, Hindi, or English. Automatic 24-ward geo-tagging and 48-hour SLA tracking.",
    canonical: "https://smart-civic-pi.vercel.app/complaint/create",
    keywords:
      "report bmc issue, report pothole mumbai, voice grievance recording marathi hindi, bmc complaint online, smart civic report",
    schema: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Report a Civic Defect in Mumbai on Smart Civic",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Upload Defect Photo or Voice Note",
          "text": "Capture defect or speak grievance in Marathi/Hindi/English."
        },
        {
          "@type": "HowToStep",
          "name": "AI Vision Triage",
          "text": "YOLO engine detects severity and assigns Mumbai ward."
        },
        {
          "@type": "HowToStep",
          "name": "Track SLA Progress",
          "text": "Monitor field resolution with verified geofenced proof."
        }
      ]
    }
  },
  "/track": {
    title: "Track BMC Complaint Status | Smart Civic",
    description:
      "Check live status, resolution photos, and 48-hour SLA countdown for your Mumbai municipal defect ticket using your Complaint ID.",
    canonical: "https://smart-civic-pi.vercel.app/track",
    keywords: "track bmc complaint, bmc grievance status, check pothole complaint mumbai, smart civic tracking"
  },
  "/map": {
    title: "Live Mumbai 24-Ward GIS Defect Map | Smart Civic",
    description:
      "Interactive GIS spatial map displaying verified municipal defect clusters, flood telemetry, CCTV nodes, and ward resolution metrics across Mumbai.",
    canonical: "https://smart-civic-pi.vercel.app/map",
    keywords: "mumbai civic map, bmc 24 wards map, mumbai pothole heatmap, live flood telemetry mumbai"
  },
  "/monsoon-radar": {
    title: "Monsoon & Subway Waterlogging Radar | Smart Civic",
    description:
      "Real-time flood depth telemetry, sump pump automation, and monsoon flood alerts for Milan, Andheri, and Khar subways in Mumbai.",
    canonical: "https://smart-civic-pi.vercel.app/monsoon-radar",
    keywords: "mumbai monsoon radar, andheri subway waterlogging, milan subway water level, bmc flood alerts"
  },
  "/whatsapp-sandbox": {
    title: "WhatsApp Civic Grievance Sandbox | Smart Civic",
    description:
      "Simulate instant zero-touch civic complaint filing via WhatsApp with automated GPS pin extraction and real-time status updates.",
    canonical: "https://smart-civic-pi.vercel.app/whatsapp-sandbox",
    keywords: "whatsapp bmc complaint, report civic issue whatsapp, smart civic whatsapp bot"
  },
  "/karma-rewards": {
    title: "Civic Karma Rewards & Tax Rebates | Smart Civic",
    description:
      "Earn Civic Karma points by reporting verified defects and rating repairs. Redeem for Mumbai Metro smartcard credits, BEST bus passes, and property tax discounts.",
    canonical: "https://smart-civic-pi.vercel.app/karma-rewards",
    keywords: "civic karma points, mumbai property tax rebate, best bus pass discount, municipal rewards"
  },
  "/participatory-budget": {
    title: "24-Ward Participatory Budgeting | Smart Civic",
    description:
      "Vote on municipal infrastructure development projects in your Mumbai ward. Transparent ward fund allocation and citizen governance.",
    canonical: "https://smart-civic-pi.vercel.app/participatory-budget",
    keywords: "participatory budgeting mumbai, bmc ward funds, citizen voting civic projects"
  },
  "/aqi-enforcement": {
    title: "AQI & Air Quality Enforcement Radar | Smart Civic",
    description:
      "Live particulate matter sensor telemetry, dust mitigation enforcement, and construction site compliance tracking across Greater Mumbai.",
    canonical: "https://smart-civic-pi.vercel.app/aqi-enforcement",
    keywords: "mumbai aqi radar, air quality mumbai, construction dust enforcement bmc"
  },
  "/cctv-radar": {
    title: "CCTV Surveillance & Encroachment Radar | Smart Civic",
    description:
      "AI video analytics for pedestrian walkway encroachments, illegal garbage dumping, and street obstruction detection in Mumbai.",
    canonical: "https://smart-civic-pi.vercel.app/cctv-radar",
    keywords: "cctv civic surveillance mumbai, encroachment detection bmc, illegal dumping ai"
  },
  "/dlp-registry": {
    title: "Defect Liability Period (DLP) Road Registry | Smart Civic",
    description:
      "Search the 3-Year mandatory Defect Liability Period (DLP) registry for concrete and asphalt roads across all 24 BMC wards.",
    canonical: "https://smart-civic-pi.vercel.app/dlp-registry",
    keywords: "dlp road registry mumbai, bmc contractor warranty, road concretization defect liability"
  },
  "/quick-report": {
    title: "Quick 10-Second Civic Report | Smart Civic",
    description:
      "Rapid one-tap municipal defect reporting with automatic device GPS geolocation and instant camera capture.",
    canonical: "https://smart-civic-pi.vercel.app/quick-report"
  },
  "/auth": {
    title: "Citizen Login & Registration | Smart Civic",
    description:
      "Sign in or register for Smart Civic to manage your reported civic issues, track karma points, and receive real-time SMS/WhatsApp updates.",
    canonical: "https://smart-civic-pi.vercel.app/auth"
  }
};

interface DynamicSeoProps {
  config?: RouteSeoConfig;
}

export const RouteSeo: React.FC<DynamicSeoProps> = ({ config }) => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const activeConfig = config || ROUTE_CONFIGS[pathname] || {
      title: "Smart Civic - Mumbai BMC Civic Issues & CityOS",
      description:
        "Independent AI-powered citizen civic platform for Greater Mumbai to report, verify, and track municipal issues across 24 wards.",
      canonical: `https://smart-civic-pi.vercel.app${pathname}`
    };

    // 1. Update Title
    if (activeConfig.title) {
      document.title = activeConfig.title;
    }

    // 2. Helper to set or update <meta> tags
    const updateMetaTag = (nameAttr: string, nameValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${nameValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(nameAttr, nameValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentValue);
    };

    // 3. Update Standard & OpenGraph Meta
    if (activeConfig.description) {
      updateMetaTag("name", "description", activeConfig.description);
      updateMetaTag("property", "og:description", activeConfig.description);
      updateMetaTag("name", "twitter:description", activeConfig.description);
    }

    if (activeConfig.title) {
      updateMetaTag("name", "title", activeConfig.title);
      updateMetaTag("property", "og:title", activeConfig.title);
      updateMetaTag("name", "twitter:title", activeConfig.title);
    }

    const keywords = activeConfig.keywords || DEFAULT_KEYWORDS;
    updateMetaTag("name", "keywords", keywords);

    const canonicalUrl = activeConfig.canonical || `https://smart-civic-pi.vercel.app${pathname}`;
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("name", "twitter:url", canonicalUrl);

    // 4. Update Canonical Link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // 5. Injected Route-Specific JSON-LD Schema
    const SCRIPT_ID = "dynamic-route-schema";
    let schemaScript = document.getElementById(SCRIPT_ID);

    if (activeConfig.schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = SCRIPT_ID;
        schemaScript.setAttribute("type", "application/ld+json");
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(activeConfig.schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [location.pathname, config]);

  return null;
};

export default RouteSeo;

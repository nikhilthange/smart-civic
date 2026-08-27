"use strict";

/**
 * ─── Live Telemetry & Municipal Data Simulation Service ────────────────────────
 * Generates, mutates, and persists real-time municipal events into MongoDB,
 * powering real-time Socket.IO broadcasts across all platform modules without
 * relying on static mock constants.
 */

const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Department = require("../models/Department");
const Ward = require("../models/Ward");
const SubwayStatus = require("../models/SubwayStatus");
const BinTelemetry = require("../models/BinTelemetry");
const CctvCamera = require("../models/CctvCamera");
const DilapidatedBuilding = require("../models/DilapidatedBuilding");
const RoadContract = require("../models/RoadContract");
const HousingSociety = require("../models/HousingSociety");
const WardProject = require("../models/WardProject");
const ConstructionSite = require("../models/ConstructionSite");
const HawkingZone = require("../models/HawkingZone");
const VectorOutbreak = require("../models/VectorOutbreak");
const TransitLaneObstruction = require("../models/TransitLaneObstruction");
const PropertyTaxAudit = require("../models/PropertyTaxAudit");
const AnimalWelfareRecord = require("../models/AnimalWelfareRecord");
const MangroveZone = require("../models/MangroveZone");
const HighRiseFireNoc = require("../models/HighRiseFireNoc");
const WaterFlowZone = require("../models/WaterFlowZone");

const socketService = require("./socketService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

// ─── Mumbai Geographic Bounds & Municipal Reference Data ─────────────────────
const MUMBAI_WARDS = [
  { name: "Ward A", zone: "Zone 1", lat: 18.9220, lng: 72.8340, area: "Colaba / Fort" },
  { name: "Ward B", zone: "Zone 1", lat: 18.9500, lng: 72.8380, area: "Sandhurst Road / Dongri" },
  { name: "Ward C", zone: "Zone 1", lat: 18.9480, lng: 72.8250, area: "Marine Lines / Pydhonie" },
  { name: "Ward D", zone: "Zone 1", lat: 18.9600, lng: 72.8100, area: "Malabar Hill / Grant Road" },
  { name: "Ward E", zone: "Zone 1", lat: 18.9720, lng: 72.8350, area: "Byculla" },
  { name: "Ward F-South", zone: "Zone 2", lat: 19.0020, lng: 72.8420, area: "Parel / Hindmata" },
  { name: "Ward F-North", zone: "Zone 2", lat: 19.0280, lng: 72.8550, area: "Matunga / Sion" },
  { name: "Ward G-South", zone: "Zone 2", lat: 19.0060, lng: 72.8250, area: "Worli / Lower Parel" },
  { name: "Ward G-North", zone: "Zone 2", lat: 19.0380, lng: 72.8450, area: "Dadar / Dharavi" },
  { name: "Ward H-West", zone: "Zone 3", lat: 19.0596, lng: 72.8347, area: "Bandra West / Khar" },
  { name: "Ward H-East", zone: "Zone 3", lat: 19.0720, lng: 72.8520, area: "Santacruz East" },
  { name: "Ward K-West", zone: "Zone 4", lat: 19.1136, lng: 72.8397, area: "Andheri West / Juhu" },
  { name: "Ward K-East", zone: "Zone 4", lat: 19.1180, lng: 72.8650, area: "Andheri East" },
  { name: "Ward L", zone: "Zone 5", lat: 19.0700, lng: 72.8800, area: "Kurla West" },
  { name: "Ward M-East", zone: "Zone 5", lat: 19.0600, lng: 72.9150, area: "Govandi / Mankhurd" },
  { name: "Ward N", zone: "Zone 6", lat: 19.0850, lng: 72.9080, area: "Ghatkopar" },
  { name: "Ward P-South", zone: "Zone 4", lat: 19.1600, lng: 72.8450, area: "Goregaon West" },
  { name: "Ward R-South", zone: "Zone 7", lat: 19.2050, lng: 72.8480, area: "Kandivali West" },
];

const INCIDENT_TEMPLATES = [
  {
    title: "Deep Pothole Cluster near Metro Pillar 42",
    description: "Multiple severe potholes causing traffic disruption and two-wheeler skid hazards following morning rain.",
    category: "roads_and_infrastructure",
    departmentCode: "PWD",
    priority: "high",
    severity: "high",
  },
  {
    title: "Overflowing Municipal Dumpster Bin on Main Street",
    description: "Garbage bin overflowing onto pedestrian pavement. Stray animals gathering, foul odor spreading in residential zone.",
    category: "garbage_collection",
    departmentCode: "SWM",
    priority: "medium",
    severity: "medium",
  },
  {
    title: "Major High-Pressure Water Main Burst",
    description: "Clean potable water gushing onto roadway from ruptured municipal feeder line. Road partially submerged.",
    category: "water_and_sanitation",
    departmentCode: "WSD",
    priority: "critical",
    severity: "critical",
  },
  {
    title: "Fallen Banyan Tree Branch Blocking Transit Lane",
    description: "Heavy banyan tree branch snapped and resting across north-bound arterial lane. Fire brigade assistance required.",
    category: "roads_and_infrastructure",
    departmentCode: "PRD",
    priority: "high",
    severity: "high",
  },
  {
    title: "High-Rise Fire Safety System Alarm & Blocked Hose",
    description: "Dry riser valve jammed and booster pump non-functional during quarterly inspection.",
    category: "public_safety",
    departmentCode: "PSD",
    priority: "critical",
    severity: "critical",
  },
  {
    title: "Streetlight High-Mast Failure on Coastal Crossroad",
    description: "Cluster of 4 streetlights dark for 48 hours creating blind spot at sharp pedestrian crossing.",
    category: "street_lighting",
    departmentCode: "ELD",
    priority: "medium",
    severity: "low",
  },
];

const DEFAULT_SUBWAYS = [
  {
    subwayId: "SUB-MILAN",
    subwayName: "Milan Subway Underpass",
    ward: "Ward H-West",
    safeDetourCorridor: "Milan Flyover High-Level Bypass",
    alternateFlyoverName: "Milan ROB",
    location: { type: "Point", coordinates: [72.8410, 19.0880] },
    waterDepthCm: 14,
    criticalThresholdCm: 25,
    trafficStatus: "OPEN",
    activePumpsCount: 4,
    isSimulated: true,
  },
  {
    subwayId: "SUB-ANDHERI",
    subwayName: "Andheri Subway Underpass",
    ward: "Ward K-West",
    safeDetourCorridor: "Gokhale Bridge East-West Connector",
    alternateFlyoverName: "Gokhale ROB",
    location: { type: "Point", coordinates: [72.8467, 19.1197] },
    waterDepthCm: 28,
    criticalThresholdCm: 30,
    trafficStatus: "RESTRICTED_SINGLE_LANE",
    activePumpsCount: 6,
    isSimulated: true,
  },
  {
    subwayId: "SUB-DAHISAR",
    subwayName: "Dahisar Subway",
    ward: "Ward R-North",
    safeDetourCorridor: "Western Express Highway Elevated Route",
    alternateFlyoverName: "Dahisar Toll Flyover",
    location: { type: "Point", coordinates: [72.8590, 19.2570] },
    waterDepthCm: 8,
    criticalThresholdCm: 25,
    trafficStatus: "OPEN",
    activePumpsCount: 2,
    isSimulated: true,
  },
  {
    subwayId: "SUB-KHAR",
    subwayName: "Khar Subway",
    ward: "Ward H-West",
    safeDetourCorridor: "Khar Elevated Arterial Road",
    alternateFlyoverName: "Santacruz Flyover Link",
    location: { type: "Point", coordinates: [72.8360, 19.0730] },
    waterDepthCm: 22,
    criticalThresholdCm: 30,
    trafficStatus: "OPEN",
    activePumpsCount: 3,
    isSimulated: true,
  },
];

class SimulationService {
  /**
   * Helper: Ensure default simulated citizen exists
   */
  async getOrCreateCitizen() {
    let citizen = await User.findOne({ email: "citizen.simulator@smartcity.gov.in" });
    if (!citizen) {
      citizen = await User.create({
        name: "Municipal System Simulator",
        email: "citizen.simulator@smartcity.gov.in",
        password: "SimulationPassword@123",
        role: "citizen",
        phone: "+919876543210",
        ward: "Ward G-North",
        isVerified: true,
      });
    }
    return citizen;
  }

  /**
   * Helper: Ensure municipal department exists
   */
  async getOrCreateDepartment(code, name) {
    let dept = await Department.findOne({ code });
    if (!dept) {
      dept = await Department.create({
        code,
        name: name || `${code} Department`,
        contactEmail: `contact.${code.toLowerCase()}@smartcity.gov.in`,
      });
    }
    return dept;
  }

  /**
   * 1. Dynamic Grievance Intake Generator
   * Creates N persistent complaints distributed across Mumbai's 24 wards (capped to max 25)
   */
  async generateComplaints(count = 3) {
    const citizen = await this.getOrCreateCitizen();
    const createdComplaints = [];
    const batchSize = Math.min(25, Math.max(1, parseInt(count || "3", 10)));

    for (let i = 0; i < batchSize; i++) {
      const template = INCIDENT_TEMPLATES[Math.floor(Math.random() * INCIDENT_TEMPLATES.length)];
      const wardInfo = MUMBAI_WARDS[Math.floor(Math.random() * MUMBAI_WARDS.length)];
      const latOffset = (Math.random() - 0.5) * 0.015;
      const lngOffset = (Math.random() - 0.5) * 0.015;
      const lat = wardInfo.lat + latOffset;
      const lng = wardInfo.lng + lngOffset;

      const dept = await this.getOrCreateDepartment(template.departmentCode, `${template.departmentCode} Municipal Services`);

      const slaHours = template.priority === "critical" ? 12 : template.priority === "high" ? 24 : 48;
      const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

      const complaint = await Complaint.create({
        title: `${template.title} (${wardInfo.name})`,
        description: template.description,
        category: template.category,
        priority: template.priority,
        priorityScore: template.priority === "critical" ? 30 : template.priority === "high" ? 20 : 10,
        status: "submitted",
        corporationId: "BMC",
        jurisdictionType: "municipal",
        ward: wardInfo.name,
        wardName: wardInfo.name,
        wardCode: wardInfo.name,
        zone: wardInfo.zone,
        slaDeadline,
        slaStatus: "on_time",
        citizen: citizen._id,
        department: dept._id,
        departmentName: dept.name,
        isSimulated: true,
        location: {
          address: `${wardInfo.area}, Mumbai, Maharashtra`,
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
          coordinates: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
        attachments: [
          {
            url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop",
            filename: "civic_incident_proof.jpg",
            publicId: null,
          },
        ],
        aiAnalysis: {
          verified: true,
          confidence: 0.94,
          category: template.category,
          severity: template.severity,
          department: template.departmentCode,
          explanation: `Automated vision engine verified ${template.category} incident with 94% confidence.`,
        },
        statusHistory: [
          {
            status: "submitted",
            changedBy: citizen._id,
            note: "Dynamic civic incident spawned via Municipal Simulation Engine.",
            changedAt: new Date(),
          },
        ],
      });

      createdComplaints.push(complaint);

      // Real-time broadcast via Socket.IO
      try {
        socketService.broadcastComplaintCreated(complaint);
      } catch {
        // Continue silently if socket is not bound
      }
    }

    invalidateCache(["sitrep:", "complaints:", "/api/sitrep", "complaint:", "/api/complaints"]);
    return createdComplaints;
  }

  /**
   * 2. Flooded Subway Underpass Sensor
   */
  async ensureSubways() {
    const count = await SubwayStatus.countDocuments();
    if (count === 0) {
      for (const sub of DEFAULT_SUBWAYS) {
        await SubwayStatus.create(sub);
      }
    }
    return SubwayStatus.find().lean();
  }

  async simulateSubwaySpike(subwayId = "SUB-ANDHERI", depthCm = 45) {
    await this.ensureSubways();
    let subway = await SubwayStatus.findOne({ subwayId }) || await SubwayStatus.findOne();
    if (subway) {
      subway.waterDepthCm = Number(depthCm);
      subway.trafficStatus = subway.waterDepthCm >= subway.criticalThresholdCm ? "SUBMERGED_CLOSED" : "RESTRICTED_SINGLE_LANE";
      subway.activePumpsCount = subway.waterDepthCm >= subway.criticalThresholdCm ? 8 : 4;
      await subway.save();

      try {
        socketService.broadcastDisasterAlert({
          type: "SUBWAY_FLOOD_SPIKE",
          subwayId: subway.subwayId,
          subwayName: subway.subwayName,
          waterDepthCm: subway.waterDepthCm,
          trafficStatus: subway.trafficStatus,
          timestamp: new Date(),
        });
      } catch {
        // continue
      }
    }
    invalidateCache(["subway:", "sitrep:", "/api/sitrep"]);
    return subway;
  }

  /**
   * 3. SWM Smart Bin Telemetry
   */
  async ensureBins() {
    const count = await BinTelemetry.countDocuments();
    if (count === 0) {
      const defaultBins = [
        {
          binId: "BIN-HW-042",
          ward: "Ward H-West",
          locationName: "Bandra Bandstand Promenade",
          currentFillPercentage: 72,
          batteryLevel: 94,
          status: "NORMAL",
          location: { type: "Point", coordinates: [72.8220, 19.0430] },
          isSimulated: true,
        },
        {
          binId: "BIN-GN-018",
          ward: "Ward G-North",
          locationName: "Dadar Flower Market Central",
          currentFillPercentage: 91,
          batteryLevel: 88,
          status: "OVERFLOWING",
          location: { type: "Point", coordinates: [72.8420, 19.0190] },
          isSimulated: true,
        },
      ];
      for (const bin of defaultBins) {
        await BinTelemetry.create(bin);
      }
    }
    return BinTelemetry.find().lean();
  }

  async simulateBinFill(binId = "BIN-HW-042", fillPercentage = 95) {
    await this.ensureBins();
    let bin = await BinTelemetry.findOne({ binId }) || await BinTelemetry.findOne();
    if (bin) {
      bin.currentFillPercentage = Number(fillPercentage);
      bin.status = bin.currentFillPercentage >= 90 ? "OVERFLOWING" : bin.currentFillPercentage >= 75 ? "NEAR_FULL" : "NORMAL";
      await bin.save();
    }
    invalidateCache(["swm:", "bin:", "sitrep:", "/api/sitrep"]);
    return bin;
  }

  /**
   * 4. CCTV Camera Stream & Anomaly
   */
  async ensureCctvCameras() {
    const count = await CctvCamera.countDocuments();
    if (count === 0) {
      const defaultCameras = [
        {
          cameraId: "CAM-DDR-01",
          cameraName: "Dadar TT Circle South Pole",
          junction: "Dadar TT Circle Junction",
          ward: "Ward G-North",
          feedStatus: "ONLINE_STREAMING",
          streamUrl: "https://cctv.smartcity.mumbai.gov.in/live/cam-ddr-01.m3u8",
          location: { type: "Point", coordinates: [72.8450, 19.0180] },
          lastDetectedAnomaly: {
            anomalyType: "TRAFFIC_GRIDLOCK",
            confidence: 0.92,
            detectedAt: new Date(),
            boundingBox: [10, 10, 40, 40],
          },
          isSimulated: true,
        },
        {
          cameraId: "CAM-BND-02",
          cameraName: "Linking Road Khar Junction",
          junction: "Linking Road & 24th Road Intersection",
          ward: "Ward H-West",
          feedStatus: "ONLINE_STREAMING",
          streamUrl: "https://cctv.smartcity.mumbai.gov.in/live/cam-bnd-02.m3u8",
          location: { type: "Point", coordinates: [72.8340, 19.0650] },
          lastDetectedAnomaly: {
            anomalyType: "WATERLOGGING",
            confidence: 0.88,
            detectedAt: new Date(),
            boundingBox: [20, 20, 50, 50],
          },
          isSimulated: true,
        },
      ];
      for (const cam of defaultCameras) {
        await CctvCamera.create(cam);
      }
    }
    return CctvCamera.find().lean();
  }

  async simulateCctvAnomaly(cameraId = "CAM-DDR-01", anomalyType = "DEBRIS_DUMPING") {
    await this.ensureCctvCameras();
    const cam = await CctvCamera.findOne({ cameraId }) || await CctvCamera.findOne();
    if (cam) {
      cam.lastDetectedAnomaly = {
        anomalyType,
        confidence: 0.95,
        detectedAt: new Date(),
        boundingBox: [14, 9, 38, 24],
      };
      await cam.save();
    }
    invalidateCache(["cctv:", "sitrep:", "/api/sitrep"]);
    return cam;
  }

  /**
   * 5. Structural C1 Dilapidated Building Tilt Sensor
   */
  async ensureBuildings() {
    const count = await DilapidatedBuilding.countDocuments();
    if (count === 0) {
      await DilapidatedBuilding.create([
        {
          buildingId: "BLD-C1-001",
          buildingName: "Kailash Niwas Chawl Complex",
          ward: "Ward F-South",
          address: "Dr. B.A. Road, Parel, Mumbai",
          structuralCategory: "C1_DEMOLISH_IMMEDIATE",
          residentFamilyCount: 32,
          tiltAngleDegrees: 1.8,
          crackDisplacementMm: 8.5,
          status: "ELEVATED_VIBRATION",
          location: { type: "Point", coordinates: [72.8410, 19.0050] },
          isSimulated: true,
        },
        {
          buildingId: "BLD-C1-002",
          buildingName: "Koliwada Manor Transit Structure",
          ward: "Ward G-North",
          address: "Dharavi Kumbharwada",
          structuralCategory: "C2A_MAJOR_REPAIRS_EVACUATE",
          residentFamilyCount: 24,
          tiltAngleDegrees: 2.6,
          crackDisplacementMm: 12.4,
          status: "IMMINENT_COLLAPSE_HAZARD",
          location: { type: "Point", coordinates: [72.8520, 19.0380] },
          isSimulated: true,
        },
      ]);
    }
    return DilapidatedBuilding.find().lean();
  }

  async simulateBuildingTilt(buildingId = "BLD-C1-001", tiltMm = 14.5) {
    await this.ensureBuildings();
    let building = await DilapidatedBuilding.findOne({ buildingId }) || await DilapidatedBuilding.findOne();
    if (building) {
      const tilt = Number(tiltMm) || 2.5;
      building.tiltAngleDegrees = tilt;
      if (building.tiltAngleDegrees >= 2.5) {
        building.status = "IMMINENT_COLLAPSE_HAZARD";
        building.occupancyStatus = "FULLY_EVACUATED";
      } else if (building.tiltAngleDegrees >= 1.5) {
        building.status = "ELEVATED_VIBRATION";
      }
      await building.save();
    }
    invalidateCache(["structural:", "sitrep:", "/api/sitrep"]);
    return building;
  }

  /**
   * 6. Live Simulation Step (Tick)
   * Advances real-time state across subways, IoT bins, and telemetry in MongoDB
   */
  async tick() {
    await this.ensureSubways();
    await this.ensureBins();
    await this.ensureCctvCameras();

    // Fluctuate subways
    const subways = await SubwayStatus.find();
    for (const sub of subways) {
      const delta = (Math.random() - 0.48) * 3;
      sub.waterDepthCm = Math.max(0, Math.min(120, Math.round(sub.waterDepthCm + delta)));
      if (sub.waterDepthCm >= sub.criticalThresholdCm) {
        sub.trafficStatus = "SUBMERGED_CLOSED";
      } else if (sub.waterDepthCm >= sub.criticalThresholdCm * 0.7) {
        sub.trafficStatus = "RESTRICTED_SINGLE_LANE";
      } else {
        sub.trafficStatus = "OPEN";
      }
      await sub.save();
    }

    // Fluctuate bins
    const bins = await BinTelemetry.find();
    for (const bin of bins) {
      const fillDelta = Math.floor(Math.random() * 8) - 1;
      bin.currentFillPercentage = Math.max(5, Math.min(100, bin.currentFillPercentage + fillDelta));
      bin.status = bin.currentFillPercentage >= 90 ? "OVERFLOWING" : bin.currentFillPercentage >= 75 ? "NEAR_FULL" : "NORMAL";
      await bin.save();
    }

    invalidateCache(["subway:", "bin:", "cctv:", "sitrep:", "/api/sitrep"]);
    return {
      success: true,
      timestamp: new Date(),
      subwaysCount: subways.length,
      binsCount: bins.length,
    };
  }

  /**
   * 7. Resilient Batch Seeder for All Municipal Modules
   */
  async batchSeedAllModules() {
    const summary = {};

    const seedTasks = [
      {
        name: "complaints",
        task: async () => {
          const list = await this.generateComplaints(5);
          return list.length;
        },
      },
      {
        name: "subways",
        task: async () => {
          const list = await this.ensureSubways();
          return list.length;
        },
      },
      {
        name: "bins",
        task: async () => {
          const list = await this.ensureBins();
          return list.length;
        },
      },
      {
        name: "cctvCameras",
        task: async () => {
          const list = await this.ensureCctvCameras();
          return list.length;
        },
      },
      {
        name: "dilapidatedBuildings",
        task: async () => {
          const list = await this.ensureBuildings();
          return list.length;
        },
      },
      {
        name: "roadContracts",
        task: async () => {
          const count = await RoadContract.countDocuments();
          if (count === 0) {
            await RoadContract.create([
              {
                contractId: "DLP-HW-8812",
                roadName: "S.V. Road Khar Carriageway",
                contractorId: "CON-UNITY-01",
                contractorName: "M/s Unity Infrastructure Ltd",
                ward: "Ward H-West",
                completionDate: new Date(Date.now() - 180 * 86400000),
                dlpExpiryDate: new Date(Date.now() + 730 * 86400000),
                retentionFundAmountInr: 2500000,
                status: "ACTIVE_WARRANTY",
                geometry: { type: "Point", coordinates: [72.8347, 19.0596] },
                isSimulated: true,
              },
              {
                contractId: "DLP-GN-9041",
                roadName: "Senapati Bapat Marg South-Bound",
                contractorId: "CON-LNDMRK-02",
                contractorName: "M/s Landmark Roadways Corp",
                ward: "Ward G-North",
                completionDate: new Date(Date.now() - 90 * 86400000),
                dlpExpiryDate: new Date(Date.now() + 900 * 86400000),
                retentionFundAmountInr: 3200000,
                status: "ACTIVE_WARRANTY",
                geometry: { type: "Point", coordinates: [72.8420, 19.0180] },
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "housingSocieties",
        task: async () => {
          const count = await HousingSociety.countDocuments();
          if (count === 0) {
            await HousingSociety.create([
              {
                societyId: "CHS-HW-01",
                name: "Sea Breeze Co-op Housing Society",
                ward: "Ward H-West",
                registrationNo: "BOM/HSG/8812",
                totalFlats: 96,
                segregationScorePct: 92,
                hasCompostPit: true,
                hasRwh: true,
                isSimulated: true,
              },
              {
                societyId: "CHS-GN-02",
                name: "Shivaji Park Horizon Heights CHS",
                ward: "Ward G-North",
                registrationNo: "BOM/HSG/9041",
                totalFlats: 64,
                segregationScorePct: 88,
                hasCompostPit: true,
                hasRwh: false,
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "wardProjects",
        task: async () => {
          const count = await WardProject.countDocuments();
          if (count === 0) {
            await WardProject.create([
              {
                projectId: "PRJ-GN-01",
                title: "Solar Rooftop Micro-Grid & Rainwater Park",
                ward: "Ward G-North",
                category: "SOLAR_STREETLIGHTS",
                estimatedBudgetInr: 1500000,
                description: "Eco-friendly community solar installation and ground aquifer recharge wells.",
                corporatorName: "Hon. Ward Corporator (BMC)",
                estimatedBeneficiaryCitizens: 22000,
                status: "PROPOSED",
                votesCount: 142,
                isSimulated: true,
              },
              {
                projectId: "PRJ-HW-02",
                title: "Smart Pedestrian Crosswalk & LED Refuge Islands",
                ward: "Ward H-West",
                category: "PEDESTRIAN_FOOTPATH_UPGRADE",
                estimatedBudgetInr: 1800000,
                description: "High-visibility pedestrian safety corridors near school zones.",
                corporatorName: "Hon. Ward Corporator (BMC)",
                estimatedBeneficiaryCitizens: 35000,
                status: "CITIZEN_APPROVED",
                votesCount: 298,
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "constructionSites",
        task: async () => {
          const count = await ConstructionSite.countDocuments();
          if (count === 0) {
            await ConstructionSite.create([
              {
                siteId: "SITE-GN-01",
                developerName: "Lodha Commercial Developers",
                projectName: "Lodha Supremus Tower B",
                reraPermitNo: "P51900028911",
                ward: "Ward G-North",
                address: "Senapati Bapat Marg, Lower Parel / Dadar",
                has35FtBarricadeCompliance: true,
                hasWheelWashBasin: true,
                hasAntiSmogGun: true,
                currentPm10: 92,
                currentPm25: 45,
                status: "COMPLIANT",
                location: { type: "Point", coordinates: [72.8310, 19.0125] },
                isSimulated: true,
              },
              {
                siteId: "SITE-HW-02",
                developerName: "Rustomjee Luxury Estates",
                projectName: "Rustomjee Seasons Phase 3",
                reraPermitNo: "P51800010924",
                ward: "Ward H-West",
                address: "Bandra Reclamation Arterial",
                has35FtBarricadeCompliance: false,
                hasWheelWashBasin: false,
                hasAntiSmogGun: true,
                currentPm10: 184,
                currentPm25: 88,
                stopWorkNoticeIssued: true,
                totalPenaltiesLeviedInr: 50000,
                status: "STOP_WORK_NOTICE_ACTIVE",
                location: { type: "Point", coordinates: [72.8250, 19.0520] },
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "hawkingZones",
        task: async () => {
          const count = await HawkingZone.countDocuments();
          if (count === 0) {
            await HawkingZone.create([
              {
                zoneId: "HWK-DDR-01",
                zoneName: "Dadar Suburban Station 150m Statutory Perimeter",
                ward: "Ward G-North",
                zoneType: "NON_HAWKING_ZONE",
                restrictionReason: "150-Meter Statutory Buffer from Suburban Railway Station / Hospital",
                authorizedStallCapacity: 0,
                geometry: { type: "Point", coordinates: [72.8425, 19.0185] },
                isSimulated: true,
              },
              {
                zoneId: "HWK-BND-02",
                zoneName: "Bandra Hill Road Regulated Hawker Plaza",
                ward: "Ward H-West",
                zoneType: "DESIGNATED_HAWKING_ZONE",
                restrictionReason: "Designated Vendor Zone",
                authorizedStallCapacity: 45,
                geometry: { type: "Point", coordinates: [72.8340, 19.0550] },
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "vectorOutbreaks",
        task: async () => {
          const count = await VectorOutbreak.countDocuments();
          if (count === 0) {
            await VectorOutbreak.create([
              {
                clusterId: "VEC-DHR-01",
                ward: "Ward G-North",
                locality: "Dharavi Transit Camp Sector 3",
                diseaseType: "DENGUE",
                reportedFeverCases: 19,
                larvalBreedingIndex: 34,
                stagnantWaterGrievanceCount: 8,
                riskScore: 88,
                riskLevel: "CRITICAL_EPIDEMIC_SURGE",
                location: { type: "Point", coordinates: [72.8550, 19.0420] },
                isSimulated: true,
              },
              {
                clusterId: "VEC-KRL-02",
                ward: "Ward L",
                locality: "Kurla West Pipeline Slum Corridor",
                diseaseType: "MALARIA",
                reportedFeverCases: 14,
                larvalBreedingIndex: 28,
                stagnantWaterGrievanceCount: 6,
                riskScore: 74,
                riskLevel: "CRITICAL_EPIDEMIC_SURGE",
                location: { type: "Point", coordinates: [72.8750, 19.0680] },
                isSimulated: true,
              },
            ]);
            return 2;
          }
          return count;
        },
      },
      {
        name: "transitObstructions",
        task: async () => {
          const count = await TransitLaneObstruction.countDocuments();
          if (count === 0) {
            await TransitLaneObstruction.create([
              {
                obstructionId: "OBS-BEST-01",
                bestBusVehicleId: "BEST-EV-902",
                routeCorridorName: "BKC Dedicated Transit Lane",
                ward: "Ward H-East",
                vehiclePlateNo: "MH-02-EQ-8819",
                vehicleType: "PRIVATE_CAR",
                transitDelaySeconds: 160,
                challanAmountInr: 1500,
                status: "CHALLAN_ISSUED",
                towingVehicleDispatched: true,
                location: { type: "Point", coordinates: [72.8680, 19.0650] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
      {
        name: "propertyTaxAudits",
        task: async () => {
          const count = await PropertyTaxAudit.countDocuments();
          if (count === 0) {
            await PropertyTaxAudit.create([
              {
                propertySacNo: "SAC-HW-99104",
                ownerName: "M/s Horizon Hospitality & Suites",
                ward: "Ward H-West",
                address: "Linking Road Commercial Plaza",
                assessedCarpetAreaSqFt: 1800,
                lidarMeasuredAreaSqFt: 2750,
                permittedLandUse: "RESIDENTIAL",
                detectedActualUse: "COMMERCIAL_UNAUTHORIZED",
                hasRooftopExtension: true,
                estimatedTaxDeficitInr: 380000,
                penaltyAmountInr: 100000,
                status: "DEMAND_NOTICE_SERVED",
                location: { type: "Point", coordinates: [72.8340, 19.0590] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
      {
        name: "animalWelfareRecords",
        task: async () => {
          const count = await AnimalWelfareRecord.countDocuments();
          if (count === 0) {
            await AnimalWelfareRecord.create([
              {
                recordId: "ANM-DHR-01",
                ward: "Ward G-North",
                locality: "Dharavi 90 Feet Road",
                animalType: "CANINE_STRAY",
                sterilizationStatus: "UNSTERILIZED",
                reportedDogBites30Days: 14,
                packAggressionScore: 80,
                riskLevel: "CRITICAL_RABIES_SURGE",
                location: { type: "Point", coordinates: [72.8450, 19.0400] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
      {
        name: "mangroveZones",
        task: async () => {
          const count = await MangroveZone.countDocuments();
          if (count === 0) {
            await MangroveZone.create([
              {
                zoneId: "CRZ-KW-01",
                zoneName: "Versova-Lokhandwala Mangrove Belt",
                ward: "Ward K-West",
                crzClassification: "CRZ_I_ECOLOGICALLY_SENSITIVE",
                baselineNdvi: 0.78,
                currentNdvi: 0.51,
                vegetationLossPercentage: 34.6,
                debrisDumpingDetected: true,
                status: "CRITICAL_CRZ_DESTRUCTION",
                geometry: { type: "Point", coordinates: [72.8220, 19.1400] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
      {
        name: "fireSafetyBuildings",
        task: async () => {
          const count = await HighRiseFireNoc.countDocuments();
          if (count === 0) {
            await HighRiseFireNoc.create([
              {
                buildingId: "FIRE-HW-01",
                buildingName: "Sea View Imperial Towers",
                ward: "Ward H-West",
                address: "Bandra Reclamation Arterial",
                floorCount: 34,
                propertyTaxSacId: "SAC-HW-00109",
                fireNocExpiryDate: new Date(Date.now() - 30 * 86400000),
                fireNocStatus: "EXPIRED",
                wetRiserPressureKgCm2: 2.1,
                refugeFloorEncroached: true,
                location: { type: "Point", coordinates: [72.8250, 19.0550] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
      {
        name: "waterFlowZones",
        task: async () => {
          const count = await WaterFlowZone.countDocuments();
          if (count === 0) {
            await WaterFlowZone.create([
              {
                zoneId: "DMA-GN-01",
                zoneName: "Dadar-Prabhadevi High Pressure Distribution Zone",
                ward: "Ward G-North",
                masterReservoirInflowMld: 48.0,
                aggregateDmaOutflowMld: 36.8,
                lossPercentage: 23.3,
                status: "CRITICAL_PIPELINE_THEFT_LEAK",
                pipelinePressurePsi: 38.5,
                location: { type: "Point", coordinates: [72.8425, 19.0185] },
                isSimulated: true,
              },
            ]);
            return 1;
          }
          return count;
        },
      },
    ];

    const results = await Promise.allSettled(
      seedTasks.map(async (st) => {
        const count = await st.task();
        return { name: st.name, count };
      })
    );

    for (const res of results) {
      if (res.status === "fulfilled") {
        summary[res.value.name] = { status: "SEEDED", count: res.value.count };
      } else {
        summary[res.reason?.name || "unknown"] = { status: "FAILED", error: res.reason?.message || "Failed to seed" };
      }
    }

    invalidateCache([
      "sitrep:", "complaint:", "subway:", "swm:", "cctv:", "structural:",
      "dlp:", "alm:", "ward-budget:", "aqi:", "encroachment:", "vector:",
      "transit-lane:", "tax-audit:", "animal-welfare:", "coastal:",
      "fire-safety:", "water:", "/api/sitrep", "/api/complaints"
    ]);

    return {
      success: true,
      message: "Successfully seeded municipal collections with live MongoDB records!",
      summary,
      timestamp: new Date(),
    };
  }

  /**
   * 8. Comprehensive Multi-Collection Simulation Cleanup
   * Purges { isSimulated: true } across all 17 municipal collections via Promise.allSettled
   */
  async cleanupSimulatedData() {
    const models = [
      { name: "complaints", model: Complaint },
      { name: "subways", model: SubwayStatus },
      { name: "bins", model: BinTelemetry },
      { name: "cctvCameras", model: CctvCamera },
      { name: "dilapidatedBuildings", model: DilapidatedBuilding },
      { name: "roadContracts", model: RoadContract },
      { name: "housingSocieties", model: HousingSociety },
      { name: "wardProjects", model: WardProject },
      { name: "constructionSites", model: ConstructionSite },
      { name: "hawkingZones", model: HawkingZone },
      { name: "vectorOutbreaks", model: VectorOutbreak },
      { name: "transitObstructions", model: TransitLaneObstruction },
      { name: "propertyTaxAudits", model: PropertyTaxAudit },
      { name: "animalWelfareRecords", model: AnimalWelfareRecord },
      { name: "mangroveZones", model: MangroveZone },
      { name: "fireSafetyBuildings", model: HighRiseFireNoc },
      { name: "waterFlowZones", model: WaterFlowZone },
    ];

    const results = await Promise.allSettled(
      models.map(async (m) => {
        const res = await m.model.deleteMany({ isSimulated: true });
        return { name: m.name, count: res.deletedCount || 0 };
      })
    );

    let totalDeleted = 0;
    const summary = {};

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const modelName = models[i].name;
      if (res.status === "fulfilled") {
        summary[modelName] = res.value.count;
        totalDeleted += res.value.count;
      } else {
        summary[modelName] = 0;
      }
    }

    invalidateCache([
      "complaint:", "sitrep:", "subway:", "swm:", "cctv:", "structural:",
      "dlp:", "alm:", "ward-budget:", "aqi:", "encroachment:", "vector:",
      "transit-lane:", "tax-audit:", "animal-welfare:", "coastal:",
      "fire-safety:", "water:", "/api/complaints", "/api/sitrep"
    ]);

    return {
      success: true,
      deletedTotal: totalDeleted,
      summary,
    };
  }
}

module.exports = new SimulationService();

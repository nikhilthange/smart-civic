"use strict";

const mongoose = require("mongoose");
const TransitLaneObstruction = require("../models/TransitLaneObstruction");

/**
 * ─── BEST Transit Lane Dashcam Vision & ANPR Challan Service ─────────────────────
 */

const DEFAULT_OBSTRUCTIONS = [
  {
    obstructionId: "OBS-BKC-01",
    bestBusVehicleId: "BEST-EV-902",
    routeCorridorName: "Bandra-Kurla Complex Dedicated BRTS Corridor",
    ward: "Ward H-East",
    vehiclePlateNo: "MH-02-EQ-8819",
    vehicleType: "PRIVATE_CAR",
    challanAmountInr: 1500,
    transitDelaySeconds: 165,
    towingVehicleDispatched: true,
    status: "TOWING_DISPATCHED",
    coordinates: [72.8680, 19.0650],
  },
  {
    obstructionId: "OBS-JVLR-02",
    bestBusVehicleId: "BEST-CNG-418",
    routeCorridorName: "Jogeshwari-Vikhroli Link Road (JVLR) Bus Lane",
    ward: "Ward K-East",
    vehiclePlateNo: "MH-04-AB-3301",
    vehicleType: "COMMERCIAL_TRUCK",
    challanAmountInr: 3000,
    transitDelaySeconds: 240,
    towingVehicleDispatched: true,
    status: "CHALLAN_ISSUED",
    coordinates: [72.8750, 19.1280],
  },
  {
    obstructionId: "OBS-WEH-03",
    bestBusVehicleId: "BEST-EV-104",
    routeCorridorName: "Western Express Highway Bus Priority Sluice",
    ward: "Ward H-West",
    vehiclePlateNo: "MH-01-BK-7492",
    vehicleType: "AUTO_RICKSHAW",
    challanAmountInr: 1500,
    transitDelaySeconds: 95,
    towingVehicleDispatched: false,
    status: "CHALLAN_ISSUED",
    coordinates: [72.8420, 19.0810],
  },
];

/**
 * Processes frontline dashcam ANPR detection and generates digital traffic e-challan
 */
function generateTransitLaneChallan({
  bestBusVehicleId = "BEST-EV-902",
  routeCorridorName = "Bandra-Kurla Complex Dedicated BRTS Corridor",
  ward = "Ward H-East",
  vehiclePlateNo = "MH-02-EQ-8819",
  vehicleType = "PRIVATE_CAR",
  transitDelaySeconds = 150,
}) {
  const isCommercial = vehicleType === "COMMERCIAL_TRUCK";
  const challanAmountInr = isCommercial ? 3000 : 1500;
  const shouldDispatchTow = Number(transitDelaySeconds) >= 120 || isCommercial;

  const obstructionId = `OBS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const challan = {
    obstructionId,
    bestBusVehicleId,
    routeCorridorName,
    ward,
    vehiclePlateNo: vehiclePlateNo.toUpperCase().trim(),
    vehicleType,
    challanAmountInr,
    transitDelaySeconds: Number(transitDelaySeconds),
    towingVehicleDispatched: shouldDispatchTow,
    status: shouldDispatchTow ? "TOWING_DISPATCHED" : "CHALLAN_ISSUED",
    policeNotice: `🚨 BEST BUS LANE VIOLATION: Vehicle ${vehiclePlateNo} captured obstructing ${routeCorridorName}. E-challan of ₹${challanAmountInr.toLocaleString()} issued via Mumbai Traffic Police portal.${shouldDispatchTow ? " Hydraulic towing truck dispatched." : ""}`,
  };

  return challan;
}

module.exports = {
  DEFAULT_OBSTRUCTIONS,
  generateTransitLaneChallan,
};

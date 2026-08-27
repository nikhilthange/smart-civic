"use strict";

const express = require("express");
const router = express.Router();
const {
  getSmartBins,
  createSmartBin,
  logRfidLift,
  auditRouteCompliance,
  getFleetCorridors,
} = require("../controllers/swmFleetController");

router.get("/bins", getSmartBins);
router.post("/bins", createSmartBin);
router.post("/rfid-lift", logRfidLift);
router.post("/check-route-deviation", auditRouteCompliance);
router.get("/fleet-status", getFleetCorridors);

module.exports = router;

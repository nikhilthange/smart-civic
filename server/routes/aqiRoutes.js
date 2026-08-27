"use strict";

const express = require("express");
const router = express.Router();
const {
  getConstructionSites,
  createConstructionSite,
  ingestAqiTelemetry,
  verifyBarricades,
} = require("../controllers/aqiController");

router.get("/sites", getConstructionSites);
router.post("/sites", createConstructionSite);
router.post("/telemetry", ingestAqiTelemetry);
router.post("/verify-barricade", verifyBarricades);

module.exports = router;

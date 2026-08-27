"use strict";

const express = require("express");
const router = express.Router();
const {
  getFireSafetyBuildings,
  createFireBuilding,
  ingestFireTelemetry,
  auditRefugeArea,
} = require("../controllers/fireSafetyController");

router.get("/buildings", getFireSafetyBuildings);
router.post("/buildings", createFireBuilding);
router.post("/telemetry", ingestFireTelemetry);
router.post("/audit-refuge", auditRefugeArea);

module.exports = router;

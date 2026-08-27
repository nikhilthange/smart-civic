"use strict";

const express = require("express");
const router = express.Router();
const {
  getDilapidatedBuildings,
  createDilapidatedBuilding,
  ingestStructuralTelemetry,
  issueEvacuationOrder,
} = require("../controllers/structuralHealthController");

router.get("/buildings", getDilapidatedBuildings);
router.post("/buildings", createDilapidatedBuilding);
router.post("/telemetry", ingestStructuralTelemetry);
router.post("/evacuation-order", issueEvacuationOrder);

module.exports = router;

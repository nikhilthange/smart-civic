"use strict";

const express = require("express");
const router = express.Router();
const {
  getDilapidatedBuildings,
  ingestStructuralTelemetry,
  issueEvacuationOrder,
} = require("../controllers/structuralHealthController");

router.get("/buildings", getDilapidatedBuildings);
router.post("/telemetry", ingestStructuralTelemetry);
router.post("/evacuation-order", issueEvacuationOrder);

module.exports = router;

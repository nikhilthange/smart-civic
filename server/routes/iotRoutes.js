const express = require("express");
const router = express.Router();
const { ingestTelemetry } = require("../controllers/iotController");

// Public IoT Telemetry Ingestion endpoint
router.post("/telemetry", ingestTelemetry);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const {
  getSubways,
  createSubway,
  ingestSubwayTelemetry,
} = require("../controllers/disasterController");

router.get("/subways", getSubways);
router.post("/subways", createSubway);
router.post("/telemetry", ingestSubwayTelemetry);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const {
  getSubways,
  ingestSubwayTelemetry,
} = require("../controllers/disasterController");

router.get("/subways", getSubways);
router.post("/telemetry", ingestSubwayTelemetry);

module.exports = router;

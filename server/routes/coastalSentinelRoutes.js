"use strict";

const express = require("express");
const router = express.Router();
const {
  getMangroveZones,
  ingestCoastalScan,
  issueMangroveInjunction,
} = require("../controllers/coastalSentinelController");

router.get("/zones", getMangroveZones);
router.post("/scan-telemetry", ingestCoastalScan);
router.post("/issue-injunction", issueMangroveInjunction);

module.exports = router;

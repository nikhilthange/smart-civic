"use strict";

const express = require("express");
const router = express.Router();
const {
  getWaterAuditZones,
  createWaterZone,
  createTankerTripPass,
  verifyTankerQr,
} = require("../controllers/waterController");

router.get("/audit-zones", getWaterAuditZones);
router.post("/audit-zones", createWaterZone);
router.post("/tanker-pass", createTankerTripPass);
router.post("/verify-tanker-qr", verifyTankerQr);

module.exports = router;

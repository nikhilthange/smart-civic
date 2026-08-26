"use strict";

const express = require("express");
const router = express.Router();
const {
  getWaterAuditZones,
  createTankerTripPass,
  verifyTankerQr,
} = require("../controllers/waterController");

router.get("/audit-zones", getWaterAuditZones);
router.post("/tanker-pass", createTankerTripPass);
router.post("/verify-tanker-qr", verifyTankerQr);

module.exports = router;

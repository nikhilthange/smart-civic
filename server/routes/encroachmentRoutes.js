"use strict";

const express = require("express");
const router = express.Router();
const {
  getHawkingZones,
  createHawkingZone,
  auditHawkingEncroachment,
} = require("../controllers/encroachmentController");

router.get("/zones", getHawkingZones);
router.post("/zones", createHawkingZone);
router.post("/check-zone", auditHawkingEncroachment);

module.exports = router;

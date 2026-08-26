"use strict";

const express = require("express");
const router = express.Router();
const {
  getHawkingZones,
  auditHawkingEncroachment,
} = require("../controllers/encroachmentController");

router.get("/zones", getHawkingZones);
router.post("/check-zone", auditHawkingEncroachment);

module.exports = router;

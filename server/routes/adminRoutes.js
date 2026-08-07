"use strict";

const express = require("express");
const router = express.Router();
const { getWardPerformanceScorecard } = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

// Ward Governance Scorecard — available to Admin and Officer roles
router.get("/ward-performance", protect, authorize("admin", "officer"), getWardPerformanceScorecard);

module.exports = router;

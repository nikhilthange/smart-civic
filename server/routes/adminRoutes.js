"use strict";

const express = require("express");
const router = express.Router();
const { getWardPerformanceScorecard, reassignDepartment } = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

// Ward Governance Scorecard — available to Admin and Officer roles
router.get("/ward-performance", protect, authorize("admin", "officer"), getWardPerformanceScorecard);

// Re-assign complaint department — available to Admin and Officer roles
router.patch("/complaints/:id/department", protect, authorize("admin", "officer"), reassignDepartment);

module.exports = router;

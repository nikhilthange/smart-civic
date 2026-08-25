"use strict";

const express = require("express");
const router = express.Router();
const {
  getWardPerformanceScorecard,
  reassignComplaintDepartment,
  getContractorsList,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

// Ward Governance Scorecard — available to Admin and Officer roles
router.get("/ward-performance", protect, authorize("admin", "officer"), getWardPerformanceScorecard);

// Contractor Reliability & Escrow Ledger Leaderboard
router.get("/contractors", protect, authorize("admin", "officer"), getContractorsList);

// Admin Department Reassignment Override
router.patch("/complaints/:id/department", protect, authorize("admin"), reassignComplaintDepartment);

module.exports = router;

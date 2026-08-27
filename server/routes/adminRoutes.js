"use strict";

const express = require("express");
const router = express.Router();
const {
  getWardPerformanceScorecard,
  reassignComplaintDepartment,
  getContractorsList,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");
const queueService = require("../services/queueService");

// Ward Governance Scorecard — available to Admin and Officer roles
router.get("/ward-performance", protect, authorize("admin", "officer"), getWardPerformanceScorecard);

// Contractor Reliability & Escrow Ledger Leaderboard
router.get("/contractors", protect, authorize("admin", "officer"), getContractorsList);

// Admin Department Reassignment Override
router.patch("/complaints/:id/department", protect, authorize("admin"), reassignComplaintDepartment);

// Dead Letter Queue (DLQ) Management APIs
router.get("/queues/failed", protect, authorize("admin"), (req, res) => {
  const failedJobs = queueService.getFailedJobs();
  res.status(200).json({
    success: true,
    totalFailed: failedJobs.length,
    failedJobs,
  });
});

router.post("/queues/retry/:id", protect, authorize("admin"), (req, res) => {
  const result = queueService.retryFailedJob(req.params.id);
  if (!result) {
    return res.status(404).json({
      success: false,
      message: `Failed job with ID '${req.params.id}' not found in Dead Letter Queue`,
    });
  }
  res.status(200).json(result);
});

module.exports = router;

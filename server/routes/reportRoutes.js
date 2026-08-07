const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const {
  getWardSummaryReport,
  getGovernmentOverviewReport,
} = require("../controllers/reportController");

// GET /api/reports/ward-summary — Executive Ward Audit Summary Report
router.get(
  "/ward-summary",
  protect,
  authorize("admin", "officer"),
  getWardSummaryReport
);

// GET /api/reports/government-overview — Cross-Corporation Multi-Tenant Government Report
router.get(
  "/government-overview",
  protect,
  authorize("admin"),
  getGovernmentOverviewReport
);

module.exports = router;

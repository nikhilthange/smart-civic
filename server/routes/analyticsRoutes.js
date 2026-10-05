const express = require("express");
const router = express.Router();
const { getAnalytics, getAnalyticsSummary, getWardScorecards } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middlewares/auth");

// Only admins and officers can view analytics
router.get("/", protect, authorize("admin", "officer"), getAnalytics);
router.get("/summary", protect, authorize("admin", "officer"), getAnalyticsSummary);
router.get("/ward-scorecards", protect, authorize("admin", "officer"), getWardScorecards);

module.exports = router;

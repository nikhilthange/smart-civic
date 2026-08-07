const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Only admins and officers can view analytics
router.get("/", protect, authorize("admin", "officer"), getAnalytics);

module.exports = router;

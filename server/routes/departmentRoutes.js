const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getNearbyDepartments } = require("../controllers/departmentController");

// GET /api/departments/nearby
router.get("/nearby", protect, getNearbyDepartments);

module.exports = router;

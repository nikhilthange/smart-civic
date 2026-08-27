const express = require("express");
const router = express.Router();
const { cacheMiddleware } = require("../middlewares/cacheMiddleware");
const { getDailySitrep } = require("../controllers/sitrepController");

// GET /api/sitrep/daily (20-second TTL cache)
router.get("/daily", cacheMiddleware(20), getDailySitrep);

module.exports = router;

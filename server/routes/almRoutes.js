const express = require("express");
const router = express.Router();
const { getSocieties, scheduleVisit } = require("../controllers/almController");

// GET /api/alm
router.get("/", getSocieties);

// POST /api/alm/:id/schedule
router.post("/:id/schedule", scheduleVisit);

module.exports = router;

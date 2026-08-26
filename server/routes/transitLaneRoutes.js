"use strict";

const express = require("express");
const router = express.Router();
const {
  getTransitObstructions,
  ingestDashcamViolation,
} = require("../controllers/transitLaneController");

router.get("/obstructions", getTransitObstructions);
router.post("/dashcam-event", ingestDashcamViolation);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const {
  getTransitObstructions,
  createTransitObstruction,
  ingestDashcamViolation,
} = require("../controllers/transitLaneController");

router.get("/obstructions", getTransitObstructions);
router.post("/obstructions", createTransitObstruction);
router.post("/dashcam-event", ingestDashcamViolation);

module.exports = router;

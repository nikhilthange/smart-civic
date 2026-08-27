"use strict";

const express = require("express");
const router = express.Router();
const {
  getAnimalHotspots,
  createAnimalRecord,
  logBiteIncident,
  dispatchVeterinaryDrive,
} = require("../controllers/animalWelfareController");

router.get("/hotspots", getAnimalHotspots);
router.post("/hotspots", createAnimalRecord);
router.post("/log-bite", logBiteIncident);
router.post("/vaccination-drive", dispatchVeterinaryDrive);

module.exports = router;

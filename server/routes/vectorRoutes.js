"use strict";

const express = require("express");
const router = express.Router();
const {
  getVectorHotspots,
  createVectorHotspot,
  getPsdFoggingRoute,
} = require("../controllers/vectorController");

router.get("/hotspots", getVectorHotspots);
router.post("/hotspots", createVectorHotspot);
router.get("/fogging-route/:ward", getPsdFoggingRoute);

module.exports = router;

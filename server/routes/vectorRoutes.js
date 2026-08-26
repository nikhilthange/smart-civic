"use strict";

const express = require("express");
const router = express.Router();
const {
  getVectorHotspots,
  getPsdFoggingRoute,
} = require("../controllers/vectorController");

router.get("/hotspots", getVectorHotspots);
router.get("/fogging-route/:ward", getPsdFoggingRoute);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const {
  getTurfVenues,
  reportTurfViolation,
} = require("../controllers/turfController");

router.get("/venues", getTurfVenues);
router.post("/report-violation", reportTurfViolation);

module.exports = router;

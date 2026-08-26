"use strict";

const express = require("express");
const router = express.Router();
const {
  getTrenchingPermits,
  requestTrenchingPermit,
  getCorridorConflicts,
} = require("../controllers/trenchingController");

router.get("/permits", getTrenchingPermits);
router.post("/request", requestTrenchingPermit);
router.get("/conflicts", getCorridorConflicts);

module.exports = router;

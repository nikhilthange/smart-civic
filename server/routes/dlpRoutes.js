"use strict";

const express = require("express");
const router = express.Router();
const {
  getRoadContracts,
  createRoadContract,
  calculatePotholeVolume,
  checkWarrantyLiability,
  freezeRetentionDeposit,
} = require("../controllers/potholeDlpController");

router.get("/contracts", getRoadContracts);
router.post("/contracts", createRoadContract);
router.post("/estimate-volume", calculatePotholeVolume);
router.post("/check-warranty", checkWarrantyLiability);
router.post("/freeze-retention/:contractId", freezeRetentionDeposit);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const {
  getFloodRadar,
  verifyDesilting,
  getNullahRecords,
} = require("../controllers/monsoonController");
const { protect } = require("../middlewares/auth");

router.get("/flood-radar", getFloodRadar);
router.get("/nullahs", getNullahRecords);
router.post("/verify-desilting", verifyDesilting);

module.exports = router;

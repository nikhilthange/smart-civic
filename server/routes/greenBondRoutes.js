"use strict";

const express = require("express");
const router = express.Router();
const {
  getGreenBondPortfolio,
  getPredictiveBudget,
} = require("../controllers/greenBondController");

router.get("/portfolio", getGreenBondPortfolio);
router.post("/predictive-budget", getPredictiveBudget);

module.exports = router;

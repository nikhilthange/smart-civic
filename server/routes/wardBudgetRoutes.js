"use strict";

const express = require("express");
const router = express.Router();
const {
  getWardProjects,
  castProjectVote,
  getCorporatorFundLedger,
} = require("../controllers/wardBudgetController");

router.get("/projects", getWardProjects);
router.post("/vote/:id", castProjectVote);
router.get("/corporator-ledger/:ward", getCorporatorFundLedger);

module.exports = router;

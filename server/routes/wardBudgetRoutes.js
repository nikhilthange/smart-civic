"use strict";

const express = require("express");
const router = express.Router();
const {
  getWardProjects,
  createWardProject,
  castProjectVote,
  getCorporatorFundLedger,
  getWardExpenditures,
} = require("../controllers/wardBudgetController");

router.get("/projects", getWardProjects);
router.post("/projects", createWardProject);
router.post("/vote/:id", castProjectVote);
router.get("/corporator-ledger/:ward", getCorporatorFundLedger);
router.get("/expenditures/:ward", getWardExpenditures);

module.exports = router;

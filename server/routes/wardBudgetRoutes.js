"use strict";

const express = require("express");
const router = express.Router();
const {
  getWardProjects,
  createWardProject,
  castProjectVote,
  getCorporatorFundLedger,
} = require("../controllers/wardBudgetController");

router.get("/projects", getWardProjects);
router.post("/projects", createWardProject);
router.post("/vote/:id", castProjectVote);
router.get("/corporator-ledger/:ward", getCorporatorFundLedger);

module.exports = router;

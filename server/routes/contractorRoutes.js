const express = require("express");
const router = express.Router();
const {
  getContractors,
  issueStrike,
  getMicroEscrows,
  getDividendPoolSummary,
  allocateMicroEscrow,
  releaseMicroEscrow,
  slashMicroEscrow,
} = require("../controllers/contractorController");

// Scorecard & strike routes
router.get("/", getContractors);
router.post("/:id/strike", issueStrike);

// Micro-escrow & citizen dividend pool routes
router.get("/micro-escrows", getMicroEscrows);
router.get("/dividend-pool", getDividendPoolSummary);
router.post("/micro-escrow/allocate", allocateMicroEscrow);
router.post("/micro-escrow/:escrowId/release", releaseMicroEscrow);
router.post("/micro-escrow/:escrowId/slash", slashMicroEscrow);

module.exports = router;


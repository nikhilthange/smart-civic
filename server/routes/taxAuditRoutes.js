"use strict";

const express = require("express");
const router = express.Router();
const {
  getTaxDiscrepancies,
  createTaxProperty,
  reconcilePropertyTax,
} = require("../controllers/taxAuditController");

router.get("/discrepancies", getTaxDiscrepancies);
router.post("/discrepancies", createTaxProperty);
router.post("/reconcile", reconcilePropertyTax);

module.exports = router;

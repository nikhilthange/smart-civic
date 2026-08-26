"use strict";

const express = require("express");
const router = express.Router();
const {
  getTaxDiscrepancies,
  reconcilePropertyTax,
} = require("../controllers/taxAuditController");

router.get("/discrepancies", getTaxDiscrepancies);
router.post("/reconcile", reconcilePropertyTax);

module.exports = router;

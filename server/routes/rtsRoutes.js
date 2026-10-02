"use strict";

const express = require("express");
const router = express.Router();
const {
  getAllPenalties,
  getRtsSummary,
  runComplianceAudit,
  adjudicatePenalty,
  compensateCitizen,
} = require("../controllers/rtsController");

router.get("/penalties", getAllPenalties);
router.get("/summary", getRtsSummary);
router.post("/audit", runComplianceAudit);
router.post("/adjudicate/:noticeNumber", adjudicatePenalty);
router.post("/compensate-citizen/:noticeNumber", compensateCitizen);

module.exports = router;

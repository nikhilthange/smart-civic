"use strict";

const express = require("express");
const router = express.Router();
const {
  getComplaintDossier,
  executeEmergencyRetender,
  getWardSystemicDossier,
} = require("../controllers/legalDossierController");

router.get("/complaint/:complaintId", getComplaintDossier);
router.post("/emergency-retender/:complaintId", executeEmergencyRetender);
router.get("/ward/:ward", getWardSystemicDossier);

module.exports = router;

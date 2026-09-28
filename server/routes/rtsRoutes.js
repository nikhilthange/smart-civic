"use strict";

const express = require("express");
const router = express.Router();
const { getComplaintRtsStatus, getMunicipalRtsStats } = require("../controllers/rtsController");

// GET /api/rts/stats — Municipal RTS compliance overview
router.get("/stats", getMunicipalRtsStats);

// GET /api/rts/status/:complaintId — Specific ticket RTS statutory guarantee
router.get("/status/:complaintId", getComplaintRtsStatus);

module.exports = router;

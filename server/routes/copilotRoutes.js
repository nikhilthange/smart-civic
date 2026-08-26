"use strict";

const express = require("express");
const router = express.Router();
const { generateNotice, generateSummary } = require("../controllers/copilotController");

router.post("/generate-notice", generateNotice);
router.post("/ward-summary", generateSummary);

module.exports = router;

const express = require("express");
const router = express.Router();
const { submitAppeal, confirmResolution } = require("../controllers/appealController");

// POST /api/appeals/:id/appeal
router.post("/:id/appeal", submitAppeal);

// POST /api/appeals/:id/confirm-resolution
router.post("/:id/confirm-resolution", confirmResolution);

module.exports = router;

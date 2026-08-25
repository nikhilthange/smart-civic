const express = require("express");
const router = express.Router();
const { handleBotReport } = require("../controllers/webhookController");

// Public Bot & Webhook Ingestion API
router.post("/bot-report", handleBotReport);

module.exports = router;

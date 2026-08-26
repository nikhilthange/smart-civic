"use strict";

const express = require("express");
const router = express.Router();
const { handleBotReport } = require("../controllers/webhookController");
const {
  verifyWebhook,
  verifyWebhookSignature,
  handleIncomingMessage,
} = require("../controllers/whatsappWebhookController");

// Public Bot & Webhook Ingestion API
router.post("/bot-report", handleBotReport);
router.get("/whatsapp", verifyWebhook);
router.post("/whatsapp", verifyWebhookSignature, handleIncomingMessage);

module.exports = router;

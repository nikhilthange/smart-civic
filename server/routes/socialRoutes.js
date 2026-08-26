const express = require("express");
const router = express.Router();
const {
  getSocialFeed,
  ingestSocialWebhook,
  convertToTicket,
} = require("../controllers/socialIngestionController");

// GET /api/social/feed
router.get("/feed", getSocialFeed);

// POST /api/social/ingest-webhook
router.post("/ingest-webhook", ingestSocialWebhook);

// POST /api/social/convert-ticket
router.post("/convert-ticket", convertToTicket);

module.exports = router;

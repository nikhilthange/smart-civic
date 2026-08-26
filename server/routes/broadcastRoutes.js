const express = require("express");
const router = express.Router();
const { getBroadcasts, sendBroadcast } = require("../controllers/broadcastController");

// GET /api/broadcast
router.get("/", getBroadcasts);

// POST /api/broadcast/send
router.post("/send", sendBroadcast);

module.exports = router;

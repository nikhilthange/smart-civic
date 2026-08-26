const express = require("express");
const router = express.Router();
const { getLiveWorkerTracking } = require("../controllers/workerController");

// GET /api/worker/track/:ticketId
router.get("/track/:ticketId", getLiveWorkerTracking);

module.exports = router;

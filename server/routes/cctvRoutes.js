"use strict";

const express = require("express");
const router = express.Router();
const { getCctvCameras, analyzeCctvFrame } = require("../controllers/cctvController");
const { cacheMiddleware } = require("../middlewares/cacheMiddleware");

router.get("/cameras", cacheMiddleware(15), getCctvCameras);
router.post("/analyze-frame", analyzeCctvFrame);

module.exports = router;

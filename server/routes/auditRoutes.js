"use strict";

const express = require("express");
const router = express.Router();
const { getAuditLogs, createAuditLog } = require("../controllers/auditController");

router.get("/logs", getAuditLogs);
router.post("/log", createAuditLog);

module.exports = router;

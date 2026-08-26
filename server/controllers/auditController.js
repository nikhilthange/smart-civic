"use strict";

const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/AuditLog");
const {
  DEFAULT_AUDIT_LOGS,
  recordAuditAction,
  verifyAuditChainIntegrity,
} = require("../services/auditService");

/**
 * @route   GET /api/audit/logs
 * @desc    Get immutable municipal audit trail ledger with hash verification
 * @access  Protected (Admin / Officer)
 */
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { ward, actionType } = req.query;
  const filter = {};
  if (ward && ward !== "all") filter.ward = ward;
  if (actionType && actionType !== "all") filter.actionType = actionType;

  let logs = await AuditLog.find(filter).sort({ createdAt: -1 });

  if (logs.length === 0) {
    logs = DEFAULT_AUDIT_LOGS.filter((l) => {
      if (ward && ward !== "all" && l.ward !== ward) return false;
      if (actionType && actionType !== "all" && l.actionType !== actionType) return false;
      return true;
    });
  }

  const integrity = verifyAuditChainIntegrity(logs);

  res.status(200).json({
    success: true,
    count: logs.length,
    integrity,
    logs,
  });
});

/**
 * @route   POST /api/audit/log
 * @desc    Manually record an executive municipal action to the audit ledger
 * @access  Protected (Admin / Officer)
 */
exports.createAuditLog = asyncHandler(async (req, res) => {
  const {
    actionType = "ESCROW_PENALTY_DEDUCTION",
    actorId = "OFFICER_EXEC_01",
    actorRole = "OFFICER",
    ward = "Ward G-North",
    targetEntityId = "MANUAL-CIT-01",
    targetEntityType = "ExecutiveCitation",
    payloadSummary = "Executive action registered by Ward Officer.",
    amountInr = 0,
  } = req.body;

  const entry = await recordAuditAction({
    actionType,
    actorId,
    actorRole,
    ward,
    targetEntityId,
    targetEntityType,
    payloadSummary,
    amountInr,
  });

  res.status(201).json({
    success: true,
    entry,
  });
});

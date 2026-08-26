"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

let latestKnownHash = "0000000000000000000000000000000000000000000000000000000000000000";

const DEFAULT_AUDIT_LOGS = [
  {
    logId: "AUD-2026-0001",
    actionType: "ESCROW_PENALTY_DEDUCTION",
    actorId: "SYSTEM_AUTONOMOUS_DAEMON",
    actorRole: "SYSTEM",
    ward: "Ward G-North",
    targetEntityId: "CON-ROAD-9912",
    targetEntityType: "ContractorEscrow",
    payloadSummary: "Tier 1 SLA Breach: ₹5,000 deducted for pothole repair delay past 24h limit.",
    amountInr: 5000,
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    currentHash: "a9f4c3b281d764e52109823485abcf0192348123049182309123840192384019",
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    logId: "AUD-2026-0002",
    actionType: "STOP_WORK_INJUNCTION_ISSUED",
    actorId: "OFFICER_HW_01",
    actorRole: "OFFICER",
    ward: "Ward H-West",
    targetEntityId: "CRZ-KW-01",
    targetEntityType: "MangroveZone",
    payloadSummary: "Mangrove CRZ-I canopy loss of 34.6% detected. Cease-and-desist injunction served.",
    amountInr: 0,
    previousHash: "a9f4c3b281d764e52109823485abcf0192348123049182309123840192384019",
    currentHash: "b8e5d2c170c653d410987123749abe0081237012938471209384712093847120",
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    logId: "AUD-2026-0003",
    actionType: "TRANSIT_CAMP_ALLOCATION",
    actorId: "SYSTEM_AUTONOMOUS_DAEMON",
    actorRole: "SYSTEM",
    ward: "Ward G-North",
    targetEntityId: "BLD-GN-01",
    targetEntityType: "DilapidatedBuilding",
    payloadSummary: "C1 Tiltmeter reached 2.9°. Mandatory evacuation with 32 transit passes issued.",
    amountInr: 0,
    previousHash: "b8e5d2c170c653d410987123749abe0081237012938471209384712093847120",
    currentHash: "c7d4e1b069b542c309876012638acd9970126901827360198273601982736019",
    createdAt: new Date(Date.now() - 600000),
  },
];

/**
 * Computes deterministic SHA-256 hash for audit chaining
 */
function computeAuditHash(entry, prevHash) {
  const data = `${entry.logId}|${entry.actionType}|${entry.ward}|${entry.targetEntityId}|${entry.amountInr}|${entry.payloadSummary}|${prevHash}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Appends a tamper-evident audit record to the ledger
 */
async function recordAuditAction({
  actionType,
  actorId = "SYSTEM_AUTONOMOUS_DAEMON",
  actorRole = "SYSTEM",
  ward = "Ward G-North",
  targetEntityId,
  targetEntityType,
  payloadSummary,
  amountInr = 0,
}) {
  const logId = `AUD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const previousHash = latestKnownHash;

  const currentHash = computeAuditHash(
    {
      logId,
      actionType,
      ward,
      targetEntityId,
      amountInr,
      payloadSummary,
    },
    previousHash
  );

  latestKnownHash = currentHash;

  const entry = {
    logId,
    actionType,
    actorId,
    actorRole,
    ward,
    targetEntityId,
    targetEntityType,
    payloadSummary,
    amountInr: Number(amountInr),
    previousHash,
    currentHash,
    createdAt: new Date(),
  };

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await AuditLog.create(entry);
    } catch {
      // continue
    }
  }

  return entry;
}

/**
 * Verifies blockchain-like cryptographic hash continuity across audit logs
 */
function verifyAuditChainIntegrity(logs = []) {
  if (!logs || logs.length === 0) return { isValid: true, verifiedCount: 0 };

  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1];
    const curr = logs[i];
    if (curr.previousHash !== prev.currentHash) {
      return {
        isValid: false,
        brokenAtLogId: curr.logId,
        expectedPreviousHash: prev.currentHash,
        actualPreviousHash: curr.previousHash,
      };
    }
  }

  return { isValid: true, verifiedCount: logs.length };
}

module.exports = {
  DEFAULT_AUDIT_LOGS,
  computeAuditHash,
  recordAuditAction,
  verifyAuditChainIntegrity,
};

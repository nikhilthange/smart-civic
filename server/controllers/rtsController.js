"use strict";

const asyncHandler = require("express-async-handler");
const rtsEnforcementService = require("../services/rtsEnforcementService");

/**
 * @route   GET /api/rts/penalties
 * @desc    Get all statutory RTS penalty & show-cause records
 * @access  Public / Authenticated
 */
exports.getAllPenalties = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.ward && req.query.ward !== "all") filter.ward = req.query.ward;
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  if (req.query.officerEmployeeId) filter["designatedOfficer.employeeId"] = req.query.officerEmployeeId;

  const penalties = await rtsEnforcementService.getAllPenalties(filter);
  return res.status(200).json({
    success: true,
    count: penalties.length,
    penalties,
  });
});

/**
 * @route   GET /api/rts/summary
 * @desc    Get aggregated statutory penalty, salary deduction, and citizen compensation summary
 * @access  Public / Authenticated
 */
exports.getRtsSummary = asyncHandler(async (req, res) => {
  const summary = await rtsEnforcementService.getRtsSummary();
  return res.status(200).json({
    success: true,
    summary,
  });
});

/**
 * @route   POST /api/rts/audit
 * @desc    Run automated statutory compliance audit across open escalated complaints
 * @access  Protected (Admin / AMC)
 */
exports.runComplianceAudit = asyncHandler(async (req, res) => {
  const generatedNotices = await rtsEnforcementService.auditOpenComplaintsForRts();
  return res.status(200).json({
    success: true,
    message: `Statutory audit completed. ${generatedNotices.length} new show-cause notice(s) generated.`,
    count: generatedNotices.length,
    notices: generatedNotices,
  });
});

/**
 * @route   POST /api/rts/adjudicate/:noticeNumber
 * @desc    First Appellate Authority decision (enforce salary deduction or excuse force majeure)
 * @access  Protected (Admin / AMC)
 */
exports.adjudicatePenalty = asyncHandler(async (req, res) => {
  const { noticeNumber } = req.params;
  const { decision, note, adjudicatedBy } = req.body;

  if (!decision) {
    return res.status(400).json({ success: false, message: "Decision is required." });
  }

  const penalty = await rtsEnforcementService.adjudicatePenalty(
    noticeNumber,
    decision,
    note,
    adjudicatedBy
  );

  return res.status(200).json({
    success: true,
    message: `RTS Notice ${noticeNumber} successfully adjudicated: ${decision}`,
    penalty,
  });
});

/**
 * @route   POST /api/rts/compensate-citizen/:noticeNumber
 * @desc    Disburse citizen delay compensation dividend voucher directly to complainant
 * @access  Protected (Admin / AMC)
 */
exports.compensateCitizen = asyncHandler(async (req, res) => {
  const { noticeNumber } = req.params;
  const penalty = await rtsEnforcementService.compensateAggrievedCitizen(noticeNumber);

  return res.status(200).json({
    success: true,
    message: `Citizen compensatory dividend of ₹${penalty.citizenCompensationPaidInr} disbursed under voucher ${penalty.citizenCompensationVoucher}.`,
    penalty,
  });
});

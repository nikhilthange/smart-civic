/**
 * ─── Contractor Scorecard & Dynamic Micro-Escrow Controller ───────────────────
 */

const contractorAuditService = require("../services/contractorAuditService");
const contractorMicroEscrowService = require("../services/contractorMicroEscrowService");

const getContractors = async (req, res) => {
  try {
    const contractors = await contractorAuditService.getAllContractors();
    return res.status(200).json({ success: true, count: contractors.length, contractors });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch contractors." });
  }
};

const issueStrike = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await contractorAuditService.issueStrike(id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to issue strike." });
  }
};

const getMicroEscrows = async (req, res) => {
  try {
    const filter = {};
    if (req.query.ward && req.query.ward !== "all") filter.ward = req.query.ward;
    if (req.query.contractorId) filter.contractorId = req.query.contractorId;
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

    const escrows = await contractorMicroEscrowService.getAllMicroEscrows(filter);
    return res.status(200).json({ success: true, count: escrows.length, escrows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch micro-escrows." });
  }
};

const getDividendPoolSummary = async (req, res) => {
  try {
    const summary = await contractorMicroEscrowService.getWardDividendPoolSummary();
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch dividend pool summary." });
  }
};

const allocateMicroEscrow = async (req, res) => {
  try {
    const escrow = await contractorMicroEscrowService.allocateMicroEscrow(req.body);
    return res.status(201).json({ success: true, message: "Micro-escrow allocated.", escrow });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Allocation failed." });
  }
};

const releaseMicroEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { znccConfidenceScore } = req.body;
    const escrow = await contractorMicroEscrowService.releaseOnVerifiedProof(escrowId, znccConfidenceScore);
    return res.status(200).json({ success: true, message: "Escrow 80% released, 20% locked in DLP.", escrow });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Release failed." });
  }
};

const slashMicroEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason, upheldBy } = req.body;
    const escrow = await contractorMicroEscrowService.slashToCitizenDividendPool(escrowId, reason, upheldBy);
    return res.status(200).json({ success: true, message: "Micro-escrow slashed to Citizen Welfare Dividend Pool.", escrow });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Slashing failed." });
  }
};

module.exports = {
  getContractors,
  issueStrike,
  getMicroEscrows,
  getDividendPoolSummary,
  allocateMicroEscrow,
  releaseMicroEscrow,
  slashMicroEscrow,
};


"use strict";

const ContractorMicroEscrow = require("../models/ContractorMicroEscrow");
const ContractorScorecard = require("../models/ContractorScorecard");
const crypto = require("crypto");

class ContractorMicroEscrowService {
  constructor() {
    this.allocateMicroEscrow = this.allocateMicroEscrow.bind(this);
    this.releaseOnVerifiedProof = this.releaseOnVerifiedProof.bind(this);
    this.slashToCitizenDividendPool = this.slashToCitizenDividendPool.bind(this);
    this.getWardDividendPoolSummary = this.getWardDividendPoolSummary.bind(this);
    this.getAllMicroEscrows = this.getAllMicroEscrows.bind(this);
    this.ensureSeedData = this.ensureSeedData.bind(this);
  }

  /**
   * Allocates a per-defect micro-escrow (default: ₹5,000) from contractor collateral
   */
  async allocateMicroEscrow({
    contractorId,
    companyName,
    complaintId,
    complaintTitle = "Pothole & Surface Remediation",
    ward = "Ward H-West",
    category = "roads_and_infrastructure",
    collateralAmountInr = 5000,
  }) {
    const escrowId = `ESC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const escrow = await ContractorMicroEscrow.create({
      escrowId,
      contractorId,
      companyName,
      complaintId,
      complaintTitle,
      ward,
      category,
      collateralAmountInr,
      releasedAmountInr: 0,
      dlpRetainedAmountInr: 0,
      slashedAmountInr: 0,
      status: "ALLOCATED_HELD",
    });

    return escrow;
  }

  /**
   * Releases 80% on verified ZNCC proof, locking 20% in 12-Month DLP Retention
   */
  async releaseOnVerifiedProof(escrowId, znccConfidenceScore = 0.92) {
    const escrow = await ContractorMicroEscrow.findOne({ escrowId });
    if (!escrow) throw new Error(`Micro-escrow ${escrowId} not found.`);

    if (escrow.status === "SLASHED_TO_CITIZEN_POOL") {
      throw new Error(`Cannot release escrow: Funds already slashed to citizen dividend pool.`);
    }

    const released = Math.round(escrow.collateralAmountInr * 0.8);
    const dlpRetained = escrow.collateralAmountInr - released;

    escrow.releasedAmountInr = released;
    escrow.dlpRetainedAmountInr = dlpRetained;
    escrow.znccConfidenceScore = znccConfidenceScore;
    escrow.status = "PARTIALLY_RELEASED_DLP_LOCKED";

    const dlpDate = new Date();
    dlpDate.setFullYear(dlpDate.getFullYear() + 1);
    escrow.dlpReleaseDate = dlpDate;

    await escrow.save();

    // Reward contractor scorecard reliability
    await ContractorScorecard.findOneAndUpdate(
      { contractorId: escrow.contractorId },
      {
        $inc: { completedWorkOrdersCount: 1 },
        $set: { znccAverageConfidence: znccConfidenceScore },
      }
    );

    return escrow;
  }

  /**
   * Slashes micro-escrow into the Ward Citizen Welfare Dividend Pool
   */
  async slashToCitizenDividendPool(escrowId, reason = "Fraudulent completion proof or repeated SLA breach", upheldBy = "Ward AMC") {
    const escrow = await ContractorMicroEscrow.findOne({ escrowId });
    if (!escrow) throw new Error(`Micro-escrow ${escrowId} not found.`);

    const remainingToSlash = escrow.collateralAmountInr - escrow.releasedAmountInr;
    escrow.slashedAmountInr = remainingToSlash;
    escrow.dlpRetainedAmountInr = 0;
    escrow.status = "SLASHED_TO_CITIZEN_POOL";
    escrow.slashedReason = reason;
    escrow.slashedAt = new Date();

    await escrow.save();

    // Enforce strike on contractor scorecard
    const contractor = await ContractorScorecard.findOne({ contractorId: escrow.contractorId });
    if (contractor) {
      contractor.strikesCount = (contractor.strikesCount || 0) + 1;
      contractor.strikeLogs.push({
        strikeNumber: contractor.strikesCount,
        complaintId: escrow.complaintId,
        reason: `Micro-Escrow Slashed (₹${remainingToSlash}): ${reason}`,
        upheldBy,
        issuedAt: new Date(),
      });
      if (contractor.strikesCount >= 3) {
        contractor.status = "BLACKLISTED_FROZEN";
        contractor.frozenEscrowInr = (contractor.frozenEscrowInr || 0) + (contractor.escrowBalanceInr || 0);
        contractor.escrowBalanceInr = 0;
      }
      await contractor.save();
    }

    return escrow;
  }

  /**
   * Returns live citizen dividend pool summary across all wards
   */
  async getWardDividendPoolSummary() {
    await this.ensureSeedData();

    const summary = await ContractorMicroEscrow.aggregate([
      {
        $group: {
          _id: "$ward",
          totalSlashedInr: { $sum: "$slashedAmountInr" },
          totalDlpRetainedInr: { $sum: "$dlpRetainedAmountInr" },
          totalActiveHeldInr: {
            $sum: {
              $cond: [{ $eq: ["$status", "ALLOCATED_HELD"] }, "$collateralAmountInr", 0],
            },
          },
          totalDefectsTracked: { $sum: 1 },
          slashedDefectsCount: {
            $sum: { $cond: [{ $eq: ["$status", "SLASHED_TO_CITIZEN_POOL"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalSlashedInr: -1 } },
    ]);

    const globalTotals = await ContractorMicroEscrow.aggregate([
      {
        $group: {
          _id: null,
          totalSlashedInr: { $sum: "$slashedAmountInr" },
          totalDlpRetainedInr: { $sum: "$dlpRetainedAmountInr" },
          totalActiveHeldInr: {
            $sum: {
              $cond: [{ $eq: ["$status", "ALLOCATED_HELD"] }, "$collateralAmountInr", 0],
            },
          },
          totalDefects: { $sum: 1 },
        },
      },
    ]);

    return {
      global: globalTotals[0] || {
        totalSlashedInr: 0,
        totalDlpRetainedInr: 0,
        totalActiveHeldInr: 0,
        totalDefects: 0,
      },
      wardBreakdown: summary,
    };
  }

  /**
   * Fetches all micro-escrow records with optional filtering
   */
  async getAllMicroEscrows(filter = {}) {
    await this.ensureSeedData();
    return ContractorMicroEscrow.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Seeds realistic initial micro-escrows if database is fresh
   */
  async ensureSeedData() {
    const count = await ContractorMicroEscrow.countDocuments();
    if (count > 0) return;

    const seedEntries = [
      {
        escrowId: "ESC-2026-HW-001",
        contractorId: "CON-HW-01",
        companyName: "Bandra Asphalt & Infra Corp",
        complaintId: "SC-2026-9812",
        complaintTitle: "Linking Road Pothole Crater (Near KFC)",
        ward: "Ward H-West",
        category: "roads_and_infrastructure",
        collateralAmountInr: 5000,
        releasedAmountInr: 4000,
        dlpRetainedAmountInr: 1000,
        slashedAmountInr: 0,
        status: "PARTIALLY_RELEASED_DLP_LOCKED",
        znccConfidenceScore: 0.94,
        dlpReleaseDate: new Date(Date.now() + 300 * 24 * 3600 * 1000),
      },
      {
        escrowId: "ESC-2026-HW-002",
        contractorId: "CON-HW-01",
        companyName: "Bandra Asphalt & Infra Corp",
        complaintId: "SC-2026-9844",
        complaintTitle: "Turner Road Trench Subsidence",
        ward: "Ward H-West",
        category: "roads_and_infrastructure",
        collateralAmountInr: 5000,
        releasedAmountInr: 0,
        dlpRetainedAmountInr: 0,
        slashedAmountInr: 5000,
        status: "SLASHED_TO_CITIZEN_POOL",
        slashedReason: "Uploaded fraudulent duplicate photo from different ward",
        slashedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        escrowId: "ESC-2026-GS-003",
        contractorId: "CON-GS-02",
        companyName: "Worli Marine Coastal Paving Ltd",
        complaintId: "SC-2026-7731",
        complaintTitle: "Khan Abdul Ghaffar Khan Marg Storm Drain Cap",
        ward: "Ward G-South",
        category: "storm_water_drains",
        collateralAmountInr: 7500,
        releasedAmountInr: 6000,
        dlpRetainedAmountInr: 1500,
        slashedAmountInr: 0,
        status: "PARTIALLY_RELEASED_DLP_LOCKED",
        znccConfidenceScore: 0.89,
        dlpReleaseDate: new Date(Date.now() + 280 * 24 * 3600 * 1000),
      },
      {
        escrowId: "ESC-2026-GN-004",
        contractorId: "CON-GN-03",
        companyName: "Shivaji Park Civic Works LLP",
        complaintId: "SC-2026-6419",
        complaintTitle: "Cadell Road Paver Block Depression",
        ward: "Ward G-North",
        category: "roads_and_infrastructure",
        collateralAmountInr: 5000,
        releasedAmountInr: 0,
        dlpRetainedAmountInr: 0,
        slashedAmountInr: 0,
        status: "ALLOCATED_HELD",
      },
      {
        escrowId: "ESC-2026-KE-005",
        contractorId: "CON-KE-04",
        companyName: "Midtown Utilities & Highway Pavers",
        complaintId: "SC-2026-5520",
        complaintTitle: "Andheri-Kurla Road Water Pipe Trench",
        ward: "Ward K-East",
        category: "water_and_sanitation",
        collateralAmountInr: 6000,
        releasedAmountInr: 0,
        dlpRetainedAmountInr: 0,
        slashedAmountInr: 6000,
        status: "SLASHED_TO_CITIZEN_POOL",
        slashedReason: "48-Hour SLA breached after repeated Tier-2 Executive Engineer warnings",
        slashedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      },
    ];

    for (const item of seedEntries) {
      await ContractorMicroEscrow.create(item);
    }
  }
}

module.exports = new ContractorMicroEscrowService();

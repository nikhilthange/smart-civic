"use strict";

const asyncHandler = require("express-async-handler");
const WardProject = require("../models/WardProject");
const User = require("../models/User");
const RoadContract = require("../models/RoadContract");
const ContractorMicroEscrow = require("../models/ContractorMicroEscrow");
const crypto = require("crypto");

// Default BMC Ward Participatory Projects Fallback
const DEFAULT_WARD_PROJECTS = [
  {
    projectId: "WP-GN-01",
    title: "Solar Streetlight Grid for Shivaji Park Perimeter",
    description: "Install 48 high-efficiency standalone solar LED masts along the walking track and arterial avenues.",
    ward: "Ward G-North",
    category: "SOLAR_STREETLIGHTS",
    estimatedBudgetInr: 3200000,
    fundsDisbursedInr: 3200000,
    allocatedFiscalYear: "2026-2027",
    votesCount: 428,
    status: "IN_EXECUTION",
    corporatorName: "Adv. Rahul Sawant (Ward 184)",
    estimatedBeneficiaryCitizens: 45000,
  },
  {
    projectId: "WP-GN-02",
    title: "Dadar Flower Market Women Sanitation & Nursing Lounge",
    description: "Automated, sanitized public convenience complex with solar water heating and sanitary vending.",
    ward: "Ward G-North",
    category: "WOMEN_PUBLIC_SANITATION",
    estimatedBudgetInr: 2800000,
    fundsDisbursedInr: 0,
    allocatedFiscalYear: "2026-2027",
    votesCount: 389,
    status: "CITIZEN_APPROVED",
    corporatorName: "Adv. Rahul Sawant (Ward 184)",
    estimatedBeneficiaryCitizens: 30000,
  },
  {
    projectId: "WP-HW-03",
    title: "Hill Road - Turner Road Permeable Paver Footpath Network",
    description: "Anti-skid tactile pedestrian walkways with integrated subsurface stormwater percolation pits.",
    ward: "Ward H-West",
    category: "PEDESTRIAN_FOOTPATH_UPGRADE",
    estimatedBudgetInr: 4500000,
    fundsDisbursedInr: 1200000,
    allocatedFiscalYear: "2026-2027",
    votesCount: 512,
    status: "IN_EXECUTION",
    corporatorName: "Smt. Priya Merchant (Ward 98)",
    estimatedBeneficiaryCitizens: 60000,
  },
  {
    projectId: "WP-KW-04",
    title: "Versova Beachfront Community Mangrove Nursery & Park",
    description: "Eco-restoration of coastal buffer with native mangrove afforestation and citizen walking trail.",
    ward: "Ward K-West",
    category: "PUBLIC_PARK_RESTORATION",
    estimatedBudgetInr: 3800000,
    fundsDisbursedInr: 0,
    allocatedFiscalYear: "2026-2027",
    votesCount: 294,
    status: "PROPOSED",
    corporatorName: "Shri. Deepak Hegde (Ward 62)",
    estimatedBeneficiaryCitizens: 35000,
  },
];

/**
 * @route   GET /api/ward-budget/projects
 * @desc    Get proposed and approved participatory budgeting projects for a ward
 * @access  Public / Authenticated
 */
exports.getWardProjects = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let count = await WardProject.countDocuments();
  if (count === 0) {
    for (const p of DEFAULT_WARD_PROJECTS) {
      await WardProject.create(p);
    }
  }

  let projects = await WardProject.find(filter).sort({ votesCount: -1 }).lean();

  res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
});

/**
 * @route   POST /api/ward-budget/vote/:id
 * @desc    Cast citizen weighted Quadratic Vote for local ward project
 *          Formula: Karma Points Required = (Vote Weight)^2
 * @access  Public / Authenticated
 */
exports.castProjectVote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rawWeight = parseInt(req.body.voteWeight || 1, 10);
  const voteWeight = Math.max(1, Math.min(5, isNaN(rawWeight) ? 1 : rawWeight));
  const karmaRequired = voteWeight * voteWeight;
  const quarter = "Q2-2026";

  let user = null;
  if (req.user && req.user._id) {
    user = await User.findById(req.user._id);
  } else if (req.body.userId) {
    user = await User.findOne({
      $or: [
        { _id: req.body.userId.match(/^[0-9a-fA-F]{24}$/) ? req.body.userId : null },
        { email: req.body.userId },
      ],
    });
  }

  // If user is registered in MongoDB, enforce Quadratic Karma point deduction
  if (user) {
    if ((user.karmaPoints || 0) < karmaRequired) {
      return res.status(400).json({
        success: false,
        message: `⚠️ Quadratic Voting requires ${karmaRequired} Karma point(s) for ${voteWeight} vote(s), but your current balance is ${user.karmaPoints || 0} Karma. Earn points by submitting verified civic reports!`,
        requiredKarma: karmaRequired,
        currentKarma: user.karmaPoints || 0,
      });
    }
  }

  const userId = user ? user._id.toString() : (req.body.userId || "usr_citizen_demo_99");

  let project = await WardProject.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectId: id }],
  });

  if (!project) {
    return res.status(404).json({ success: false, message: "Ward project not found." });
  }

  // Check if citizen already voted in this fiscal quarter
  const alreadyVoted = project.votersList.some(
    (v) => v.userId === userId && v.quarter === quarter
  );

  if (alreadyVoted) {
    return res.status(400).json({
      success: false,
      message: `⚠️ You have already cast your participatory ballot for this project in ${quarter}.`,
      votesCount: project.votesCount,
    });
  }

  // Deduct real Karma points from User in MongoDB
  if (user) {
    user.karmaPoints -= karmaRequired;
    await user.save();
  }

  project.votesCount += voteWeight;
  project.votersList.push({
    userId,
    voteWeight,
    karmaSpent: karmaRequired,
    quarter,
    votedAt: new Date(),
  });

  if (project.votesCount >= 500 && project.status === "PROPOSED") {
    project.status = "CITIZEN_APPROVED";
  }

  await project.save();

  return res.status(200).json({
    success: true,
    message: `🗳️ ${voteWeight} weighted vote(s) recorded using ${karmaRequired} Karma points! Total Citizen Votes: ${project.votesCount}`,
    votesCount: project.votesCount,
    status: project.status,
    karmaDeducted: karmaRequired,
    remainingKarma: user ? user.karmaPoints : 0,
    project,
  });
});


/**
 * @route   GET /api/ward-budget/corporator-ledger/:ward
 * @desc    Get transparent corporator discretionary development fund ledger
 * @access  Public / Authenticated
 */
exports.getCorporatorFundLedger = asyncHandler(async (req, res) => {
  const { ward = "Ward G-North" } = req.params;

  // Standard BMC Corporator Annual Discretionary Allocation: ₹2.50 Crores per Ward Councilor
  const totalAnnualAllocationInr = 25000000;
  const dbProjects = await WardProject.find({ ward });
  const projects = dbProjects.length > 0 ? dbProjects : DEFAULT_WARD_PROJECTS.filter((p) => p.ward === ward);

  const totalCommittedInr = projects.reduce((acc, p) => acc + p.estimatedBudgetInr, 0);
  const totalDisbursedInr = projects.reduce((acc, p) => acc + (p.fundsDisbursedInr || 0), 0);
  const remainingDiscretionaryBalanceInr = Math.max(0, totalAnnualAllocationInr - totalCommittedInr);

  res.status(200).json({
    success: true,
    ward,
    fiscalYear: "2026-2027",
    annualAllocationInr: totalAnnualAllocationInr,
    committedProjectsBudgetInr: totalCommittedInr,
    disbursedExpenditureInr: totalDisbursedInr,
    unallocatedBalanceInr: remainingDiscretionaryBalanceInr,
    utilizationPercentage: parseFloat(((totalCommittedInr / totalAnnualAllocationInr) * 100).toFixed(1)),
    corporatorName: projects[0]?.corporatorName || "Hon. Ward Councilor (BMC)",
    auditedProjects: projects,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/ward-budget/projects
 * @desc    Create a new participatory budgeting project directly in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createWardProject = asyncHandler(async (req, res) => {
  const {
    projectId = `PRJ-${Date.now().toString().slice(-5)}`,
    title,
    ward,
    category = "URBAN_GREENING",
    estimatedBudgetInr = 1200000,
    description = "Community development infrastructure initiative",
    corporatorName = "Hon. Ward Councilor (BMC)",
    estimatedBeneficiaryCitizens = 15000,
  } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ success: false, message: "Valid project title is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  const budget = Number(estimatedBudgetInr);
  if (isNaN(budget) || budget < 0) {
    return res.status(400).json({ success: false, message: "estimatedBudgetInr must be a non-negative number" });
  }

  try {
    const project = await WardProject.create({
      projectId: String(projectId).trim(),
      title: title.trim(),
      ward: ward.trim(),
      category,
      estimatedBudgetInr: budget,
      description: description ? String(description).trim() : "Ward community improvement project",
      corporatorName: corporatorName ? String(corporatorName).trim() : "Hon. Ward Councilor (BMC)",
      estimatedBeneficiaryCitizens: Math.max(100, Number(estimatedBeneficiaryCitizens) || 1000),
      status: "PROPOSED",
      votesCount: 1,
    });

    invalidateCache(["ward-budget:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Participatory budgeting project "${project.title}" created successfully`,
      project,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create project" });
  }
});

/**
 * @route   GET /api/ward-budget/expenditures/:ward
 * @desc    Get real audited work orders and expenditures from MongoDB (RoadContracts + Defect Micro-Escrows)
 * @access  Public / Authenticated
 */
exports.getWardExpenditures = asyncHandler(async (req, res) => {
  const { ward } = req.params;
  const filter = ward && ward !== "all" ? { ward } : {};

  // Fetch real RoadContracts from MongoDB
  const contracts = await RoadContract.find(filter).sort({ completionDate: -1 }).lean();
  // Fetch real micro-escrows from MongoDB
  const escrows = await ContractorMicroEscrow.find(filter).sort({ createdAt: -1 }).lean();

  const transactions = [];

  for (const c of contracts) {
    const hash = crypto
      .createHash("sha256")
      .update(`${c.contractId}-${c.totalProjectCostInr || 25000000}-${c.completionDate}`)
      .digest("hex")
      .slice(0, 16);

    const cost = c.totalProjectCostInr || 25000000;
    const retention = c.retentionFundAmountInr || Math.round(cost * 0.1);

    transactions.push({
      workOrderId: c.contractId,
      title: `${c.roadName} Surface Renewal (${c.surfaceType || "MASTIC_ASPHALT"})`,
      contractorName: c.contractorName,
      vendorGstin: `27AAAC${(c.contractorId || "CON001").replace(/[^A-Z0-9]/gi, "").padStart(6, "0").slice(0, 6)}1ZX`,
      disbursedAmountInr: cost - retention,
      committedAmountInr: cost,
      completionPercentage: c.status === "ACTIVE_WARRANTY" ? 100 : 85,
      status: c.retentionFundFrozen ? "BILL_UNDER_AUDIT" : c.status === "ACTIVE_WARRANTY" ? "COMPLETED" : "IN_PROGRESS",
      sanctionDate: c.completionDate ? new Date(c.completionDate).toISOString().split("T")[0] : "2026-03-15",
      blockHash: hash,
    });
  }

  for (const e of escrows) {
    const hash = crypto
      .createHash("sha256")
      .update(`${e.escrowId}-${e.collateralAmountInr}-${e.createdAt}`)
      .digest("hex")
      .slice(0, 16);

    transactions.push({
      workOrderId: e.escrowId,
      title: `${e.complaintTitle} (Micro-Escrow Protection)`,
      contractorName: e.companyName,
      vendorGstin: `27AABC${(e.contractorId || "CON002").replace(/[^A-Z0-9]/gi, "").padStart(6, "0").slice(0, 6)}1ZM`,
      disbursedAmountInr: e.releasedAmountInr || 0,
      committedAmountInr: e.collateralAmountInr,
      completionPercentage:
        e.status === "FULL_RELEASED"
          ? 100
          : e.status === "PARTIALLY_RELEASED_DLP_LOCKED"
          ? 80
          : e.status === "SLASHED_TO_CITIZEN_POOL"
          ? 0
          : 40,
      status:
        e.status === "SLASHED_TO_CITIZEN_POOL"
          ? "BILL_UNDER_AUDIT"
          : e.status === "FULL_RELEASED"
          ? "COMPLETED"
          : "IN_PROGRESS",
      sanctionDate: e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "2026-04-01",
      blockHash: hash,
    });
  }

  return res.status(200).json({
    success: true,
    count: transactions.length,
    ward: ward || "all",
    transactions,
  });
});


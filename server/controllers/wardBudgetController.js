"use strict";

const asyncHandler = require("express-async-handler");
const WardProject = require("../models/WardProject");

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
  let projects = await WardProject.find(filter).sort({ votesCount: -1 });

  if (projects.length === 0 && (!ward || ward === "all" || ward === "Ward G-North" || ward === "Ward H-West")) {
    projects = DEFAULT_WARD_PROJECTS.filter((p) => !ward || ward === "all" || p.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
});

/**
 * @route   POST /api/ward-budget/vote/:id
 * @desc    Cast citizen weighted vote for local ward project (1 vote per fiscal quarter)
 * @access  Protected (Authenticated Citizen)
 */
exports.castProjectVote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user._id.toString() : (req.body.userId || "usr_citizen_demo_99");
  const quarter = "Q2-2026";

  let project = await WardProject.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectId: id }] });

  if (!project) {
    // Seed default if voting on demo mock
    const mock = DEFAULT_WARD_PROJECTS.find((p) => p.projectId === id);
    if (mock) {
      project = new WardProject({
        ...mock,
        votesCount: mock.votesCount + 1,
        votersList: [{ userId, quarter }],
      });
      await project.save();

      return res.status(200).json({
        success: true,
        message: `🗳️ Vote registered for "${project.title}". Total Votes: ${project.votesCount}`,
        votesCount: project.votesCount,
        project,
      });
    }

    res.status(404);
    throw new Error("Ward project not found");
  }

  // Check if citizen already voted in this fiscal quarter
  const alreadyVoted = project.votersList.some(
    (v) => v.userId === userId && v.quarter === quarter
  );

  if (alreadyVoted) {
    return res.status(400).json({
      success: false,
      message: `⚠️ You have already cast your participatory vote for this project in ${quarter}.`,
      votesCount: project.votesCount,
    });
  }

  project.votesCount += 1;
  project.votersList.push({ userId, quarter });

  if (project.votesCount >= 300 && project.status === "PROPOSED") {
    project.status = "CITIZEN_APPROVED";
  }

  await project.save();

  res.status(200).json({
    success: true,
    message: `🗳️ Your vote has been recorded! Total Citizen Votes: ${project.votesCount}`,
    votesCount: project.votesCount,
    status: project.status,
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

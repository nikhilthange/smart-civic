const Complaint = require("../models/Complaint");

/**
 * ─── @desc    Get BMC Executive Ward Audit Report
 * ─── @route   GET /api/reports/ward-summary
 * ─── @access  Private (admin, officer)
 */
const getWardSummaryReport = async (req, res) => {
  try {
    const wardAgg = await Complaint.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$ward", "Ward A"] },
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          breached: {
            $sum: {
              $cond: [{ $eq: ["$slaStatus", "breached"] }, 1, 0],
            },
          },
          totalPenalties: { $sum: { $ifNull: ["$contractorPenalty", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let grandTotal = 0;
    let grandResolved = 0;
    let grandBreached = 0;
    let grandPenalties = 0;

    const wardBreakdown = wardAgg.map((w) => {
      grandTotal += w.total;
      grandResolved += w.resolved;
      grandBreached += w.breached;
      grandPenalties += w.totalPenalties;

      const efficiency = w.total > 0 ? Number(((w.resolved / w.total) * 100).toFixed(2)) : 100;

      return {
        ward: w._id,
        total: w.total,
        resolved: w.resolved,
        breached: w.breached,
        totalPenalties: w.totalPenalties,
        efficiencyPercent: efficiency,
      };
    });

    const overallEfficiency =
      grandTotal > 0 ? Number(((grandResolved / grandTotal) * 100).toFixed(2)) : 100;

    return res.status(200).json({
      success: true,
      reportTitle: "Brihanmumbai Municipal Corporation (BMC) Executive Ward Audit Summary",
      generatedAt: new Date().toISOString(),
      overallMetrics: {
        totalComplaints: grandTotal,
        totalResolved: grandResolved,
        totalBreached: grandBreached,
        totalPenaltiesAssessed: grandPenalties,
        overallEfficiencyPercent: overallEfficiency,
      },
      wardBreakdown,
    });
  } catch (error) {
    console.error("GetWardSummaryReport Error:", error.message);
    res.status(500).json({ success: false, message: "Server error generating ward report." });
  }
};

/**
 * ─── @desc    Get Multi-Tenant Government & CPGRAMS Cross-Corporation Analytics
 * ─── @route   GET /api/reports/government-overview
 * ─── @access  Private (admin)
 */
const getGovernmentOverviewReport = async (req, res) => {
  try {
    const corpAgg = await Complaint.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$corporationId", "BMC"] },
          totalGrievances: { $sum: 1 },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          breachedCount: {
            $sum: {
              $cond: [{ $eq: ["$slaStatus", "breached"] }, 1, 0],
            },
          },
          totalPenalties: { $sum: { $ifNull: ["$contractorPenalty", 0] } },
        },
      },
      { $sort: { totalGrievances: -1 } },
    ]);

    const corporationSummary = corpAgg.map((c) => ({
      corporationId: c._id,
      totalGrievances: c.totalGrievances,
      resolvedCount: c.resolvedCount,
      breachedCount: c.breachedCount,
      totalPenaltiesAssessed: c.totalPenalties,
      resolutionRatePercent: c.totalGrievances > 0 ? Number(((c.resolvedCount / c.totalGrievances) * 100).toFixed(2)) : 100,
    }));

    return res.status(200).json({
      success: true,
      portalName: "State Administrative Governance & CPGRAMS Integration Portal",
      timestamp: new Date().toISOString(),
      activeTenantsCount: corporationSummary.length,
      corporationSummary,
    });
  } catch (error) {
    console.error("GetGovernmentOverviewReport Error:", error.message);
    res.status(500).json({ success: false, message: "Server error generating government overview." });
  }
};

module.exports = {
  getWardSummaryReport,
  getGovernmentOverviewReport,
};

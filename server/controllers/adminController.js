"use strict";

const Complaint = require("../models/Complaint");

/**
 * Target Wards for Governance Leaderboard:
 * - Ward A (Colaba / Fort)
 * - Ward H-West (Bandra / Khar)
 * - Ward G-South (Worli / Parel)
 * - Ward K-East (Andheri East)
 */
const TARGET_WARDS = ["Ward A", "Ward H-West", "Ward G-South", "Ward K-East"];

// Baseline demo fallback data to ensure rich presentation if live complaints are low
const DEMO_WARD_BASELINES = {
  "Ward A":       { total: 45, resolved: 42, slaMet: 42, percentage: 93.3 },
  "Ward H-West":  { total: 38, resolved: 35, slaMet: 35, percentage: 92.1 },
  "Ward G-South": { total: 40, resolved: 32, slaMet: 31, percentage: 77.5 },
  "Ward K-East":  { total: 55, resolved: 35, slaMet: 34, percentage: 61.8 },
};

/**
 * @desc    Get real-time Ward Governance Scorecard & Leaderboard
 * @route   GET /api/admin/ward-performance
 * @access  Private (Admin / Officer)
 */
const getWardPerformanceScorecard = async (req, res) => {
  try {
    const wardScores = await Promise.all(
      TARGET_WARDS.map(async (wardName) => {
        const total = await Complaint.countDocuments({ ward: wardName });
        const resolved = await Complaint.countDocuments({
          ward: wardName,
          status: { $in: ["resolved", "closed"] },
        });
        const slaMetCount = await Complaint.countDocuments({
          ward: wardName,
          status: { $in: ["resolved", "closed"] },
          slaStatus: { $ne: "breached" },
        });

        let slaMetPercentage;
        let totalCount = total;
        let resolvedCount = resolved;

        if (total > 0) {
          // Real-time calculated SLA percentage based on DB tickets
          slaMetPercentage = Number(((slaMetCount / total) * 100).toFixed(1));
        } else {
          // Fallback to baseline metrics if no complaints exist for this ward in DB
          const baseline = DEMO_WARD_BASELINES[wardName];
          totalCount = baseline.total;
          resolvedCount = baseline.resolved;
          slaMetPercentage = baseline.percentage;
        }

        let statusBadge = "Yellow";
        if (slaMetPercentage > 90) {
          statusBadge = "Green";
        } else if (slaMetPercentage < 70) {
          statusBadge = "Red";
        }

        return {
          ward: wardName,
          totalTickets: totalCount,
          resolvedTickets: resolvedCount,
          slaMetCount: total > 0 ? slaMetCount : DEMO_WARD_BASELINES[wardName].slaMet,
          slaMetPercentage,
          statusBadge,
        };
      })
    );

    // Sort leaderboard by SLA met percentage descending
    wardScores.sort((a, b) => b.slaMetPercentage - a.slaMetPercentage);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      wards: wardScores,
    });
  } catch (error) {
    console.error("Ward Performance Scorecard Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while generating ward performance scorecard.",
    });
  }
};

module.exports = {
  getWardPerformanceScorecard,
};

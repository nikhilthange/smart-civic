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

const Department = require("../models/Department");
const Officer = require("../models/Officer");
const socketService = require("../services/socketService");

/**
 * @desc    Admin overrides / reassigns complaint department
 * @route   PATCH /api/admin/complaints/:id/department
 * @access  Private (Admin)
 */
const reassignComplaintDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, departmentCode, reason } = req.body;

    if (!departmentId && !departmentCode) {
      return res.status(400).json({ success: false, message: "Target departmentId or departmentCode is required." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    let targetDept = null;
    if (departmentId) {
      targetDept = await Department.findById(departmentId);
    } else if (departmentCode) {
      targetDept = await Department.findOne({ code: departmentCode.toUpperCase() });
    }

    if (!targetDept) {
      return res.status(404).json({ success: false, message: "Target department not found." });
    }

    const previousDeptId = complaint.department;
    complaint.department = targetDept._id;
    complaint.departmentName = targetDept.name;

    // Reset assigned worker since worker was from old department
    complaint.assignedWorker = undefined;

    // Attempt to auto-dispatch an officer from the new department in the same ward
    const newOfficer = await Officer.findOne({
      department: targetDept._id,
      isAvailable: true,
      $or: [{ wardId: complaint.wardId }, { wardName: complaint.ward }],
    }).sort({ activeComplaintsCount: 1 });

    if (newOfficer) {
      complaint.assignedOfficer = newOfficer._id;
      complaint.status = "officer_assigned";
      newOfficer.activeComplaintsCount = (newOfficer.activeComplaintsCount || 0) + 1;
      await newOfficer.save();
    } else {
      complaint.status = "ward_assigned";
    }

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user.id,
      note: `Admin reassigned department to ${targetDept.name} (${targetDept.code}). Reason: ${reason || "Administrative routing adjustment"}. Worker cleared.`,
    });

    await complaint.save();

    // Broadcast WebSocket update
    try {
      socketService.broadcastStatusUpdated(complaint);
    } catch (wsErr) {
      console.warn("WebSocket broadcast error:", wsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Complaint successfully reassigned to ${targetDept.name}`,
      complaint,
    });
  } catch (error) {
    console.error("Admin Department Reassign Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error while reassigning department." });
  }
};

/**
 * @desc    Get Contractor Reliability & Escrow Penalty Scorecard
 * @route   GET /api/admin/contractors
 * @access  Private (Admin, Officer)
 */
const getContractorsList = async (req, res) => {
  try {
    const Contractor = require("../models/Contractor");
    let contractors = await Contractor.find().populate("department", "name code").sort({ rating: -1 });

    // Provide baseline demo contractors if collection is empty
    if (contractors.length === 0) {
      const demoContractors = [
        {
          name: "L&T Infrastructure & Roadworks Pvt Ltd",
          departmentCode: "PWD",
          assignedWards: ["Ward A", "Ward H-West", "Ward G-South"],
          rating: 4.8,
          totalJobs: 124,
          completedJobs: 118,
          slaBreaches: 4,
          accumulatedPenalties: 20000,
          escrowBalance: 480000,
          contactEmail: "contracts@ltinfra.co.in",
          contactPhone: "+91 98200 11223",
        },
        {
          name: "CleanCity Enviro & Solid Waste Solutions",
          departmentCode: "SWM",
          assignedWards: ["Ward H-West", "Ward K-East"],
          rating: 4.6,
          totalJobs: 95,
          completedJobs: 90,
          slaBreaches: 3,
          accumulatedPenalties: 15000,
          escrowBalance: 485000,
          contactEmail: "ops@cleancityenviro.in",
          contactPhone: "+91 98200 44556",
        },
        {
          name: "Metro Water Supply & Pipeline Infra Ltd",
          departmentCode: "WSD",
          assignedWards: ["Ward A", "Ward G-South", "Ward K-East"],
          rating: 4.3,
          totalJobs: 82,
          completedJobs: 75,
          slaBreaches: 6,
          accumulatedPenalties: 30000,
          escrowBalance: 470000,
          contactEmail: "projects@metrowaterinfra.com",
          contactPhone: "+91 98200 77889",
        },
        {
          name: "Urban Lighting & Grid Systems Mumbai",
          departmentCode: "ELD",
          assignedWards: ["Ward A", "Ward H-West"],
          rating: 4.7,
          totalJobs: 64,
          completedJobs: 62,
          slaBreaches: 1,
          accumulatedPenalties: 5000,
          escrowBalance: 495000,
          contactEmail: "info@urbanlighting.in",
          contactPhone: "+91 98200 99001",
        },
      ];

      return res.status(200).json({
        success: true,
        contractors: demoContractors.map((c) => ({
          ...c,
          _id: `demo_${c.departmentCode.toLowerCase()}`,
          slaCompliancePercentage: Number(
            (((c.completedJobs - c.slaBreaches) / Math.max(c.completedJobs, 1)) * 100).toFixed(1)
          ),
        })),
      });
    }

    const formatted = contractors.map((c) => ({
      _id: c._id,
      name: c.name,
      department: c.department?.name || c.departmentCode,
      departmentCode: c.departmentCode,
      assignedWards: c.assignedWards,
      rating: c.rating,
      totalJobs: c.totalJobs,
      completedJobs: c.completedJobs,
      slaBreaches: c.slaBreaches,
      accumulatedPenalties: c.accumulatedPenalties,
      escrowBalance: c.escrowBalance,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      isActive: c.isActive,
      slaCompliancePercentage: Number(
        (((c.completedJobs - c.slaBreaches) / Math.max(c.completedJobs, 1)) * 100).toFixed(1)
      ),
    }));

    return res.status(200).json({
      success: true,
      contractors: formatted,
    });
  } catch (error) {
    console.error("GetContractorsList Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching contractor leaderboard." });
  }
};

module.exports = {
  getWardPerformanceScorecard,
  reassignComplaintDepartment,
  getContractorsList,
};

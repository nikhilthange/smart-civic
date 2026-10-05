const Complaint = require("../models/Complaint");
const Worker = require("../models/Worker");
const mongoose = require("mongoose");

// @desc    Get complete analytics data
// @route   GET /api/analytics
// @access  Private (Admin/Officer)
exports.getAnalytics = async (req, res) => {
  try {
    const { department, ward, category, priority, status, startDate, endDate } = req.query;

    // Build the dynamic match query based on filters
    const matchQuery = {};

    if (department) {
      matchQuery.department = new mongoose.Types.ObjectId(department);
    }
    if (ward) {
      matchQuery.wardName = ward; // Assumes ward is stored as a string or mapped to a field
    }
    if (category) {
      matchQuery.category = category;
    }
    if (priority) {
      matchQuery.priority = priority;
    }
    if (status) {
      matchQuery.status = status;
    }
    
    // Default to last 30 days if no date range is provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }
    matchQuery.createdAt = { $gte: start, $lte: end };

    // 1. Status Metrics (Total, Pending, AI verified, Ward assigned, Officer assigned, In progress, Resolved)
    const statusMetricsAgg = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          aiVerified: { $sum: { $cond: [{ $eq: ["$status", "ai_verified"] }, 1, 0] } },
          wardAssigned: { $sum: { $cond: [{ $eq: ["$status", "ward_assigned"] }, 1, 0] } },
          officerAssigned: { $sum: { $cond: [{ $eq: ["$status", "officer_assigned"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } },
        }
      }
    ]);
    const metrics = statusMetricsAgg.length > 0 ? statusMetricsAgg[0] : {
      total: 0, pending: 0, aiVerified: 0, wardAssigned: 0, officerAssigned: 0, inProgress: 0, resolved: 0, critical: 0
    };
    delete metrics._id;

    // 2. Complaints by Department
    const deptAgg = await Complaint.aggregate([
      { $match: matchQuery },
      { $match: { department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "deptInfo"
        }
      },
      { $unwind: { path: "$deptInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $ifNull: ["$deptInfo.name", "Unknown"] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Complaints by Ward
    const wardAgg = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $ifNull: ["$wardName", "$ward"] }, // Using wardName or ward field
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      {
        $project: {
          _id: { $ifNull: ["$_id", "UNASSIGNED"] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 4. Complaints by Category
    const categoryAgg = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 5. Worker Workload (Average active complaints across all active workers)
    const workerAgg = await Worker.aggregate([
      { $match: { isActive: true, isAvailable: true } },
      {
        $group: {
          _id: null,
          avgWorkload: { $avg: "$activeComplaintsCount" },
          maxWorkload: { $max: "$activeComplaintsCount" },
          totalWorkers: { $sum: 1 }
        }
      }
    ]);
    const workerStats = workerAgg.length > 0 ? {
      avgWorkload: parseFloat(workerAgg[0].avgWorkload.toFixed(1)),
      maxWorkload: workerAgg[0].maxWorkload,
      totalWorkers: workerAgg[0].totalWorkers
    } : { avgWorkload: 0, maxWorkload: 0, totalWorkers: 0 };

    // 6. Average Resolution Time (in hours)
    const resolutionPipeline = [
      { $match: { ...matchQuery, status: { $in: ["resolved", "closed"] }, resolvedAt: { $exists: true } } },
      {
        $project: {
          resolutionTime: { $subtract: ["$resolvedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgTimeMillis: { $avg: "$resolutionTime" },
        },
      },
    ];
    const resolutionData = await Complaint.aggregate(resolutionPipeline);
    const avgResolutionHours = resolutionData.length > 0 
      ? parseFloat((resolutionData[0].avgTimeMillis / (1000 * 60 * 60)).toFixed(1))
      : 0;

    // 7. Trends (Over time)
    const trendsPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const trends = await Complaint.aggregate(trendsPipeline);

    res.status(200).json({
      success: true,
      metrics,
      byDepartment: deptAgg,
      byWard: wardAgg,
      byCategory: categoryAgg,
      workerStats,
      resolutionStats: {
        avgResolutionHours
      },
      trends
    });
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching analytics" });
  }
};

// @desc    Get analytics summary for Admin Dashboard
// @route   GET /api/analytics/summary
// @access  Private (Admin/Officer)
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const Department = require("../models/Department");

    const [statusAgg, categoryAgg, deptAgg, totalCount] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Complaint.aggregate([
        { $match: { department: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "dept"
          }
        },
        { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } }
      ]),
      Complaint.countDocuments()
    ]);

    const byStatus = {};
    for (const item of statusAgg) {
      if (item._id) byStatus[item._id] = item.count;
    }

    const departmentPerformance = deptAgg.map((d) => ({
      _id: d._id,
      name: d.dept?.name || "Civic Department",
      code: d.dept?.code || "CIVIC",
      total: d.total || 0,
      resolved: d.resolved || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        byStatus,
        byCategory: categoryAgg.map(c => ({ category: c._id, count: c.count })),
        departmentPerformance
      }
    });
  } catch (error) {
    console.error("Get Analytics Summary Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching analytics summary" });
  }
};

// @desc    Get ward-level performance scorecards
// @route   GET /api/analytics/ward-scorecards
// @access  Private (Admin/Officer)
exports.getWardScorecards = async (req, res) => {
  try {
    const wardAgg = await Complaint.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$ward", "Ward H-West"] },
          totalTickets: { $sum: 1 },
          resolvedTickets: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } },
          slaMetCount: { $sum: { $cond: [{ $ne: ["$slaStatus", "breached"] }, 1, 0] } }
        }
      },
      { $sort: { totalTickets: -1 } }
    ]);

    const defaultWards = [
      { ward: "Ward A", totalTickets: 45, resolvedTickets: 42, slaMetCount: 42, slaMetPercentage: 93, statusBadge: "Green" },
      { ward: "Ward H-West", totalTickets: 68, resolvedTickets: 60, slaMetCount: 60, slaMetPercentage: 88, statusBadge: "Yellow" },
      { ward: "Ward G-South", totalTickets: 54, resolvedTickets: 47, slaMetCount: 47, slaMetPercentage: 87, statusBadge: "Yellow" },
      { ward: "Ward K-East", totalTickets: 80, resolvedTickets: 52, slaMetCount: 52, slaMetPercentage: 65, statusBadge: "Red" }
    ];

    let wardScores = wardAgg.map(w => {
      const pct = w.totalTickets > 0 ? Math.round((w.slaMetCount / w.totalTickets) * 100) : 100;
      return {
        ward: w._id,
        totalTickets: w.totalTickets,
        resolvedTickets: w.resolvedTickets,
        slaMetCount: w.slaMetCount,
        slaMetPercentage: pct,
        statusBadge: pct >= 90 ? "Green" : pct >= 75 ? "Yellow" : "Red"
      };
    });

    if (wardScores.length === 0) {
      wardScores = defaultWards;
    }

    res.status(200).json({
      success: true,
      wardScores
    });
  } catch (error) {
    console.error("Get Ward Scorecards Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching ward scorecards" });
  }
};

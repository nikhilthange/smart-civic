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

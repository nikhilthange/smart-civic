const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");

// @desc    Get complete analytics data
// @route   GET /api/analytics
// @access  Private (Admin/Officer)
exports.getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Complaint Trends (Last 30 Days)
    const trendsPipeline = [
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const trends = await Complaint.aggregate(trendsPipeline);

    // 2. Most Reported Issues (By Category)
    const categoryPipeline = [
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const categories = await Complaint.aggregate(categoryPipeline);

    // 3. Area Wise Problems
    const areaPipeline = [
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: null }, _id: { $ne: "" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const areas = await Complaint.aggregate(areaPipeline);

    // 4. Resolution Time (Avg time for resolved/closed complaints)
    const resolutionPipeline = [
      { $match: { status: { $in: ["resolved", "closed"] }, resolvedAt: { $exists: true } } },
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
      ? (resolutionData[0].avgTimeMillis / (1000 * 60 * 60)).toFixed(1)
      : 0;

    // 5. AI Accuracy
    const aiPipeline = [
      {
        $group: {
          _id: null,
          totalVerified: { $sum: { $cond: ["$aiAnalysis.verified", 1, 0] } },
          totalComplaints: { $sum: 1 },
        },
      },
    ];
    const aiData = await Complaint.aggregate(aiPipeline);
    const aiAccuracy = aiData.length > 0 && aiData[0].totalComplaints > 0
      ? ((aiData[0].totalVerified / aiData[0].totalComplaints) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      trends,
      categories,
      areas,
      resolutionStats: {
        avgResolutionHours: parseFloat(avgResolutionHours),
      },
      aiStats: {
        accuracy: parseFloat(aiAccuracy),
      },
    });
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
};

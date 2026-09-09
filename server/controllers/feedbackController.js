const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const Officer = require("../models/Officer");
const modelTrainingService = require("../services/modelTrainingService");

// ─── @desc    Submit feedback for a resolved/closed complaint
// ─── @route   POST /api/feedback
// ─── @access  Private (citizen)
const submitFeedback = async (req, res) => {
  try {
    const { complaintId, rating, comment, tags, isAnonymous } = req.body;

    if (!complaintId || !rating) {
      return res.status(400).json({ success: false, message: "Complaint ID and rating are required." });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.citizen.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only submit feedback for your own complaints." });
    }

    if (!["resolved", "closed"].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: "Feedback can only be submitted for resolved or closed complaints." });
    }

    if (complaint.feedbackSubmitted) {
      return res.status(400).json({ success: false, message: "Feedback has already been submitted for this complaint." });
    }

    // Extract officer ID if assigned
    const officerId = complaint.assignedOfficer ? complaint.assignedOfficer : null;

    const feedback = await Feedback.create({
      complaint: complaint._id,
      citizen: req.user.id,
      officer: officerId,
      rating: Number(rating),
      comment,
      tags: tags || [],
      isAnonymous: isAnonymous === true || isAnonymous === "true",
    });

    // Mark complaint as having feedback
    complaint.feedbackSubmitted = true;
    await complaint.save();

    // ── Feed into Continuous Active Learning Training Pipeline ──
    try {
      const numRating = Number(rating);
      const isPositive = numRating >= 4;
      await modelTrainingService.recordFeedbackSample({
        inputText: `${complaint.title} ${complaint.description || ""}`,
        imageUrl: complaint.attachments?.[0]?.url || complaint.imageUrl || null,
        predictedCategory: complaint.category,
        correctedCategory: complaint.category,
        predictedDepartment: complaint.departmentCode || "GEN",
        correctedDepartment: complaint.departmentCode || "GEN",
        predictedSeverity: complaint.priority || "medium",
        correctedSeverity: complaint.priority || "medium",
        source: "citizen_rating",
        contributorRole: "citizen",
        contributorId: req.user.id,
        complaintId: complaint._id,
        ward: complaint.ward || "Ward H-West",
        weight: isPositive ? 1.2 : 0.8,
      });
    } catch (trainErr) {
      console.warn("Active learning sample record warning:", trainErr.message);
    }

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error("SubmitFeedback Error:", error.message);
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: "Feedback already exists for this complaint." });
    }
    res.status(500).json({ success: false, message: "Server error while submitting feedback." });
  }
};

// ─── @desc    Get Feedback Statistics & Department Performance Breakdown
// ─── @route   GET /api/feedback/stats
// ─── @access  Public / Authenticated
const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    if (totalFeedbacks === 0) {
      return res.status(200).json({
        success: true,
        averageRating: 4.5,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        topTags: ["Quick response", "Helpful", "Professional"],
      });
    }

    const agg = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
          ratings: { $push: "$rating" },
          allTags: { $push: "$tags" },
        },
      },
    ]);

    const stats = agg[0] || { avgRating: 4.5, total: 0, ratings: [], allTags: [] };
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (stats.ratings || []).forEach((r) => {
      if (distribution[r] !== undefined) distribution[r]++;
    });

    const tagCounts = {};
    (stats.allTags || []).flat().forEach((t) => {
      if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return res.status(200).json({
      success: true,
      averageRating: Number(stats.avgRating.toFixed(2)),
      totalReviews: stats.total,
      distribution,
      topTags: topTags.length > 0 ? topTags : ["Quick response", "Professional", "Helpful"],
    });
  } catch (error) {
    console.error("GetFeedbackStats Error:", error.message);
    res.status(500).json({ success: false, message: "Server error calculating feedback statistics." });
  }
};

module.exports = { submitFeedback, getFeedbackStats };

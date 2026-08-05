const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const Officer = require("../models/Officer");

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

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error("SubmitFeedback Error:", error.message);
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: "Feedback already exists for this complaint." });
    }
    res.status(500).json({ success: false, message: "Server error while submitting feedback." });
  }
};

module.exports = { submitFeedback };

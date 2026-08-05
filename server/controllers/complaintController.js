const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");
const { normaliseAttachments } = require("../middlewares/upload");
const fs = require("fs");
const path = require("path");
const Department = require("../models/Department");
const geminiService = require("../services/geminiService");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_ORDER = ["pending", "ai_verified", "assigned", "in_progress", "resolved", "closed", "rejected"];

const DEFAULT_DEPTS = {
  PWD: "Public Works Department",
  WSD: "Water Supply & Sewage Department",
  ELD: "Electricity & Streetlights Department",
  SWM: "Solid Waste Management Department",
  PSD: "Public Safety Department",
  PRD: "Parks & Recreation Department",
  GEN: "General Administration Department"
};

// ─── @desc    Create a complaint
// ─── @route   POST /api/complaints
// ─── @access  Private (citizen)
const createComplaint = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      locationAddress, 
      locationCity, 
      locationState, 
      locationPincode, 
      lat, 
      lng, 
      priority, 
      isAnonymous 
    } = req.body;

    if (!title || !description || !category || !locationAddress) {
      return res.status(400).json({ success: false, message: "Title, description, category and location are required." });
    }

    const attachments = normaliseAttachments(req.files);

    // Call Gemini AI Analysis
    const aiAnalysis = await geminiService.analyzeComplaint(description, attachments);

    // Find or create recommended department
    let departmentId = null;
    if (aiAnalysis.recommendedDepartmentCode) {
      let dept = await Department.findOne({ code: aiAnalysis.recommendedDepartmentCode });
      if (!dept) {
        dept = await Department.create({
          code: aiAnalysis.recommendedDepartmentCode,
          name: DEFAULT_DEPTS[aiAnalysis.recommendedDepartmentCode] || "General Administration Department",
          contactEmail: `contact.${aiAnalysis.recommendedDepartmentCode.toLowerCase()}@smartcity.gov.in`,
        });
      }
      departmentId = dept._id;
    }

    const finalStatus = aiAnalysis.verified ? "ai_verified" : "pending";

    // Format GeoJSON coordinates if provided
    let coordinates = undefined;
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      coordinates = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)] // GeoJSON is [longitude, latitude]
      };
    }

    const complaint = await Complaint.create({
      title,
      description,
      category: aiAnalysis.category || category, // Overwrite with AI category if suggested
      priority: aiAnalysis.severity || priority || "medium", // AI priority mapping
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      citizen: req.user.id,
      location: {
        address: locationAddress,
        city: locationCity,
        state: locationState,
        pincode: locationPincode,
        ...(coordinates && { coordinates })
      },
      attachments,
      department: departmentId,
      status: finalStatus,
      aiAnalysis,
      statusHistory: [
        { status: "pending", changedBy: req.user.id, note: "Complaint submitted" },
        ...(aiAnalysis.verified ? [{ status: "ai_verified", changedBy: req.user.id, note: `AI verification passed. Detected issue: ${aiAnalysis.category.replace(/_/g, ' ')}. Recommended Department: ${aiAnalysis.recommendedDepartmentCode}` }] : []),
      ],
    });

    // Send confirmation notification
    await Notification.send({
      recipient: req.user.id,
      complaint: complaint._id,
      type: "complaint_submitted",
      title: "Complaint Submitted",
      message: `Your complaint "${complaint.title}" (${complaint.complaintId}) has been received${aiAnalysis.verified ? " and automatically AI-verified" : ""}.`,
      actionUrl: `/complaint/${complaint._id}/track`,
    });

    return res.status(201).json({ success: true, complaint });
  } catch (error) {
    console.error("CreateComplaint Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating complaint." });
  }
};

// ─── @desc    Get complaints (citizen: own | admin/officer: all)
// ─── @route   GET /api/complaints
// ─── @access  Private
const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10, search } = req.query;

    const query = {};

    // Citizens see only their own
    if (req.user.role === "citizen") {
      query.citizen = req.user.id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { complaintId: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("citizen", "name email avatar")
      .populate("department", "name code")
      .populate({ path: "assignedOfficer", populate: { path: "user", select: "name email" } })
      .lean();

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      complaints,
    });
  } catch (error) {
    console.error("GetComplaints Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching complaints." });
  }
};

// ─── @desc    Get single complaint by ID or complaintId
// ─── @route   GET /api/complaints/:id
// ─── @access  Private
const getComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // Support both MongoDB _id and friendly complaintId (SC-2026-XXXX)
    const query = id.startsWith("SC-") ? { complaintId: id } : { _id: id };

    const complaint = await Complaint.findOne(query)
      .populate("citizen", "name email avatar phoneNumber")
      .populate("department", "name code contactEmail contactPhone")
      .populate({ path: "assignedOfficer", populate: { path: "user", select: "name email phoneNumber" } })
      .populate("statusHistory.changedBy", "name role");

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    // Citizens can only view their own
    if (req.user.role === "citizen" && complaint.citizen._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error("GetComplaint Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching complaint." });
  }
};

// ─── @desc    Update complaint status
// ─── @route   PATCH /api/complaints/:id/status
// ─── @access  Private (admin/officer)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note, adminNotes, rejectionReason, estimatedResolution } = req.body;

    if (!STATUS_ORDER.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user.id, note: note || "" });

    if (adminNotes) complaint.adminNotes = adminNotes;
    if (rejectionReason) complaint.rejectionReason = rejectionReason;
    if (estimatedResolution) complaint.estimatedResolution = new Date(estimatedResolution);
    if (status === "resolved") complaint.resolvedAt = new Date();
    if (status === "closed") complaint.closedAt = new Date();
    if (status === "assigned") complaint.assignedAt = new Date();

    await complaint.save();

    // Notify citizen
    const statusLabels = {
      ai_verified: "AI Verified",
      assigned: "Assigned to Officer",
      in_progress: "In Progress",
      resolved: "Resolved",
      rejected: "Rejected",
    };
    if (statusLabels[status]) {
      await Notification.send({
        recipient: complaint.citizen,
        complaint: complaint._id,
        type: "complaint_status_update",
        title: `Complaint ${statusLabels[status]}`,
        message: `Your complaint "${complaint.title}" has been updated to: ${statusLabels[status]}.${note ? ` Note: ${note}` : ""}`,
        actionUrl: `/complaint/${complaint._id}/track`,
      });
    }

    res.status(200).json({ success: true, complaint, previousStatus: oldStatus });
  } catch (error) {
    console.error("UpdateStatus Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating status." });
  }
};

// ─── @desc    Delete complaint (citizen: own pending | admin: any)
// ─── @route   DELETE /api/complaints/:id
// ─── @access  Private
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    // Citizens can only delete their own pending complaints
    if (req.user.role === "citizen") {
      if (complaint.citizen.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      if (!["pending", "ai_verified"].includes(complaint.status)) {
        return res.status(400).json({ success: false, message: "Cannot delete a complaint that is already being processed." });
      }
    }

    // Clean up attached files (local or Cloudinary)
    if (complaint.attachments && complaint.attachments.length > 0) {
      for (const attachment of complaint.attachments) {
        if (attachment.publicId) {
          // Cloudinary file
          try {
            await cloudinary.uploader.destroy(attachment.publicId, {
              resource_type: attachment.resourceType || "image",
            });
          } catch (cloudErr) {
            console.error(`Failed to delete file from Cloudinary (${attachment.publicId}):`, cloudErr.message);
          }
        } else if (attachment.url && attachment.url.startsWith("/uploads/")) {
          // Local file
          const localPath = path.join(__dirname, "..", attachment.url);
          fs.unlink(localPath, (err) => {
            if (err) console.error(`Failed to delete local file (${localPath}):`, err.message);
          });
        }
      }
    }

    await complaint.deleteOne();
    res.status(200).json({ success: true, message: "Complaint deleted successfully." });
  } catch (error) {
    console.error("DeleteComplaint Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while deleting complaint." });
  }
};

// ─── @desc    Get complaint statistics (admin dashboard)
// ─── @route   GET /api/complaints/stats
// ─── @access  Private (admin/officer)
const getStats = async (req, res) => {
  try {
    const User       = require("../models/User");
    const Department = require("../models/Department");

    const [
      statusAgg,
      categoryAgg,
      deptAgg,
      dailyAgg,
      totalUsers,
      totalDepts,
    ] = await Promise.all([
      // By status
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // By category (top 8)
      Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Department performance: complaints + avg resolution time
      Complaint.aggregate([
        { $match: { department: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $in: ["$status", ["pending", "ai_verified"]] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "dept",
          },
        },
        { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$dept.name", "Unknown"] },
            code: { $ifNull: ["$dept.code", "???"] },
            total: 1,
            resolved: 1,
            pending: 1,
            resolutionRate: {
              $cond: [
                { $eq: ["$total", 0] },
                0,
                { $multiply: [{ $divide: ["$resolved", "$total"] }, 100] },
              ],
            },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 6 },
      ]),

      // Daily complaint count for last 30 days
      Complaint.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      User.countDocuments(),
      Department.countDocuments({ isActive: true }),
    ]);

    const byStatus = STATUS_ORDER.reduce((acc, s) => {
      acc[s] = statusAgg.find((x) => x._id === s)?.count || 0;
      return acc;
    }, {});

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    res.status(200).json({
      success: true,
      total,
      byStatus,
      byCategory: categoryAgg,
      departmentPerformance: deptAgg,
      dailyTrend: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
      totalUsers,
      totalDepts,
    });
  } catch (error) {
    console.error("GetStats Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { createComplaint, getComplaints, getComplaint, updateComplaintStatus, deleteComplaint, getStats };

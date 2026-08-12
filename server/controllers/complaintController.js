const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const Officer = require("../models/Officer");
const User = require("../models/User");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const cloudinary = require("../config/cloudinary");
const { normaliseAttachments } = require("../middlewares/upload");
const fs = require("fs");
const path = require("path");
const Department = require("../models/Department");
const geminiService = require("../services/geminiService");
const aiService = require("../services/aiService");
const slaService = require("../services/slaService");

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

const getBmcWardAndZone = (address = "", latNum, lngNum) => {
  const addr = (address || "").toLowerCase();
  if (addr.includes("bandra") || addr.includes("khar")) return { ward: "Ward H-West", zone: "Zone 3" };
  if (addr.includes("andheri") || addr.includes("midtown")) return { ward: "Ward K-East", zone: "Zone 4" };
  if (addr.includes("worli") || addr.includes("parel")) return { ward: "Ward G-South", zone: "Zone 2" };
  if (addr.includes("colaba") || addr.includes("fort")) return { ward: "Ward A", zone: "Zone 1" };
  if (latNum && lngNum) {
    if (latNum > 19.10) return { ward: "Ward K-East", zone: "Zone 4" };
    if (latNum > 19.05) return { ward: "Ward H-West", zone: "Zone 3" };
    if (latNum > 18.95) return { ward: "Ward G-South", zone: "Zone 2" };
  }
  return { ward: "Ward A", zone: "Zone 1" };
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
      latitude,
      longitude,
      priority, 
      isAnonymous 
    } = req.body;

    if (!title || !description || !category || !locationAddress) {
      return res.status(400).json({ success: false, message: "Title, description, category and location are required." });
    }

    const attachments = normaliseAttachments(req.files);

    // Call Integrated Computer Vision & AI Analysis Service
    const aiAnalysis = await aiService.analyzeComplaintAI(description, attachments);

    const AI_CATEGORY_MAP = {
      "Pothole": "roads_and_infrastructure",
      "Garbage": "garbage_collection",
      "Drainage": "drainage",
      "Water Leakage": "water_and_sanitation",
      "Street Light": "street_lighting",
      "Fallen Tree": "parks_and_recreation",
      "Illegal Parking": "other",
      "Open Manhole": "public_safety",
      "Road Sign": "roads_and_infrastructure",
      "Other": "other"
    };

    const mappedCategory = aiAnalysis.category ? (AI_CATEGORY_MAP[aiAnalysis.category] || aiAnalysis.category) : null;
    const targetCategory = mappedCategory || category;

    // Parse GeoJSON coordinates: MongoDB expects [longitude, latitude]
    const parsedLat = Number(lat !== undefined ? lat : latitude);
    const parsedLng = Number(lng !== undefined ? lng : longitude);
    let coordinates = undefined;
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
      coordinates = {
        type: "Point",
        coordinates: [parsedLng, parsedLat] // [longitude, latitude]
      };
    }

    // ─── 1. Spatial Proximity Check (0.0002 degrees ~ 20 meters radius) ───
    if (coordinates) {
      const activeStatuses = ["pending", "ai_verified", "assigned", "in_progress"];
      const degRadius = 0.0002; // ~20 meters
      
      const duplicateQuery = {
        category: targetCategory,
        status: { $in: activeStatuses },
        $or: [
          {
            "location.coordinates": {
              $geoWithin: {
                $centerSphere: [[parsedLng, parsedLat], 20 / 6378137] // 20 meters in radians
              }
            }
          },
          {
            "location.coordinates.coordinates.0": { $gte: parsedLng - degRadius, $lte: parsedLng + degRadius },
            "location.coordinates.coordinates.1": { $gte: parsedLat - degRadius, $lte: parsedLat + degRadius }
          }
        ]
      };

      const existingComplaint = await Complaint.findOne(duplicateQuery);

      if (existingComplaint) {
        // ─── 2. Deduplication Logic: Link new photo & Increment upvoteCount ───
        const userIdStr = (req.user.id || req.user._id)?.toString();

        if (!existingComplaint.reportedByCitizens) {
          existingComplaint.reportedByCitizens = [];
        }

        const alreadyReported = existingComplaint.reportedByCitizens.some(
          (id) => id.toString() === userIdStr
        );

        if (!alreadyReported) {
          existingComplaint.reportedByCitizens.push(req.user.id || req.user._id);
        }

        // Increment upvoteCount and upvotes fields
        existingComplaint.upvoteCount = (existingComplaint.upvoteCount || existingComplaint.upvotes || 1) + 1;
        existingComplaint.upvotes = (existingComplaint.upvotes || 1) + 1;

        // Link new photos/attachments to the original complaint
        if (attachments && attachments.length > 0) {
          if (!existingComplaint.attachments) {
            existingComplaint.attachments = [];
          }
          existingComplaint.attachments = [
            ...existingComplaint.attachments,
            ...attachments
          ].slice(0, 10); // cap total attachments at 10
        }

        existingComplaint.affectedCitizensCount = (existingComplaint.affectedCitizensCount || 1) + 1;
        existingComplaint.priorityScore = (existingComplaint.priorityScore || 10) + 5;

        // Escalate priority based on boosted priority score
        if (existingComplaint.priorityScore >= 35) {
          existingComplaint.priority = "critical";
        } else if (existingComplaint.priorityScore >= 20) {
          existingComplaint.priority = "high";
        }

        await existingComplaint.save();

        return res.status(200).json({
          success: true,
          isDuplicate: true,
          ticketId: existingComplaint.complaintId || existingComplaint._id,
          existingTicketId: existingComplaint.complaintId || existingComplaint._id,
          complaint: existingComplaint,
          message: "Duplicate complaint detected within 0.0002° (~20m) radius. Linked new photo and incremented upvoteCount on original ticket."
        });
      }
    }

    // ─── 3. New Complaint Creation ────────────────────────────────────────
    // Find or create recommended department
    let departmentId = null;
    if (aiAnalysis.department) {
      let dept = await Department.findOne({ code: aiAnalysis.department });
      if (!dept) {
        dept = await Department.create({
          code: aiAnalysis.department,
          name: DEFAULT_DEPTS[aiAnalysis.department] || "General Administration Department",
          contactEmail: `contact.${aiAnalysis.department.toLowerCase()}@smartcity.gov.in`,
        });
      }
      departmentId = dept._id;
    }

    const finalStatus = aiAnalysis.verified ? "ai_verified" : "submitted";
    const effectivePriority = aiAnalysis.severity || priority || "medium";
    const slaDeadline = slaService.calculateSlaDeadline(effectivePriority);
    const bmcLocation = getBmcWardAndZone(locationAddress, parsedLat, parsedLng);

    const userCorp = req.body.corporationId || req.user.corporationId || "BMC";
    const userJurisdiction = req.body.jurisdictionType || "municipal";

    const complaint = await Complaint.create({
      title,
      description,
      category: targetCategory,
      priority: effectivePriority,
      corporationId: userCorp,
      jurisdictionType: userJurisdiction,
      ward: bmcLocation.ward,
      zone: bmcLocation.zone,
      slaDeadline,
      slaStatus: "on_time",
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      citizen: req.user.id,
      location: {
        address: locationAddress,
        city: locationCity || "Mumbai",
        state: locationState || "Maharashtra",
        pincode: locationPincode,
        ...(coordinates && { coordinates })
      },
      attachments,
      department: departmentId,
      status: finalStatus,
      aiAnalysis,
      affectedCitizensCount: 1,
      priorityScore: 10,
      reportedByCitizens: [req.user.id],
      upvotes: 1,
      upvoteCount: 1,
      statusHistory: [
        { status: "submitted", changedBy: req.user.id, note: "Complaint submitted" },
        ...(aiAnalysis.verified ? [{ status: "ai_verified", changedBy: req.user.id, note: `AI verification passed. Detected issue: ${aiAnalysis.category}. Recommended Department: ${aiAnalysis.department}` }] : []),
      ],
    });

    // Award +10 Civic Karma points to reporting user
    await User.findByIdAndUpdate(req.user.id, { $inc: { karmaPoints: 10 } });

    // ─── Trigger Notifications ──────────────────────────────────────────────────
    try {
      // Always send Submitted
      await notificationService.complaintCreated(req.user.id, complaint);
      
      // If AI Verified
      if (aiAnalysis.verified) {
        await notificationService.aiVerified(req.user.id, complaint);
      }
      
      // If Ward Assigned
      if (complaint.ward || (complaint.wardName && complaint.wardName !== "UNASSIGNED")) {
        await notificationService.wardAssigned(req.user.id, complaint);
      }
      
      // If Officer Assigned
      if (complaint.assignedOfficer) {
        const officerDoc = await Officer.findById(complaint.assignedOfficer).populate("user");
        if (officerDoc && officerDoc.user) {
          await notificationService.officerAssignedToCitizen(req.user.id, complaint, officerDoc.user.name);
          await notificationService.newComplaintAssignedToOfficer(officerDoc.user._id, complaint);
        }
      }
    } catch (notifErr) {
      console.error("Failed to send creation notifications", notifErr);
    }

    return res.status(201).json({ success: true, isDuplicate: false, complaint });
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
    const {
      status,
      category,
      priority,
      ward,
      zone,
      slaStatus,
      corporationId,
      jurisdictionType,
      page = 1,
      limit = 10,
      search,
      city,
      state,
      pincode,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Citizens see only their own
    if (req.user.role === "citizen") {
      query.citizen = req.user.id;
    } else if (req.user.role === "officer" || req.user.role === "worker") {
      query.corporationId = req.user.corporationId || "BMC";
    } else if (corporationId) {
      query.corporationId = corporationId;
    }

    if (jurisdictionType) query.jurisdictionType = jurisdictionType;
    if (slaStatus) query.slaStatus = slaStatus;

    const andConditions = [];

    // Ward & Zone filter — check ward, zone, wardName, wardCode with case-insensitive regex match
    if (req.query.ward && typeof req.query.ward === "string" && req.query.ward !== "all") {
      const sanitizedWard = req.query.ward.split("(")[0].trim();
      const escapedWard = sanitizedWard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wardRegex = { $regex: escapedWard, $options: "i" };
      andConditions.push({
        $or: [
          { ward: wardRegex },
          { zone: wardRegex },
          { wardName: wardRegex },
          { wardCode: wardRegex }
        ]
      });
    } else if (zone && typeof zone === "string" && zone !== "all") {
      const sanitizedZone = zone.split("(")[0].trim();
      const escapedZone = sanitizedZone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.zone = { $regex: escapedZone, $options: "i" };
    }

    // Status: support comma-separated list  e.g. status=pending,resolved
    if (status && typeof status === "string") {
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (category && typeof category === "string") {
      const categories = category.split(",").map((s) => s.trim()).filter(Boolean);
      query.category = categories.length === 1 ? categories[0] : { $in: categories };
    }
    if (priority && typeof priority === "string") {
      const priorities = priority.split(",").map((s) => s.trim()).filter(Boolean);
      query.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
    }

    // Location filters
    if (city && typeof city === "string")    query["location.city"]    = { $regex: city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),    $options: "i" };
    if (state && typeof state === "string")   query["location.state"]   = { $regex: state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),   $options: "i" };
    if (pincode && typeof pincode === "string") query["location.pincode"] = { $regex: pincode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    // Date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Text search
    if (search && typeof search === "string") {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = { $regex: escapedSearch, $options: "i" };
      andConditions.push({
        $or: [
          { title: searchRegex },
          { complaintId: searchRegex },
          { description: searchRegex },
          { "location.address": searchRegex }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Allowed sort fields
    const ALLOWED_SORT = ["createdAt", "updatedAt", "priority", "status", "category"];
    const sortField  = ALLOWED_SORT.includes(sortBy) ? sortBy : "createdAt";
    const sortDir    = sortOrder === "asc" ? 1 : -1;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(Math.min(Number(limit), 100)) // max 100 per page
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

    if (!id) {
      return res.status(400).json({ success: false, message: "Complaint ID parameter is required." });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const primaryQuery = isMongoId ? { _id: id } : { complaintId: id };

    let complaint = await Complaint.findOne(primaryQuery)
      .populate("citizen", "name email avatar phoneNumber")
      .populate("assignedWorker", "name email phoneNumber")
      .populate("department", "name code contactEmail contactPhone")
      .lean();

    // Fallback lookup if mongoId query failed
    if (!complaint && isMongoId) {
      complaint = await Complaint.findOne({ complaintId: id })
        .populate("citizen", "name email avatar phoneNumber")
        .populate("assignedWorker", "name email phoneNumber")
        .populate("department", "name code contactEmail contactPhone")
        .lean();
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const userRole = req.user?.role;
    const userId = (req.user?._id || req.user?.id || "").toString();

    // Admins, officers, and workers have unrestricted access to track any complaint
    const isStaff = ["admin", "officer", "worker"].includes(userRole);

    if (!isStaff && userRole === "citizen") {
      const complaintCitizenId = complaint.citizen?._id
        ? complaint.citizen._id.toString()
        : complaint.citizen?.toString();
      if (complaintCitizenId && complaintCitizenId !== userId) {
        return res.status(403).json({ success: false, message: "Access denied to this complaint." });
      }
    }

    return res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error("GetComplaint Error Stack:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching complaint." });
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
      if (status === "resolved") {
        await notificationService.complaintResolved(complaint.citizen, complaint);
      } else {
        await notificationService.statusUpdated(complaint.citizen, complaint, status);
      }
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

const assignOfficer = async (req, res) => {
  try {
    const { officerId } = req.body;
    const complaintId = req.params.id;

    if (!officerId) return res.status(400).json({ success: false, message: "Officer ID is required" });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    const officer = await Officer.findById(officerId);
    if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

    // Update complaint
    complaint.assignedOfficer = officerId;
    complaint.status = "officer_assigned";
    complaint.assignedAt = new Date();
    await complaint.save();

    // Update officer stats
    officer.activeComplaintsCount += 1;
    await officer.save();

    // Notify citizen via in-app + email + FCM
    const officerUser = await require("../models/User").findById(officer.user).select("name").lean();
    await notificationService.officerAssignedToCitizen(complaint.citizen, complaint, officerUser?.name || "an officer");

    res.status(200).json({ success: true, message: "Officer assigned successfully", complaint });
  } catch (error) {
    console.error("Assign Officer Error:", error.message);
    res.status(500).json({ success: false, message: "Server error assigning officer." });
  }
};

// ─── @desc    Resolve complaint with mandatory resolution proof image
// ─── @route   PUT /api/complaints/:id/resolve
// ─── @access  Private (officer, admin)
const resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    // Process uploaded resolution proof image
    let resolutionImage = null;
    if (req.file) {
      resolutionImage = {
        url: req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`,
        filename: req.file.originalname || req.file.filename,
        publicId: req.file.filename || null
      };
    } else if (req.files && req.files.length > 0) {
      const file = req.files[0];
      resolutionImage = {
        url: file.path || file.secure_url || `/uploads/${file.filename}`,
        filename: file.originalname || file.filename,
        publicId: file.filename || null
      };
    }

    if (!resolutionImage && !complaint.resolutionImage?.url) {
      return res.status(400).json({
        success: false,
        message: "Mandatory resolution proof image required to mark issue as resolved."
      });
    }

    complaint.status = "resolved";
    complaint.resolvedAt = new Date();
    if (resolutionImage) {
      complaint.resolutionImage = resolutionImage;
    }
    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes;
    }

    complaint.statusHistory.push({
      status: "resolved",
      changedBy: req.user.id,
      note: resolutionNotes || "Issue marked as resolved with proof photo."
    });

    await complaint.save();

    // Trigger Notification to Citizen
    if (notificationService.complaintResolved) {
      await notificationService.complaintResolved(complaint.citizen, complaint);
    }

    return res.status(200).json({
      success: true,
      message: "Complaint marked as resolved successfully!",
      complaint
    });
  } catch (error) {
    console.error("ResolveComplaint Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while resolving complaint." });
  }
};

// ─── @desc    Reopen a resolved complaint within 48 hours
// ─── @route   POST /api/complaints/:id/reopen
// ─── @access  Private (citizen)
const reopenComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.citizen.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to reopen this complaint." });
    }

    if (complaint.status !== "resolved") {
      return res.status(400).json({ success: false, message: "Only resolved complaints can be reopened." });
    }

    // Verify 48-hour reopen window
    if (complaint.resolvedAt) {
      const hoursPassed = (new Date().getTime() - new Date(complaint.resolvedAt).getTime()) / (1000 * 60 * 60);
      if (hoursPassed > 48) {
        return res.status(400).json({
          success: false,
          message: "Reopen window expired. Complaints can only be reopened within 48 hours of resolution."
        });
      }
    }

    // Reset status and escalate priority to critical
    complaint.status = "reopened";
    complaint.priority = "critical";
    complaint.priorityScore = (complaint.priorityScore || 10) + 20;
    complaint.slaStatus = "escalated";
    complaint.slaDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12-hour critical SLA

    complaint.statusHistory.push({
      status: "reopened",
      changedBy: req.user.id,
      note: `Ticket REOPENED by citizen. Reason: ${reason || "Unsatisfactory resolution"}. Escalated to CRITICAL priority.`
    });

    await complaint.save();

    // Trigger Notification
    if (notificationService.statusUpdated) {
      await notificationService.statusUpdated(complaint.citizen, complaint, "reopened (escalated)");
    }

    return res.status(200).json({
      success: true,
      message: "Complaint reopened and escalated to CRITICAL priority!",
      complaint
    });
  } catch (error) {
    console.error("ReopenComplaint Error:", error.message);
    res.status(500).json({ success: false, message: "Server error reopening complaint." });
  }
};

// ─── @desc    Assign field worker to complaint
// ─── @route   PUT /api/complaints/:id/assign-worker
// ─── @access  Private (officer, admin)
const assignWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: "Worker ID is required." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    complaint.assignedWorker = workerId;
    complaint.status = "worker_assigned";
    complaint.statusHistory.push({
      status: "worker_assigned",
      changedBy: req.user.id,
      note: `Assigned to field worker (ID: ${workerId}).`
    });

    await complaint.save();
    return res.status(200).json({ success: true, message: "Worker assigned successfully!", complaint });
  } catch (error) {
    console.error("AssignWorker Error:", error.message);
    res.status(500).json({ success: false, message: "Server error assigning worker." });
  }
};

// ─── @desc    Get eligible workers for a complaint
// ─── @route   GET /api/complaints/:id/eligible-workers
// ─── @access  Private (officer, admin)
const getEligibleWorkers = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const Worker = require("../models/Worker");
    
    // Eligibility: active AND same department AND same ward
    const eligibleWorkers = await Worker.find({
      department: complaint.department,
      wardId: complaint.wardId,
    }).populate("user", "name");

    // Sort by lowest active workload if activeTasks/activeComplaintsCount is tracked
    eligibleWorkers.sort((a, b) => (a.activeComplaintsCount || 0) - (b.activeComplaintsCount || 0));

    return res.status(200).json({ success: true, workers: eligibleWorkers });
  } catch (error) {
    console.error("GetEligibleWorkers Error:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching eligible workers." });
  }
};

// ─── @desc    Get tasks assigned to logged-in worker
// ─── @route   GET /api/complaints/worker-tasks
// ─── @access  Private (worker)
const getWorkerTasks = async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedWorker: req.user.id })
      .populate("citizen", "name email phoneNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error("GetWorkerTasks Error:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching worker tasks." });
  }
};

// ─── @desc    Worker submits resolution proof image & notes
// ─── @route   PUT /api/complaints/:id/worker-submit
// ─── @access  Private (worker, officer)
const workerSubmitProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, workNotes, resolutionDescription } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Mandatory after-resolution proof image is required." });
    }

    let imageUrl = `/uploads/${req.file.filename}`;
    if (req.file.path && (req.file.path.startsWith("http://") || req.file.path.startsWith("https://"))) {
      imageUrl = req.file.path;
    }

    complaint.resolutionImage = {
      url: imageUrl,
      filename: req.file.filename || req.file.originalname,
      publicId: req.file.filename || null,
    };
    complaint.resolutionNotes = resolutionDescription || notes || "Worker submitted resolution proof.";
    if (workNotes) complaint.workNotes = workNotes;

    complaint.status = "resolution_submitted";

    complaint.statusHistory.push({
      status: "resolution_submitted",
      changedBy: req.user.id,
      note: "Worker submitted resolution proof.",
    });

    await complaint.save();
    
    // Trigger Notifications
    try {
      await notificationService.resolutionSubmittedToCitizen(complaint.citizen, complaint);
      
      const officerDoc = await Officer.findById(complaint.assignedOfficer).populate("user");
      if (officerDoc && officerDoc.user) { 
        await notificationService.resolutionSubmittedToOfficer(officerDoc.user._id, complaint);
      }
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    return res.status(200).json({ success: true, message: "Resolution proof submitted successfully!", complaint });
  } catch (error) {
    console.error("WorkerSubmitProof Error:", error.message);
    res.status(500).json({ success: false, message: "Server error submitting proof." });
  }
};

// ─── @desc    Worker starts work
// ─── @route   PUT /api/complaints/:id/start-work
// ─── @access  Private (worker)
const workerStartWork = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.status !== "worker_assigned") {
      return res.status(400).json({ success: false, message: "Complaint must be in 'worker_assigned' state to start work." });
    }

    complaint.status = "in_progress";
    complaint.statusHistory.push({
      status: "in_progress",
      changedBy: req.user.id,
      note: "Worker started work.",
    });

    await complaint.save();

    // Trigger Notification
    try {
      await notificationService.workerStartedWork(complaint.citizen, complaint);
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    return res.status(200).json({ success: true, message: "Work started!", complaint });
  } catch (error) {
    console.error("WorkerStartWork Error:", error.message);
    res.status(500).json({ success: false, message: "Server error starting work." });
  }
};

// ─── @desc    Officer rejects worker resolution
// ─── @route   PUT /api/complaints/:id/reject-resolution
// ─── @access  Private (officer, admin)
const rejectResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required to reject resolution." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.status !== "resolution_submitted") {
      return res.status(400).json({ success: false, message: "Complaint must have proof submitted to reject it." });
    }

    complaint.status = "in_progress";
    complaint.statusHistory.push({
      status: "in_progress",
      changedBy: req.user.id,
      note: `Officer rejected resolution proof. Reason: ${reason}`,
    });

    await complaint.save();

    // Trigger Notification
    try {
      const workerDoc = await Worker.findById(complaint.assignedWorker).populate("user");
      if (workerDoc && workerDoc.user) {
        await notificationService.reworkRequested(workerDoc.user._id, complaint);
      }
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    return res.status(200).json({ success: true, message: "Resolution rejected, sent back to worker.", complaint });
  } catch (error) {
    console.error("RejectResolution Error:", error.message);
    res.status(500).json({ success: false, message: "Server error rejecting resolution." });
  }
};

// ─── @desc    Officer reassigns complaint to another worker
// ─── @route   PUT /api/complaints/:id/reassign-worker
// ─── @access  Private (officer, admin)
const reassignWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { newWorkerId, reason } = req.body;

    if (!newWorkerId || !reason) {
      return res.status(400).json({ success: false, message: "New worker ID and reason are required." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (!["worker_assigned", "in_progress"].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: "Complaint must be assigned or in progress to reassign." });
    }

    const previousWorkerId = complaint.assignedWorker;
    
    // Check if new worker is valid
    const newWorker = await Worker.findById(newWorkerId).populate("user");
    if (!newWorker || !newWorker.isAvailable || newWorker.department.toString() !== complaint.department.toString() || newWorker.wardId.toString() !== complaint.wardId.toString()) {
      return res.status(400).json({ success: false, message: "New worker is not eligible (must be active and in the same ward/department)." });
    }

    // Update old worker count if exists
    if (previousWorkerId) {
      const oldWorker = await Worker.findById(previousWorkerId).populate("user");
      if (oldWorker) {
        oldWorker.activeComplaintsCount = Math.max(0, oldWorker.activeComplaintsCount - 1);
        await oldWorker.save();
        
        // Notify old worker
        try {
          if (oldWorker.user) {
            await notificationService.send({
              recipientId: oldWorker.user._id,
              complaintId: complaint._id,
              type: "general",
              title: "Task Reassigned 🔄",
              message: `Task "${complaint.title}" has been reassigned from you to another worker.`,
            });
          }
        } catch (e) {
          console.error("Notif Error", e);
        }
      }
    }

    // Update new worker count
    newWorker.activeComplaintsCount += 1;
    await newWorker.save();

    complaint.assignedWorker = newWorker._id;
    complaint.status = "worker_assigned";

    complaint.statusHistory.push({
      status: "worker_assigned",
      changedBy: req.user.id,
      note: `Reassigned to field worker ${newWorker.user.name}. Reason: ${reason}`
    });

    if (!complaint.reassignmentHistory) {
      complaint.reassignmentHistory = [];
    }

    complaint.reassignmentHistory.push({
      previousWorkerId: previousWorkerId,
      newWorkerId: newWorker._id,
      reassignedBy: req.user.id,
      reason: reason,
      reassignedAt: new Date()
    });

    await complaint.save();

    // Trigger Notification for New Worker and Citizen
    try {
      await notificationService.workerAssignedToCitizen(complaint.citizen, complaint, newWorker.user.name);
      await notificationService.complaintAssignedToWorker(newWorker.user._id, complaint);
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    return res.status(200).json({ success: true, message: "Worker reassigned successfully!", complaint });
  } catch (error) {
    console.error("ReassignWorker Error:", error.message);
    res.status(500).json({ success: false, message: "Server error reassigning worker." });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
  assignOfficer,
  resolveComplaint,
  reopenComplaint,
  assignWorker,
  getEligibleWorkers,
  reassignWorker,
  getWorkerTasks,
  workerSubmitProof,
  workerStartWork,
  rejectResolution,
};

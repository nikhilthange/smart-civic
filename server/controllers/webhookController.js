const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Ward = require("../models/Ward");
const { classifyImageBuffer, BMC_CLASSES } = require("../services/localVisionService");
const { calculateSlaDeadline } = require("../services/slaService");
const socketService = require("../services/socketService");
const { BMC_WARDS_DATA } = require("../scripts/seedWardBoundaries");

// Helper for Point-in-Polygon
function isPointInPolygon(point, polygonCoordinates) {
  const [lng, lat] = point;
  let inside = false;
  for (let i = 0, j = polygonCoordinates.length - 1; i < polygonCoordinates.length; j = i++) {
    const xi = polygonCoordinates[i][0], yi = polygonCoordinates[i][1];
    const xj = polygonCoordinates[j][0], yj = polygonCoordinates[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * ─── WhatsApp & Chatbot Webhook Ingestion Controller ──────────────────────────
 * @route   POST /api/webhooks/bot-report
 * @access  Public (Webhook API Token / Open endpoint)
 */
const handleBotReport = async (req, res) => {
  try {
    const { senderPhone, text, imageUrl, latitude, longitude, citizenName } = req.body;

    if (!senderPhone || (!text && !imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "senderPhone and at least text or imageUrl are required for bot grievance ingestion.",
      });
    }

    // 1. Resolve or create shadow citizen account
    const cleanPhone = String(senderPhone).replace(/\D/g, "");
    const email = `${cleanPhone}@whatsapp.bmc.gov.in`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: citizenName || `WhatsApp Citizen (+${cleanPhone})`,
        email,
        password: "bot_auto_generated_pwd_hash_2026",
        phone: cleanPhone,
        role: "citizen",
        ward: "Ward A",
      });
    }

    // 2. Classify Category & Department
    let category = "roads_and_infrastructure";
    let departmentId = "PWD";
    let severity = "medium";
    let classificationNote = "Bot Keyword Classifier";

    if (text) {
      const lowerText = text.toLowerCase();
      for (const cls of BMC_CLASSES) {
        if (cls.keywords.some((k) => lowerText.includes(k))) {
          category = cls.category;
          departmentId = cls.department;
          severity = cls.defaultSeverity;
          classificationNote = `Bot Rule-Engine: Matched keyword to ${cls.label} [${cls.department}]`;
          break;
        }
      }
    }

    // 3. Resolve Ward via Coordinates or default
    const lat = Number(latitude) || 18.9220;
    const lng = Number(longitude) || 72.8340;
    let resolvedWardName = "Ward A";
    let resolvedWardCode = "A";

    for (const ward of BMC_WARDS_DATA) {
      if (isPointInPolygon([lng, lat], ward.boundary.coordinates[0])) {
        resolvedWardName = ward.wardName;
        resolvedWardCode = ward.wardCode;
        break;
      }
    }

    let wardDoc = await Ward.findOne({ wardCode: resolvedWardCode });
    if (!wardDoc) {
      wardDoc = await Ward.findOne();
    }

    // 4. Generate Complaint ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `BMC-2026-WA-${randomSuffix}`;
    const slaDeadline = calculateSlaDeadline(severity);

    // 5. Create Complaint Document
    const complaint = await Complaint.create({
      complaintId,
      title: text ? (text.length > 50 ? `${text.slice(0, 47)}...` : text) : `WhatsApp Grievance (${departmentId})`,
      description: text || "Grievance submitted via WhatsApp Municipal Bot",
      category,
      departmentId,
      department: departmentId,
      severity,
      citizen: user._id,
      wardId: wardDoc ? wardDoc._id : null,
      wardName: resolvedWardName,
      wardCode: resolvedWardCode,
      ward: resolvedWardName,
      slaDeadline,
      slaStatus: "on_time",
      escalationTier: 1,
      location: {
        address: `${resolvedWardName}, Mumbai, Maharashtra`,
        city: "Mumbai",
        state: "Maharashtra",
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
      attachments: imageUrl
        ? [
            {
              url: imageUrl,
              publicId: `bot_${Date.now()}`,
              fileType: "image/jpeg",
              uploadedAt: new Date(),
            },
          ]
        : [],
      status: "ai_verified",
      statusHistory: [
        {
          status: "submitted",
          changedBy: user._id,
          note: `Received via WhatsApp Chatbot Webhook (+${cleanPhone}).`,
        },
        {
          status: "ai_verified",
          note: `${classificationNote}. Ward routed to ${resolvedWardName}.`,
        },
      ],
      aiVerification: {
        isVerified: true,
        detectedCategory: category,
        confidence: 0.91,
        severity,
        notes: classificationNote,
        source: "WHATSAPP_BOT_INGESTION",
      },
    });

    // 6. Broadcast Real-Time Event
    try {
      socketService.broadcastComplaintCreated({
        complaintId: complaint.complaintId || complaint._id,
        title: complaint.title,
        ward: complaint.wardName,
        category: complaint.category,
        priority: complaint.severity,
      });
    } catch (sErr) {
      console.warn("Socket broadcast warning:", sErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully via WhatsApp Municipal Bot",
      complaintId: complaint.complaintId || complaint._id,
      title: complaint.title,
      department: complaint.departmentId,
      ward: complaint.wardName,
      slaDeadline: complaint.slaDeadline,
      trackingUrl: `/complaint/${complaint.complaintId || complaint._id}/track`,
    });
  } catch (error) {
    console.error("Webhook Ingestion Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error ingesting webhook report." });
  }
};

module.exports = {
  handleBotReport,
};

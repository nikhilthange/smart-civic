const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const AttachmentSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },          // Cloudinary secure URL or local path
    publicId: { type: String, default: null },           // Cloudinary public_id for deletion
    filename: { type: String, required: true },          // Original filename
    mimetype: {
      type: String,
      enum: [
        "image/jpeg", "image/jpg", "image/png",
        "image/webp", "image/gif",
        "video/mp4",
        "application/pdf",
      ],
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },
    size: { type: Number },                              // bytes
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: [true, "Location address is required"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"],
    },
    // GeoJSON point for map queries
    coordinates: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
        validate: {
          validator: function (v) {
            return !v || v.length === 0 || v.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, maxlength: [500, "Note cannot exceed 500 characters"] },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReassignmentHistorySchema = new mongoose.Schema(
  {
    previousWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    newWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true },
    reassignedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "roads_and_infrastructure",
          "water_and_sanitation",
          "electricity",
          "garbage_collection",
          "public_safety",
          "parks_and_recreation",
          "noise_pollution",
          "illegal_construction",
          "street_lighting",
          "public_transport",
          "drainage",
          "storm_water_drains",
          "public_health",
          "licensing_and_encroachment",
          "other",
        ],
        message: "Please select a valid category",
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "submitted",
          "ai_verified",
          "ward_assigned",
          "officer_assigned",
          "assigned",
          "worker_assigned",
          "in_progress",
          "resolution_submitted",
          "resolved",
          "closed",
          "reopened",
          "rejected",
        ],
        message: "Invalid status",
      },
      default: "submitted",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "critical"],
        message: "Priority must be low, medium, high, or critical",
      },
      default: "medium",
    },

    // ─── Relationships ────────────────────────────────────────────────────────
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Citizen reference is required"],
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Location ─────────────────────────────────────────────────────────────
    location: {
      type: LocationSchema,
      required: [true, "Location is required"],
    },

    // ─── Attachments ──────────────────────────────────────────────────────────
    attachments: {
      type: [AttachmentSchema],
      validate: {
        validator: (v) => v.length <= 5,
        message: "Cannot upload more than 5 attachments",
      },
    },

    // ─── Multi-Tenant Municipal & Inter-Agency Governance ─────────────────────
    corporationId: {
      type: String,
      default: "BMC",
      trim: true,
    },
    jurisdictionType: {
      type: String,
      enum: ["municipal", "state_highway", "railways", "development_authority"],
      default: "municipal",
    },

    // ─── BMC Ward & Municipal Governance ─────────────────────────────────────
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      default: null,
    },
    wardName: {
      type: String,
      default: "UNASSIGNED",
      trim: true,
    },
    wardCode: {
      type: String,
      default: "UNASSIGNED",
      trim: true,
    },
    zone: {
      type: String,
      default: "Zone 1",
      trim: true,
    },

    // ─── SLA Management & Penalties ───────────────────────────────────────────
    slaDeadline: {
      type: Date,
      required: true,
    },
    slaStatus: {
      type: String,
      enum: ["on_time", "escalated", "breached"],
      default: "on_time",
    },
    escalationTier: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    contractorPenalty: {
      type: Number,
      default: 0,
    },
    assignedContractor: {
      name: { type: String, trim: true, default: null },
      vendorId: { type: String, trim: true, default: null },
      assignedAt: { type: Date, default: null },
    },
    materialsUsed: [
      {
        itemCode: { type: String, trim: true },
        itemName: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: "units" },
      },
    ],

    // ─── Timeline ─────────────────────────────────────────────────────────────
    statusHistory: [StatusHistorySchema],
    reassignmentHistory: [ReassignmentHistorySchema],
    estimatedResolution: { type: Date },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },

    // ─── Notes ────────────────────────────────────────────────────────────────
    resolutionImage: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution notes cannot exceed 1000 characters"],
    },
    workNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Work notes cannot exceed 1000 characters"],
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        isInternal: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Automated AI Resolution Quality Inspection ───────────────────────────
    resolutionAiCheck: {
      isAcceptable: { type: Boolean, default: true },
      confidenceScore: { type: Number, default: 0.90 },
      analysis: { type: String, default: "" },
      flags: [{ type: String }],
      inspectedAt: { type: Date, default: null },
    },

    // ─── Engagement ───────────────────────────────────────────────────────────
    upvotes: {
      type: Number,
      default: 1,
    },
    upvoteCount: {
      type: Number,
      default: 1,
    },
    affectedCitizensCount: {
      type: Number,
      default: 1,
    },
    reportedByCitizens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priorityScore: {
      type: Number,
      default: 10,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isSimulated: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Has citizen provided feedback after resolution
    feedbackSubmitted: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    citizenFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    isDlpCovered: {
      type: Boolean,
      default: false,
      index: true,
    },
    dlpContractId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    // AI Analysis results from Computer Vision & Multi-Modal Vision AI
    aiAnalysis: {
      verified: { type: Boolean, default: false },
      category: { type: String, default: null },
      confidence: { type: Number, default: 0 },
      severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
      department: { type: String, default: null },
      explanation: { type: String, default: null },
      analysisNote: { type: String, default: null },
      severityScore: { type: Number, default: 0 },
      boundingBoxes: { type: Array, default: [] },
      source: { type: String, default: "LOCAL_YOLO_VISION" },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: complaintId index is created automatically by unique:true
ComplaintSchema.index({ citizen: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ department: 1 });
ComplaintSchema.index({ assignedOfficer: 1 });
ComplaintSchema.index({ assignedWorker: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ status: 1, department: 1 }); // Admin dashboard
ComplaintSchema.index({ citizen: 1, status: 1 }); // Citizen view
ComplaintSchema.index({ "location.coordinates": "2dsphere" }); // Geo queries
ComplaintSchema.index({ "location.coordinates": "2dsphere", status: 1, department: 1 }); // SITREP heatmap aggregation
ComplaintSchema.index({ status: 1, "location.coordinates": "2dsphere", createdAt: -1 }); // Compound geospatial triage
ComplaintSchema.index({ ward: 1, status: 1, createdAt: -1 }); // Ward SLA ranking

// ─── Auto-generate complaint ID before saving ─────────────────────────────────
ComplaintSchema.pre("save", function () {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const uid = uuidv4().split("-")[0].toUpperCase();
    this.complaintId = `SC-${year}-${uid}`;
  }
  // Record status change history automatically
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({ status: this.status });
  }
});

// ─── Virtual: feedback ────────────────────────────────────────────────────────
ComplaintSchema.virtual("feedback", {
  ref: "Feedback",
  localField: "_id",
  foreignField: "complaint",
  justOne: true,
});

// ─── Virtual: payment ─────────────────────────────────────────────────────────
ComplaintSchema.virtual("payment", {
  ref: "Payment",
  localField: "_id",
  foreignField: "complaint",
  justOne: true,
});

module.exports = mongoose.model("Complaint", ComplaintSchema);

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
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
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
          "other",
        ],
        message: "Please select a valid category",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "ai_verified", "assigned", "in_progress", "resolved", "closed", "rejected"],
        message: "Invalid status",
      },
      default: "pending",
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
      ref: "User",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
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
    ward: {
      type: String,
      default: "Ward A",
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
    contractorPenalty: {
      type: Number,
      default: 0,
    },
    assignedContractor: {
      name: { type: String, trim: true, default: null },
      vendorId: { type: String, trim: true, default: null },
      assignedAt: { type: Date, default: null },
    },

    // ─── Timeline ─────────────────────────────────────────────────────────────
    statusHistory: [StatusHistorySchema],
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

    // ─── Engagement ───────────────────────────────────────────────────────────
    upvotes: {
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
    // Has citizen provided feedback after resolution
    feedbackSubmitted: {
      type: Boolean,
      default: false,
    },
    // AI Analysis results from Google Gemini
    aiAnalysis: {
      verified: { type: Boolean, default: false },
      category: { type: String, default: null },
      confidence: { type: Number, default: 0 },
      severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
      recommendedDepartmentCode: { type: String, default: null },
      analysisNote: { type: String, default: null },
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
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ status: 1, department: 1 }); // Admin dashboard
ComplaintSchema.index({ citizen: 1, status: 1 }); // Citizen view
ComplaintSchema.index({ "location.coordinates": "2dsphere" }); // Geo queries

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

const mongoose = require("mongoose");

const OfficerSchema = new mongoose.Schema(
  {
    // One-to-one link to User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Employee ID cannot exceed 20 characters"],
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    isAvailable: {
      type: Boolean,
      default: true, // Can accept new complaint assignments
    },
    // Workload tracking
    activeComplaintsCount: {
      type: Number,
      default: 0,
      min: [0, "Active complaints count cannot be negative"],
    },
    totalResolved: {
      type: Number,
      default: 0,
      min: [0, "Total resolved cannot be negative"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: user and employeeId indexes are created automatically by unique:true above
OfficerSchema.index({ department: 1 });
OfficerSchema.index({ isAvailable: 1 });
OfficerSchema.index({ department: 1, isAvailable: 1 }); // Compound for assignment queries

// ─── Virtual: complaints assigned to officer ──────────────────────────────────
OfficerSchema.virtual("complaints", {
  ref: "Complaint",
  localField: "_id",
  foreignField: "assignedOfficer",
});

module.exports = mongoose.model("Officer", OfficerSchema);

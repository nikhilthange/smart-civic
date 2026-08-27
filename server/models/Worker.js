const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema(
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
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Ward is required for assignment"],
    },
    wardName: {
      type: String,
      required: [true, "Ward Name is required"],
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Employee ID cannot exceed 20 characters"],
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
WorkerSchema.index({ department: 1, wardId: 1, isAvailable: 1 }); // Compound for assignment queries
WorkerSchema.index({ activeComplaintsCount: 1 }); // Least-loaded worker query
WorkerSchema.index({ isAvailable: 1, activeComplaintsCount: 1 }); // Compound availability + workload query

// ─── Virtual: complaints assigned to worker ──────────────────────────────────
WorkerSchema.virtual("complaints", {
  ref: "Complaint",
  localField: "_id",
  foreignField: "assignedWorker",
});

module.exports = mongoose.model("Worker", WorkerSchema);

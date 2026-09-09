const mongoose = require("mongoose");

const AiFeedbackSampleSchema = new mongoose.Schema(
  {
    inputText: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    predictedCategory: {
      type: String,
      required: true,
    },
    correctedCategory: {
      type: String,
      required: true,
    },
    predictedDepartment: {
      type: String,
      required: true,
    },
    correctedDepartment: {
      type: String,
      required: true,
    },
    predictedSeverity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    correctedSeverity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    confidenceAtPrediction: {
      type: Number,
      default: 0.5,
    },
    source: {
      type: String,
      enum: [
        "officer_override",
        "citizen_rating",
        "citizen_appeal_dispute",
        "worker_field_verification",
        "manual_annotation",
        "synthetic_seed",
      ],
      default: "officer_override",
    },
    contributorRole: {
      type: String,
      enum: ["citizen", "officer", "worker", "admin", "system"],
      default: "officer",
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
    ward: {
      type: String,
      default: "Ward H-West",
    },
    weight: {
      type: Number,
      default: 1.0, // Higher weight for Senior Officers (1.5x) and Verified Resolves (1.2x)
    },
    isTrained: {
      type: Boolean,
      default: false,
    },
    trainingEpoch: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying of untrained feedback and ward distribution
AiFeedbackSampleSchema.index({ isTrained: 1, createdAt: -1 });
AiFeedbackSampleSchema.index({ source: 1 });
AiFeedbackSampleSchema.index({ correctedDepartment: 1 });

module.exports = mongoose.model("AiFeedbackSample", AiFeedbackSampleSchema);

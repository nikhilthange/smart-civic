const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
      unique: true, // One feedback per complaint
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Citizen reference is required"],
    },
    // Optional: rated the assigned officer directly
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    tags: {
      type: [String],
      enum: ["quick_response", "professional", "helpful", "poor_quality", "slow", "excellent"],
      default: [],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true, // Shown in public testimonials
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: complaint index is created automatically by unique:true above
FeedbackSchema.index({ citizen: 1 });
FeedbackSchema.index({ officer: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ isPublic: 1, createdAt: -1 }); // Public testimonials feed

// ─── Post-save: update officer's average rating ───────────────────────────────
FeedbackSchema.post("save", async function () {
  if (!this.officer) return;
  try {
    const Officer = mongoose.model("Officer");
    const result = await mongoose.model("Feedback").aggregate([
      { $match: { officer: this.officer } },
      { $group: { _id: "$officer", avgRating: { $avg: "$rating" } } },
    ]);
    if (result.length > 0) {
      await Officer.findByIdAndUpdate(this.officer, {
        averageRating: Math.round(result[0].avgRating * 10) / 10,
      });
    }
  } catch (err) {
    console.error("Feedback post-save hook error:", err.message);
  }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);

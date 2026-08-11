const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          "complaint_submitted",
          "complaint_assigned",
          "complaint_assigned_worker",
          "complaint_status_update",
          "complaint_resolved",
          "complaint_rejected",
          "complaint_rework_requested",
          "payment_success",
          "payment_failed",
          "feedback_request",
          "general",
        ],
        message: "Invalid notification type",
      },
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Deep link for the frontend
    actionUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
NotificationSchema.index({ recipient: 1, isRead: 1 });         // Unread count badge
NotificationSchema.index({ recipient: 1, createdAt: -1 });     // Notification feed
NotificationSchema.index({ complaint: 1 });
// Auto-expire notifications older than 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

// ─── Instance: Mark as read ────────────────────────────────────────────────────
NotificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// ─── Static: Create and send notification ────────────────────────────────────
NotificationSchema.statics.send = async function ({ recipient, complaint, type, title, message, actionUrl, metadata }) {
  return this.create({ recipient, complaint, type, title, message, actionUrl, metadata });
};

module.exports = mongoose.model("Notification", NotificationSchema);

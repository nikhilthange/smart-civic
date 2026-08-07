const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // INR
    },
    purpose: {
      type: String,
      required: true,
      enum: ["Road Repair", "Garbage Management", "Tree Plantation"],
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["created", "successful", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);

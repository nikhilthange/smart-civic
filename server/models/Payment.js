const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payer reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least ₹1"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["pending", "success", "failed", "refunded"],
        message: "Invalid payment status",
      },
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["upi", "card", "netbanking", "wallet", "other"],
        message: "Invalid payment method",
      },
    },
    // Razorpay integration fields
    razorpayOrderId: {
      type: String,
      trim: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      select: false, // Security: never return in queries
      trim: true,
    },
    // Generic transaction ID for other gateways
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    // Receipt / invoice URL
    receiptUrl: {
      type: String,
      default: null,
    },
    // Refund info
    refundId: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: [300, "Refund reason cannot exceed 300 characters"],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    // Raw gateway response for audit
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
PaymentSchema.index({ complaint: 1 });
PaymentSchema.index({ payer: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ payer: 1, status: 1 }); // User payment history

// ─── Virtual: Formatted amount (e.g. "₹299.00") ──────────────────────────────
PaymentSchema.virtual("formattedAmount").get(function () {
  return `₹${(this.amount / 100).toFixed(2)}`; // amount stored in paise
});

// ─── Instance: Mark payment as success ───────────────────────────────────────
PaymentSchema.methods.markSuccess = async function (razorpayPaymentId, razorpaySignature) {
  this.status = "success";
  this.razorpayPaymentId = razorpayPaymentId;
  this.razorpaySignature = razorpaySignature;
  this.paidAt = new Date();
  return this.save();
};

// ─── Instance: Mark payment as failed ────────────────────────────────────────
PaymentSchema.methods.markFailed = async function (reason) {
  this.status = "failed";
  this.failureReason = reason;
  return this.save();
};

module.exports = mongoose.model("Payment", PaymentSchema);

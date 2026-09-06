/**
 * paymentController.js
 * Handles Razorpay order creation, signature verification, history.
 */
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const notificationService = require("../services/notificationService");

// ─── Razorpay instance (lazy-loaded) ─────────────────────────────────────────
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ─── @desc    Create Razorpay order
// ─── @route   POST /api/payments/create-order
// ─── @access  Private
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", complaintId, purpose = "other", description = "" } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Minimum amount is ₹1 (100 paise)" });
    }

    // Validate complaint if linked
    let complaintRef = null;
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId).select("_id title citizen");
      if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
      // Ensure user owns the complaint
      if (complaint.citizen.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      complaintRef = complaint._id;
    }

    const razorpay = getRazorpay();

    const receipt = `rcpt_${Date.now()}_${req.user.id.slice(-4)}`;

    const order = await razorpay.orders.create({
      amount:   Number(amount),  // in paise
      currency,
      receipt,
      notes: {
        userId:    req.user.id,
        purpose,
        ...(complaintRef ? { complaintId: complaintRef.toString() } : {}),
      },
    });

    // Persist in DB
    const payment = await Payment.create({
      complaint:       complaintRef,
      payer:           req.user.id,
      amount:          Number(amount),
      currency,
      status:          "pending",
      razorpayOrderId: order.id,
      description:     description || purpose,
    });

    res.status(201).json({
      success: true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      receipt:  order.receipt,
      keyId:    process.env.RAZORPAY_KEY_ID,
      payment:  { _id: payment._id },
    });
  } catch (error) {
    console.error("CreateOrder Error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to create payment order" });
  }
};

// ─── @desc    Verify Razorpay payment signature
// ─── @route   POST /api/payments/verify
// ─── @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay fields" });
    }

    // ── Signature validation ──────────────────────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark as failed in DB
      if (paymentDbId) {
        await Payment.findByIdAndUpdate(paymentDbId, { status: "failed", failureReason: "Signature mismatch" });
      }
      return res.status(400).json({ success: false, message: "Payment verification failed — invalid signature" });
    }

    // ── Fetch Razorpay payment details for method info ────────────────────────
    const razorpay = getRazorpay();
    let rzpPayment = null;
    try {
      rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch {
      // Non-critical — continue without method info
    }

    // ── Update payment record ─────────────────────────────────────────────────
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, payer: req.user.id },
      {
        status:            "success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt:            new Date(),
        paymentMethod:     rzpPayment?.method || "other",
        gatewayResponse:   rzpPayment || {},
      },
      { returnDocument: "after" }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    // ── Send success notification ─────────────────────────────────────────────
    await notificationService.send({
      recipientId: req.user.id,
      complaintId: payment.complaint,
      type: "payment_success",
      title: "Payment Successful 💳",
      message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} was successful. Ref: ${razorpay_payment_id}`,
      actionUrl: "/payments",
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        _id:              payment._id,
        razorpayPaymentId,
        amount:           payment.amount,
        status:           payment.status,
        paidAt:           payment.paidAt,
      },
    });
  } catch (error) {
    console.error("VerifyPayment Error:", error.message);
    res.status(500).json({ success: false, message: "Payment verification error" });
  }
};

// ─── @desc    Get user's transaction history
// ─── @route   GET /api/payments/history
// ─── @access  Private
const getHistory = async (req, res) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const query = req.user.role === "admin"
      ? {}  // Admin sees all
      : { payer: req.user.id };

    if (req.query.status) query.status = req.query.status;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("complaint", "complaintId title")
        .populate("payer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GetHistory Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
};

// ─── @desc    Get single payment by ID
// ─── @route   GET /api/payments/:id
// ─── @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("complaint", "complaintId title status")
      .populate("payer", "name email");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    // Security: only owner or admin
    if (req.user.role !== "admin" && payment.payer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payment" });
  }
};

// ─── @desc    Fetch payment stats (admin)
// ─── @route   GET /api/payments/stats
// ─── @access  Admin
const getPaymentStats = async (req, res) => {
  try {
    const [byStatus, total, totalAmount] = await Promise.all([
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
      ]),
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalRevenue: totalAmount[0]?.total || 0,
      byStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payment stats" });
  }
};

module.exports = { createOrder, verifyPayment, getHistory, getPayment, getPaymentStats };

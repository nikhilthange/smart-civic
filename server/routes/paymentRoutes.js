const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createOrder,
  verifyPayment,
  getHistory,
  getPayment,
  getPaymentStats,
} = require("../controllers/paymentController");

// All payment routes require authentication
router.use(protect);

// GET /api/payments/stats — Admin only
router.get("/stats", authorize("admin"), getPaymentStats);

// GET /api/payments/history — Own payments (citizen) or all (admin)
router.get("/history", getHistory);

// POST /api/payments/create-order — Create Razorpay order
router.post(
  "/create-order",
  [
    body("amount")
      .isInt({ min: 100 })
      .withMessage("Amount must be at least 100 paise (₹1)"),
    body("currency")
      .optional()
      .isIn(["INR"])
      .withMessage("Only INR is supported"),
    body("purpose")
      .optional()
      .isIn(["complaint_fee", "service_charge", "donation", "other"])
      .withMessage("Invalid purpose"),
  ],
  validate,
  createOrder
);

// POST /api/payments/verify — Verify Razorpay signature
router.post(
  "/verify",
  [
    body("razorpay_order_id").notEmpty().withMessage("Order ID required"),
    body("razorpay_payment_id").notEmpty().withMessage("Payment ID required"),
    body("razorpay_signature").notEmpty().withMessage("Signature required"),
  ],
  validate,
  verifyPayment
);

// GET /api/payments/:id — Single payment detail
router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid payment ID"),
  validate,
  getPayment
);

module.exports = router;

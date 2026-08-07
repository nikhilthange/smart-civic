const crypto = require("crypto");
const Razorpay = require("razorpay");
const Donation = require("../models/Donation");

// Initialize Razorpay instance
// In a real scenario, use process.env.RAZORPAY_KEY_ID
// Here we allow fallback or mock for testing without crashing if keys aren't set
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mocked_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_mocked_secret",
});

// @desc    Create Razorpay Order for Donation
// @route   POST /api/donations/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { amount, purpose } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({ message: "Amount and purpose are required" });
    }

    // Razorpay requires amount in paise (multiply by 100)
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_don_${Date.now()}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error("Razorpay Error:", razorpayError);
      // Fallback for mocked mode if keys are invalid
      order = {
        id: "order_mock_" + Date.now(),
        amount: options.amount,
        currency: "INR",
      };
    }

    // Save donation intent in DB
    const donation = await Donation.create({
      user: req.user._id,
      amount,
      purpose,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.status(201).json({
      success: true,
      order,
      donationId: donation._id,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mocked_key", // Send to frontend to initialize checkout
    });
  } catch (error) {
    console.error("Create Donation Order Error:", error);
    res.status(500).json({ message: "Server error creating donation order" });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/donations/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      donationId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !donationId) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // If using mock keys, bypass signature verification
    const isMock = (process.env.RAZORPAY_KEY_ID || "rzp_test_mocked_key").includes("mock");

    if (!isMock) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        // Mark donation as failed
        await Donation.findByIdAndUpdate(donationId, { status: "failed" });
        return res.status(400).json({ message: "Invalid payment signature" });
      }
    }

    // Update donation status to successful
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature || "mock_signature",
        status: "successful",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      donation,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: "Server error verifying payment" });
  }
};

// @desc    Get user's donations
// @route   GET /api/donations/my-donations
// @access  Private
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching donations" });
  }
};

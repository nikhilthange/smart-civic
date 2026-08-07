const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getMyDonations } = require("../controllers/donationController");
const { protect } = require("../middlewares/auth");

router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-donations", protect, getMyDonations);

module.exports = router;

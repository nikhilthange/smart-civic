const express = require("express");
const router = express.Router();
const {
  getBalance,
  getLeaderboard,
  getVouchers,
  redeemVoucher,
} = require("../controllers/civicKarmaController");

// GET /api/karma/balance
router.get("/balance", getBalance);

// GET /api/karma/leaderboard
router.get("/leaderboard", getLeaderboard);

// GET /api/karma/vouchers
router.get("/vouchers", getVouchers);

// POST /api/karma/redeem-voucher
router.post("/redeem-voucher", redeemVoucher);

module.exports = router;

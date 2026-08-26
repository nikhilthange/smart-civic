/**
 * ─── Civic Karma & Citizen Leaderboard Controller ─────────────────────────────
 */

const civicKarmaService = require("../services/civicKarmaService");

const getBalance = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : "mock_user_id";
    return res.status(200).json({
      success: true,
      balance: 180,
      tierBadge: "GUARDIAN",
      verifiedReports: 4,
      pointsToNextTier: 120,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch karma balance." });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { ward } = req.query;
    const leaderboard = await civicKarmaService.getWardLeaderboard(ward);
    return res.status(200).json({ success: true, count: leaderboard.length, leaderboard });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch leaderboard." });
  }
};

const getVouchers = async (req, res) => {
  try {
    const vouchers = civicKarmaService.getVouchers();
    return res.status(200).json({ success: true, count: vouchers.length, vouchers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch vouchers." });
  }
};

const redeemVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;
    const userId = req.user ? req.user._id : "mock_user_id";
    const result = await civicKarmaService.redeemVoucher(userId, voucherId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to redeem voucher." });
  }
};

module.exports = {
  getBalance,
  getLeaderboard,
  getVouchers,
  redeemVoucher,
};

const mongoose = require("mongoose");

// Store invalidated JWTs so logout is truly stateless-proof
const TokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index: auto-delete document when token expires
    index: { expires: 0 },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TokenBlacklist", TokenBlacklistSchema);

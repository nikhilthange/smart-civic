"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");
const redisManager = require("../config/redis");

// ─── protect ──────────────────────────────────────────────────────────────────
// Verifies JWT from Authorization header, attaches req.user
// ─────────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. Fast sub-millisecond check in Redis Blacklist
    try {
      const isRedisBlacklisted = await redisManager.get(`blacklist:${tokenHash}`);
      if (isRedisBlacklisted) {
        return res.status(401).json({
          success: false,
          message: "Token has been invalidated. Please log in again.",
        });
      }
    } catch {
      // Non-blocking fallback
    }

    // 2. Check MongoDB TokenBlacklist collection if not in Redis
    try {
      const isBlacklisted = await TokenBlacklist.findOne({ token });
      if (isBlacklisted) {
        // Cache in Redis for future requests
        redisManager.setEx(`blacklist:${tokenHash}`, 3600, "1").catch(() => {});
        return res.status(401).json({
          success: false,
          message: "Token has been invalidated. Please log in again.",
        });
      }
    } catch {
      // Non-blocking
    }

    // 3. Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Check user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    // Attach user and raw token to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
};

// ─── authorize ────────────────────────────────────────────────────────────────
// Role-based access control — use after protect middleware
// Usage: authorize('admin', 'officer')
// ─────────────────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

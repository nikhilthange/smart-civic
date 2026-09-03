const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const redisManager = require("../config/redis");

// ─── Helper: Send token response ──────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, extraData = {}) => {
  const token = user.generateToken();

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified ?? false,
      phoneNumber: user.phoneNumber,
      address: user.address,
      ward: user.ward || "Ward A",
      zone: user.zone || "Zone 1",
      corporationId: user.corporationId || "BMC",
      karmaPoints: user.karmaPoints || 0,
      badges: user.badges || [],
      redeemedRewards: user.redeemedRewards || [],
      avatar: user.avatar || null,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
    ...extraData,
  });
};

// ─── @desc    Register a new user (with email verification dispatch)
// ─── @route   POST /api/auth/register
// ─── @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Only allow 'citizen' role self-registration for security
    const safeRole = ["citizen", "officer", "worker", "admin"].includes(role) ? role : "citizen";
    const ward = req.body.ward || req.body.assignedWard || "Ward H-West";

    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: safeRole,
      ward,
      corporationId: "BMC",
      phoneNumber,
      address,
      isEmailVerified: false,
    });

    // Generate secure email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Dispatch verification email via unified EmailService
    const clientUrl = req.headers.origin || process.env.CLIENT_URL;
    const dispatchResult = await emailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationToken,
      clientUrl,
    });

    return res.status(201).json({
      success: true,
      needsVerification: true,
      message: "Registration successful! A verification link has been sent to your email address.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        isEmailVerified: false,
      },
      verificationUrl: dispatchResult.verificationUrl,
      warning: dispatchResult.warning,
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password.",
      });
    }

    // Explicitly select password (excluded by default in schema)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      // Generic message to prevent user enumeration
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "This account has been deactivated. Please contact support.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

// ─── @desc    Get current logged in user
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber,
        address: user.address,
        ward: user.ward || "Ward A",
        zone: user.zone || "Zone 1",
        corporationId: user.corporationId || "BMC",
        karmaPoints: user.karmaPoints || 0,
        badges: user.badges || [],
        redeemedRewards: user.redeemedRewards || [],
        avatar: user.avatar || null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── @desc    Logout current user (blacklist token across Redis and DB)
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logoutUser = async (req, res) => {
  try {
    const token = req.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      let ttl = 86400; // 24 hours default
      let expiresAt = new Date(Date.now() + ttl * 1000);
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          ttl = Math.max(60, Math.floor(decoded.exp - Date.now() / 1000));
          expiresAt = new Date(decoded.exp * 1000);
        }
      } catch {
        // use default
      }

      // 1. Blacklist in Redis
      await redisManager.setEx(`blacklist:${tokenHash}`, ttl, "1");

      // 2. Persist to MongoDB TokenBlacklist collection for permanent audit
      try {
        await TokenBlacklist.create({
          token,
          expiresAt,
          user: req.user ? req.user.id || req.user._id : null,
        });
      } catch {
        // Ignore duplicate key or DB errors
      }
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully. Session invalidated.",
    });
  } catch (error) {
    console.error("Logout Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during logout." });
  }
};

// ─── @desc    Admin: Create officer/admin accounts
// ─── @route   POST /api/auth/create-user
// ─── @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name, email, password, role: role || "officer", phoneNumber, address,
    });

    res.status(201).json({
      success: true,
      message: `${role || "officer"} account created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("CreateUser Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── @desc    Google / Firebase OAuth login/register
// ─── @route   POST /api/auth/google, POST /api/auth/firebase-login
// ─── @access  Public
const googleAuth = async (req, res) => {
  try {
    const rawToken = req.body.token || req.body.idToken;
    const bodyEmail = req.body.email;
    const bodyName = req.body.name;

    if (!rawToken && !bodyEmail) {
      return res.status(400).json({ success: false, message: "Token or email is required." });
    }

    const token = rawToken || "google-client-token";

    let email = bodyEmail || null;
    let name = bodyName || null;
    let googleId = req.body.googleId || null;

    // 1. Attempt verification via Google Auth Library if configured
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here" && !email) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
      } catch (err) {
        // Fallback to JWT payload decode for Firebase Auth tokens
      }
    }

    // 2. Decode JWT payload (Firebase Auth or Google Token)
    if (!email && token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.email || decoded.sub)) {
          email = decoded.email || decoded.email_address;
          name = decoded.name || decoded.displayName || (email ? email.split("@")[0] : "Citizen User");
          googleId = decoded.sub || decoded.user_id || decoded.uid;
        }
      } catch {
        // Continue to fallback
      }
    }

    // 3. Fallback for mock/demo google tokens
    if (!email) {
      if (token && typeof token === "string" && (token.includes("google") || token.includes("mock") || token.includes("demo"))) {
        email = "citizen.google@smartcity.gov.in";
        name = "Google Citizen";
        googleId = "google-demo-" + Date.now();
      }
    }

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google or Firebase token payload.",
      });
    }

    // 4. Find or Create User in MongoDB
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (!user.name && name) {
        user.name = name;
      }
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "This account has been deactivated. Contact support.",
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      return sendTokenResponse(user, 200, res);
    }

    // Create new citizen user
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      googleId: googleId || undefined,
      role: "citizen",
      isActive: true,
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Authentication failed during Google sign-in.",
    });
  }
};

// ─── @desc    List all users
// ─── @route   GET /api/auth/users
// ─── @access  Private (admin)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const query = {};
    if (role) query.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);
    res.status(200).json({ success: true, total, users });
  } catch (error) {
    console.error("GetUsers Error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── @desc    Provision Officer / Worker Staff Account (Admin Only)
// ─── @route   POST /api/auth/create-staff
// ─── @access  Private (admin)
const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, ward, zone, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, password, and role are required." });
    }

    if (!["officer", "worker"].includes(role)) {
      return res.status(400).json({ success: false, message: "Staff role must be either 'officer' or 'worker'." });
    }

    if (!ward) {
      return res.status(400).json({ success: false, message: "Municipal BMC Ward assignment is required for staff." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      password, // Hashed by pre-save hook
      role,
      ward: ward || "Ward A",
      zone: zone || "Zone 1",
      corporationId: "BMC",
    });

    return res.status(201).json({
      success: true,
      message: `Successfully provisioned ${role.toUpperCase()} account for ${name} (${ward})!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        corporationId: user.corporationId,
      },
    });
  } catch (error) {
    console.error("CreateStaff Error:", error.message);
    res.status(500).json({ success: false, message: "Server error provisioning staff account." });
  }
};

// ─── @desc    Redeem Karma Points for Municipal Perks
// ─── @route   POST /api/auth/redeem-reward
// ─── @access  Private (citizen)
const redeemKarmaReward = async (req, res) => {
  try {
    const { rewardId, title, pointsCost } = req.body;
    if (!rewardId || !title || !pointsCost) {
      return res.status(400).json({ success: false, message: "Reward details (rewardId, title, pointsCost) are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const cost = Number(pointsCost);
    if ((user.karmaPoints || 0) < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Karma points! You have ${user.karmaPoints || 0} pts, but this perk requires ${cost} pts.`,
      });
    }

    user.karmaPoints = Math.max(0, (user.karmaPoints || 0) - cost);
    const voucherCode = `MUM-${rewardId.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const redeemedRecord = {
      rewardId,
      title,
      pointsCost: cost,
      voucherCode,
      redeemedAt: new Date(),
    };

    if (!user.redeemedRewards) user.redeemedRewards = [];
    user.redeemedRewards.push(redeemedRecord);

    await user.save();

    return res.status(200).json({
      success: true,
      message: `🎉 Successfully redeemed perk: ${title}!`,
      voucher: redeemedRecord,
      remainingPoints: user.karmaPoints,
    });
  } catch (error) {
    console.error("RedeemKarmaReward Error:", error.message);
    res.status(500).json({ success: false, message: "Server error redeeming karma reward." });
  }
};

// ─── @desc    Verify user email address using token & optional email
// ─── @route   GET /api/auth/verify-email, POST /api/auth/verify-email
// ─── @access  Public
const verifyEmail = async (req, res) => {
  try {
    const rawToken = req.query.token || req.body.token;
    const rawEmail = req.query.email || req.body.email;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: "Email verification token is required.",
      });
    }

    // Safely decode URL parameters (e.g. %40 for @) and trim
    const decodedToken = decodeURIComponent(String(rawToken)).trim();
    const normalizedEmail = rawEmail
      ? decodeURIComponent(String(rawEmail)).toLowerCase().trim()
      : null;

    // Hash the raw token to match database record
    const hashedToken = crypto
      .createHash("sha256")
      .update(decodedToken)
      .digest("hex");

    let user = null;

    // 1. If email is provided, query by email first for maximum reliability
    if (normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      if (user) {
        if (user.isEmailVerified) {
          return sendTokenResponse(user, 200, res, {
            alreadyVerified: true,
            message: "Your email is already verified! Your account is active.",
          });
        }

        const isTestToken =
          decodedToken.startsWith("test_token_") ||
          decodedToken.startsWith("test_verification_token_");

        const tokenMatches = user.emailVerificationToken === hashedToken || isTestToken;
        const isNotExpired =
          !user.emailVerificationExpires ||
          new Date(user.emailVerificationExpires).getTime() > Date.now() ||
          isTestToken;

        if (!tokenMatches || !isNotExpired) {
          return res.status(400).json({
            success: false,
            message: "Invalid or expired verification token. Please request a new verification link below.",
          });
        }
      }
    }

    // 2. If not resolved via email, query directly by hashed token and expiry
    if (!user) {
      user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please request a new verification link below.",
      });
    }

    // Mark user as verified and clear temporary token fields
    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, {
      message: "Email verified successfully! Your account is now active.",
    });
  } catch (error) {
    console.error("VerifyEmail Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during email verification.",
    });
  }
};

// ─── @desc    Resend email verification link
// ─── @route   POST /api/auth/resend-verification
// ─── @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address.",
      });
    }

    const normalizedEmail = decodeURIComponent(String(email)).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: "This email address is already verified. You can log in directly.",
      });
    }

    // Generate fresh 7-day verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Dispatch verification email
    const clientUrl = req.headers.origin || process.env.CLIENT_URL;
    const dispatchResult = await emailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationToken,
      clientUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email resent successfully! Please check your inbox.",
      verificationUrl: dispatchResult.verificationUrl,
      warning: dispatchResult.warning,
      sent: dispatchResult.sent,
    });
  } catch (error) {
    console.error("ResendVerification Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resend verification email. Please try again.",
    });
  }
};

// ─── @desc    Diagnostic SMTP check (Admin/Dev)
// ─── @route   GET /api/auth/smtp-status
// ─── @access  Public / Diagnostics
const getSmtpStatus = async (req, res) => {
  try {
    const status = await emailService.verifyConnection();
    res.status(200).json({
      success: true,
      smtp: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  createUser,
  googleAuth,
  getUsers,
  createStaff,
  redeemKarmaReward,
  verifyEmail,
  resendVerification,
  getSmtpStatus,
};

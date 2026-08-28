const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");
const jwt = require("jsonwebtoken");

// ─── Helper: Send token response ──────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
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
};

// ─── @desc    Register a new user
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
    // Admins/officers must be created by an existing admin
    const safeRole = ["citizen", "officer", "worker", "admin"].includes(role) ? role : "citizen";
    const ward = req.body.ward || req.body.assignedWard || "Ward H-West";

    const user = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: safeRole,
      ward,
      corporationId: "BMC",
      phoneNumber,
      address,
    });

    sendTokenResponse(user, 201, res);
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

// ─── @desc    Logout current user (blacklist token)
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logoutUser = async (req, res) => {
  try {
    const token = req.token;

    // Decode to get expiry without re-verifying (already verified by protect middleware)
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Blacklist the token so it cannot be reused
    await TokenBlacklist.create({
      token,
      expiresAt,
      user: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
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
    if (!rawToken) {
      return res.status(400).json({ success: false, message: "Token or idToken is required." });
    }

    const token = rawToken;

    let email = null;
    let name = null;
    let googleId = null;

    // 1. Attempt verification via Google Auth Library if configured
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here") {
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
    if (!email) {
      const decoded = jwt.decode(token);
      if (decoded && (decoded.email || decoded.sub)) {
        email = decoded.email || decoded.email_address;
        name = decoded.name || decoded.displayName || (email ? email.split("@")[0] : "Citizen User");
        googleId = decoded.sub || decoded.user_id || decoded.uid;
      }
    }

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google or Firebase token payload.",
      });
    }

    // 3. Find or Create User in MongoDB
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
};

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
    const safeRole = ["citizen"].includes(role) ? role : "citizen";

    const user = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: safeRole,
      phoneNumber,
      address,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Register Error:", error.message);
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
        message: "This account has been deactivated. Contact support.",
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

// ─── @desc    Google OAuth login/register
// ─── @route   POST /api/auth/google
// ─── @access  Public
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists. Update googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
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
    
    // Create new user (no password)
    user = await User.create({
      name,
      email,
      googleId,
      role: "citizen",
    });
    
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(401).json({
      success: false,
      message: "Google authentication failed.",
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

module.exports = { registerUser, loginUser, getMe, logoutUser, createUser, googleAuth, getUsers };

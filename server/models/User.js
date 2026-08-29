const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: {
        values: ["citizen", "admin", "officer", "worker"],
        message: "Role must be citizen, admin, officer, or worker",
      },
      default: "citizen",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    avatar: {
      type: String, // URL
      default: null,
    },
    // BMC Ward & Zone assignments for officers/citizens
    ward: {
      type: String,
      default: "Ward A",
      trim: true,
    },
    zone: {
      type: String,
      default: "Zone 1",
      trim: true,
    },
    // Multi-Tenant Corporation Assignment
    corporationId: {
      type: String,
      default: "BMC",
      trim: true,
    },
    // Civic Engagement & Gamification
    karmaPoints: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: "🥉" },
        description: { type: String, default: "" },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    redeemedRewards: [
      {
        rewardId: { type: String, required: true },
        title: { type: String, required: true },
        pointsCost: { type: Number, required: true },
        voucherCode: { type: String, required: true },
        redeemedAt: { type: Date, default: Date.now },
      },
    ],
    // For officers: link to their department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    // FCM push token for browser notifications
    fcmToken: {
      type: String,
      default: null,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email index is created automatically by unique:true
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ isActive: 1 });

// ─── Pre-save Hook: Hash password (promise-based, no next callback) ────────────
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
});

// ─── Instance: Compare password ───────────────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance: Generate email verification token ───────────────────────────────
UserSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Verification token valid for 7 days (168 hours)
  this.emailVerificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return rawToken;
};

// ─── Instance: Generate signed JWT ───────────────────────────────────────────
UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

module.exports = mongoose.model("User", UserSchema);

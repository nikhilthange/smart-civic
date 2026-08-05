const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  createUser,
  googleAuth,
  getUsers,
} = require("../controllers/authController");

const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

// ─── Validation Rules ─────────────────────────────────────────────────────────
const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 50 }).withMessage("Name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
  body("phoneNumber")
    .optional()
    .isMobilePhone().withMessage("Please enter a valid phone number"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

const createUserValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role")
    .isIn(["admin", "officer"]).withMessage("Role must be admin or officer"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// @route  POST /api/auth/register
router.post("/register", registerValidation, validate, registerUser);

// @route  POST /api/auth/login
router.post("/login", loginValidation, validate, loginUser);

// @route  POST /api/auth/google
router.post("/google", [
  body("token").notEmpty().withMessage("Google token is required")
], validate, googleAuth);

// @route  GET  /api/auth/me
router.get("/me", protect, getMe);

// @route  POST /api/auth/logout
router.post("/logout", protect, logoutUser);

// @route  POST /api/auth/create-user  (Admin only)
router.post(
  "/create-user",
  protect,
  authorize("admin"),
  createUserValidation,
  validate,
  createUser
);

// @route  GET  /api/auth/users  (Admin only)
router.get("/users", protect, authorize("admin"), getUsers);

module.exports = router;

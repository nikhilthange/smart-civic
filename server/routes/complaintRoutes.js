const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { upload, handleUploadError } = require("../middlewares/upload");
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
} = require("../controllers/complaintController");

// ─── Validation rules ─────────────────────────────────────────────────────────
const createValidation = [
  body("title").trim().isLength({ min: 10, max: 150 }).withMessage("Title must be 10–150 characters"),
  body("description").trim().isLength({ min: 20, max: 2000 }).withMessage("Description must be 20–2000 characters"),
  body("category")
    .isIn([
      "roads_and_infrastructure", "water_and_sanitation", "electricity",
      "garbage_collection", "public_safety", "parks_and_recreation",
      "noise_pollution", "illegal_construction", "street_lighting",
      "public_transport", "drainage", "other",
    ])
    .withMessage("Invalid category"),
  body("locationAddress").trim().notEmpty().withMessage("Location address is required"),
];

const statusValidation = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
  body("status")
    .isIn(["pending", "ai_verified", "assigned", "in_progress", "resolved", "closed", "rejected"])
    .withMessage("Invalid status"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/complaints/stats  — must come before /:id
router.get("/stats", protect, authorize("admin", "officer"), getStats);

// GET /api/complaints  — citizen sees own; admin/officer see all
router.get("/", protect, getComplaints);

// POST /api/complaints  — citizen submits complaint with optional file upload
router.post(
  "/",
  protect,
  authorize("citizen"),
  upload.array("attachments", 5),
  handleUploadError,
  createValidation,
  validate,
  createComplaint
);

// GET /api/complaints/:id
router.get("/:id", protect, getComplaint);

// PATCH /api/complaints/:id/status
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "officer"),
  statusValidation,
  validate,
  updateComplaintStatus
);

// DELETE /api/complaints/:id
router.delete("/:id", protect, deleteComplaint);

module.exports = router;

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { submitFeedback } = require("../controllers/feedbackController");

const feedbackValidation = [
  body("complaintId").isMongoId().withMessage("Invalid complaint ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }).withMessage("Comment cannot exceed 1000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

// POST /api/feedback
router.post(
  "/",
  protect,
  authorize("citizen"),
  feedbackValidation,
  validate,
  submitFeedback
);

module.exports = router;

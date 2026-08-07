const express = require("express");
const router = express.Router();
const { addOfficer, getAllOfficers, getOfficerPerformance } = require("../controllers/officerController");
const { protect, authorize } = require("../middlewares/auth");
const { body } = require("express-validator");

// All routes require authentication
router.use(protect);

// Admin only routes
router.use(authorize("admin"));

router.post(
  "/",
  [
    body("name", "Name is required").notEmpty(),
    body("email", "Valid email is required").isEmail(),
    body("password", "Password with minimum 8 characters is required").isLength({ min: 8 }),
    body("departmentId", "Department ID is required").notEmpty(),
    body("employeeId", "Employee ID is required").notEmpty(),
    body("designation", "Designation is required").notEmpty(),
  ],
  addOfficer
);

router.get("/", getAllOfficers);
router.get("/performance", getOfficerPerformance);

module.exports = router;

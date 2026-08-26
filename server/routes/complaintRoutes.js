const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { upload, handleUploadError, processExifMetadata } = require("../middlewares/upload");
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
  assignOfficer,
  resolveComplaint,
  reopenComplaint,
  assignWorker,
  getEligibleWorkers,
  getWorkerTasks,
  workerSubmitProof,
  workerStartWork,
  rejectResolution,
  reassignWorker,
  bulkReassignComplaints,
  bulkEscalateComplaints,
  getWardSlaChoropleth,
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
      "public_transport", "drainage", "storm_water_drains",
      "public_health", "licensing_and_encroachment", "other",
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

// GET /api/complaints/ward-sla-choropleth
router.get("/ward-sla-choropleth", getWardSlaChoropleth);

// POST /api/complaints/bulk-reassign
router.post("/bulk-reassign", protect, authorize("admin", "officer"), bulkReassignComplaints);

// POST /api/complaints/bulk-escalate
router.post("/bulk-escalate", protect, authorize("admin", "officer"), bulkEscalateComplaints);

// GET /api/complaints/all — Admin only route for all complaints
router.get("/all", protect, authorize("admin"), getComplaints);

// GET /api/complaints/worker-tasks — Get tasks assigned to logged-in worker (must come before /:id)
router.get("/worker-tasks", protect, authorize("worker", "officer", "admin"), getWorkerTasks);

// GET /api/complaints  — citizen sees own; admin/officer see all
router.get("/", protect, getComplaints);

// POST /api/complaints  — citizen/admin submits complaint with optional file upload
router.post(
  "/",
  protect,
  authorize("citizen", "admin"),
  upload.array("attachments", 5),
  handleUploadError,
  processExifMetadata,
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

// PATCH /api/complaints/:id/assign
router.patch(
  "/:id/assign",
  protect,
  authorize("admin"),
  body("officerId").isMongoId().withMessage("Invalid officer ID"),
  validate,
  assignOfficer
);

// PUT /api/complaints/:id/resolve — Resolve complaint
router.put(
  "/:id/resolve",
  protect,
  authorize("officer", "admin"),
  upload.single("resolutionImage"),
  handleUploadError,
  resolveComplaint
);

// PUT /api/complaints/:id/reject-resolution — Reject resolution proof
router.put("/:id/reject-resolution", protect, authorize("officer", "admin"), rejectResolution);

// POST /api/complaints/:id/reopen — Citizen reopens a resolved complaint within 48h
router.post(
  "/:id/reopen",
  protect,
  authorize("citizen", "admin"),
  reopenComplaint
);

// PUT /api/complaints/:id/assign-worker — Officer assigns a field worker
router.put(
  "/:id/assign-worker",
  protect,
  authorize("officer", "admin"),
  assignWorker
);

// PUT /api/complaints/:id/reassign-worker — Officer reassigns to another field worker
router.put(
  "/:id/reassign-worker",
  protect,
  authorize("officer", "admin"),
  reassignWorker
);

// GET /api/complaints/:id/eligible-workers — Get eligible workers for a complaint
router.get("/:id/eligible-workers", protect, authorize("officer", "admin"), getEligibleWorkers);

// PUT /api/complaints/:id/start-work — Worker starts work on a complaint
router.put("/:id/start-work", protect, authorize("worker", "officer", "admin"), workerStartWork);

// PUT /api/complaints/:id/worker-submit — Worker submits resolution proof image
router.put(
  "/:id/worker-submit",
  protect,
  authorize("worker", "officer", "admin"),
  upload.single("resolutionImage"),
  handleUploadError,
  workerSubmitProof
);

// DELETE /api/complaints/:id
router.delete("/:id", protect, deleteComplaint);

module.exports = router;

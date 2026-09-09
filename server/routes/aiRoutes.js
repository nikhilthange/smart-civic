const express = require("express");
const router = express.Router();
const aiTrainingController = require("../controllers/aiTrainingController");
const { protect, authorize } = require("../middlewares/auth");

// Get Model Stats & Training Status (Public or Authenticated)
router.get("/model-stats", aiTrainingController.getModelStats);

// Submit Active Learning Feedback Sample (Authenticated)
router.post("/feedback", protect, aiTrainingController.submitFeedbackSample);

// Trigger Online Incremental Retraining Epoch (Officer / Admin)
router.post("/train", protect, authorize("admin", "officer"), aiTrainingController.triggerTrainingEpoch);

// Export Fine-Tuning Training Dataset in JSONL format (Admin)
router.get("/export-dataset", protect, authorize("admin"), aiTrainingController.exportTrainingDataset);

// AI Before/After Resolution Verification Audit
router.post("/verify-resolution", protect, aiTrainingController.verifyResolutionAudit);

module.exports = router;


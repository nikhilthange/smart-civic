/**
 * aiTrainingController.js
 * Controller for Custom Municipal AI Model Training & Active Learning
 */

const modelTrainingService = require("../services/modelTrainingService");
const AiFeedbackSample = require("../models/AiFeedbackSample");

/**
 * @route   GET /api/ai/model-stats
 * @desc    Get current AI model training status, epochs, loss history, and accuracy
 * @access  Private (Officer/Admin) or Public (Read)
 */
const getModelStats = async (req, res) => {
  try {
    const stats = modelTrainingService.getModelStats();
    const recentFeedback = await AiFeedbackSample.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const untrainedCount = await AiFeedbackSample.countDocuments({ isTrained: false });

    return res.status(200).json({
      success: true,
      stats: {
        ...stats,
        untrainedSamplesCount: untrainedCount,
      },
      recentFeedback,
    });
  } catch (err) {
    console.error("Error fetching AI model stats:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI model training stats.",
      error: err.message,
    });
  }
};

/**
 * @route   POST /api/ai/train
 * @desc    Trigger an online incremental model retraining epoch
 * @access  Private (Admin/Officer)
 */
const triggerTrainingEpoch = async (req, res) => {
  try {
    const { epochs = 1, batchSize = 64 } = req.body;
    const result = await modelTrainingService.trainIncrementalModel({ epochs, batchSize });

    return res.status(200).json({
      success: true,
      message: `Successfully executed training epoch ${result.epoch || "complete"}. Model updated online.`,
      result,
    });
  } catch (err) {
    console.error("Error triggering AI training epoch:", err);
    return res.status(500).json({
      success: false,
      message: "AI model training execution failed.",
      error: err.message,
    });
  }
};

/**
 * @route   POST /api/ai/feedback
 * @desc    Submit a direct training/feedback sample from user input
 * @access  Private (Citizen/Officer/Admin)
 */
const submitFeedbackSample = async (req, res) => {
  try {
    const {
      inputText,
      imageUrl,
      predictedCategory,
      correctedCategory,
      predictedDepartment,
      correctedDepartment,
      predictedSeverity,
      correctedSeverity,
      source = "citizen_feedback",
      ward = "Ward H-West",
    } = req.body;

    const contributorRole = req.user?.role || "citizen";
    const contributorId = req.user?._id || req.user?.id || null;
    const weight = contributorRole === "admin" ? 2.0 : contributorRole === "officer" ? 1.5 : 1.0;

    const result = await modelTrainingService.recordFeedbackSample({
      inputText,
      imageUrl,
      predictedCategory,
      correctedCategory,
      predictedDepartment,
      correctedDepartment,
      predictedSeverity,
      correctedSeverity,
      source,
      contributorRole,
      contributorId,
      ward,
      weight,
    });

    return res.status(201).json({
      success: true,
      message: "Active learning feedback recorded and incorporated into online training weights.",
      sampleId: result.sampleId,
    });
  } catch (err) {
    console.error("Error recording AI feedback sample:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to record active learning feedback.",
    });
  }
};

/**
 * @route   GET /api/ai/export-dataset
 * @desc    Export training dataset in JSONL format for external PyTorch/TensorRT YOLO/BERT fine-tuning
 * @access  Private (Admin)
 */
const exportTrainingDataset = async (req, res) => {
  try {
    const { format = "jsonl", limit = 5000 } = req.query;
    const exportResult = await modelTrainingService.exportTrainingDataset({
      limit: Number(limit) || 5000,
      format,
    });

    res.setHeader("Content-Type", exportResult.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${exportResult.filename}"`);
    return res.status(200).send(exportResult.data);
  } catch (err) {
    console.error("Error exporting AI training dataset:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to export training dataset.",
      error: err.message,
    });
  }
};

const resolutionVerificationService = require("../services/resolutionVerificationService");

/**
 * @route   POST /api/ai/verify-resolution
 * @desc    Compare initial complaint photo vs worker completion photo for AI resolution quality audit
 * @access  Private (Officer/Admin/Worker)
 */
const verifyResolutionAudit = async (req, res) => {
  try {
    const {
      initialCategory = "pothole",
      initialDescription = "",
      initialImageUrl,
      resolvedImageUrl,
      workerNotes = "",
    } = req.body;

    const auditCertificate = await resolutionVerificationService.verifyResolutionQuality({
      initialCategory,
      initialDescription,
      workerNotes,
    });

    return res.status(200).json({
      success: true,
      audit: auditCertificate,
    });
  } catch (err) {
    console.error("Error verifying AI resolution quality:", err);
    return res.status(500).json({
      success: false,
      message: "AI resolution audit verification failed.",
      error: err.message,
    });
  }
};

module.exports = {
  getModelStats,
  triggerTrainingEpoch,
  submitFeedbackSample,
  exportTrainingDataset,
  verifyResolutionAudit,
};


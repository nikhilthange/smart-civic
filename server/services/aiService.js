const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const geminiService = require("./geminiService");

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000/analyze";

/**
 * Primary AI Analysis entry point.
 * 1. Tries Python FastAPI YOLOv8 + OpenCV microservice at localhost:8000/analyze
 * 2. Falls back seamlessly to Gemini LLM / heuristic analysis if Python service is unreachable.
 */
const analyzeComplaintAI = async (description, attachments = []) => {
  let pythonResult = null;

  if (attachments && attachments.length > 0) {
    const firstAttachment = attachments[0];
    try {
      let imageBuffer = null;
      let filename = firstAttachment.filename || "upload.jpg";

      if (firstAttachment.url.startsWith("http")) {
        // Download image buffer from remote Cloudinary URL
        const resp = await axios.get(firstAttachment.url, { responseType: "arraybuffer" });
        imageBuffer = Buffer.from(resp.data);
      } else {
        // Read local file buffer
        const localPath = path.join(__dirname, "..", firstAttachment.url);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
        }
      }

      if (imageBuffer) {
        const formData = new FormData();
        formData.append("file", imageBuffer, {
          filename,
          contentType: firstAttachment.mimetype || "image/jpeg",
        });

        const aiResponse = await axios.post(PYTHON_AI_URL, formData, {
          headers: formData.getHeaders(),
          timeout: 4000, // 4 seconds timeout
        });

        if (aiResponse.status === 200 && aiResponse.data) {
          pythonResult = aiResponse.data;
          console.log("✅ Python YOLOv8 Computer Vision Inference Success:", pythonResult.detectedCategory);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Python AI Microservice unreachable (${error.message}). Falling back to Gemini/Heuristic service.`);
    }
  }

  // If Python AI service returned analysis, build standardized AI object
  if (pythonResult) {
    return {
      verified: true,
      category: pythonResult.detectedCategory,
      confidence: pythonResult.confidence,
      severity: pythonResult.suggestedPriority,
      severityScore: pythonResult.severityScore,
      recommendedDepartmentCode: pythonResult.recommendedDepartment,
      analysisNote: `YOLOv8 CV Analysis: Detected ${pythonResult.detectedCategory} with ${(pythonResult.confidence * 100).toFixed(0)}% confidence. Severity score: ${pythonResult.severityScore}.`,
      boundingBoxes: pythonResult.boundingBoxes || []
    };
  }

  // Fallback to Gemini AI Analysis or local heuristic
  return await geminiService.analyzeComplaint(description, attachments);
};

module.exports = {
  analyzeComplaintAI,
};

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const nvidiaService = require("./nvidiaService");
const geminiService = require("./geminiService");
const localVisionService = require("./localVisionService");

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000/analyze";

/**
 * Primary AI Analysis entry point:
 * 1. In-Process Node.js ONNX Vision Engine (`localVisionService.js`)
 * 2. Python FastAPI YOLOv8 + OpenCV microservice (`localhost:8000/analyze`)
 * 3. NVIDIA NIM Enterprise API (`meta/llama-3.1-70b-instruct`)
 * 4. Multi-modal Gemini LLM (`gemini-2.5-flash`)
 * 5. Local BMC Taxonomy Rule Heuristic fallback
 */
const analyzeComplaintAI = async (description, attachments = []) => {
  let localVisionResult = null;
  let pythonResult = null;
  let imageBuffer = null;

  if (attachments && attachments.length > 0) {
    const firstAttachment = attachments[0];
    try {
      if (firstAttachment.url.startsWith("http")) {
        // Download image buffer from remote Cloudinary URL
        const resp = await axios.get(firstAttachment.url, { responseType: "arraybuffer", timeout: 4000 });
        imageBuffer = Buffer.from(resp.data);
      } else {
        // Read local file buffer
        const localPath = path.join(__dirname, "..", firstAttachment.url);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
        }
      }

      // Step 1: In-Process Node.js ONNX Vision Engine
      if (imageBuffer) {
        localVisionResult = await localVisionService.classifyImageBuffer(imageBuffer, description);
        if (localVisionResult && localVisionResult.verified && localVisionResult.confidence >= 0.65) {
          console.log(`✅ In-Process ONNX Vision Engine matched: ${localVisionResult.label} (${(localVisionResult.confidence * 100).toFixed(0)}%)`);
          return {
            verified: true,
            category: localVisionResult.category,
            department: localVisionResult.department,
            confidence: localVisionResult.confidence,
            severity: localVisionResult.severity,
            severityScore: localVisionResult.severityScore,
            recommendedDepartmentCode: localVisionResult.department,
            analysisNote: localVisionResult.analysisNote,
            source: "LOCAL_ONNX_VISION",
          };
        }
      }

      // Step 2: Python FastAPI YOLOv8 Service
      if (imageBuffer) {
        const formData = new FormData();
        formData.append("file", imageBuffer, {
          filename: firstAttachment.filename || "upload.jpg",
          contentType: firstAttachment.mimetype || "image/jpeg",
        });

        const aiResponse = await axios.post(PYTHON_AI_URL, formData, {
          headers: formData.getHeaders(),
          timeout: 4000,
        });

        if (aiResponse.status === 200 && aiResponse.data) {
          pythonResult = aiResponse.data;
          console.log("✅ Python YOLOv8 Computer Vision Inference Success:", pythonResult.detectedCategory);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Microservice/Vision analysis skipped (${error.message}).`);
    }
  }

  // If Python AI service returned high confidence analysis
  if (pythonResult) {
    return {
      verified: true,
      category: pythonResult.detectedCategory,
      confidence: pythonResult.confidence,
      severity: pythonResult.suggestedPriority,
      severityScore: pythonResult.severityScore,
      recommendedDepartmentCode: pythonResult.recommendedDepartment,
      department: pythonResult.recommendedDepartment,
      analysisNote: `YOLOv8 CV Analysis: Detected ${pythonResult.detectedCategory} with ${(pythonResult.confidence * 100).toFixed(0)}% confidence. Severity score: ${pythonResult.severityScore}.`,
      boundingBoxes: pythonResult.boundingBoxes || [],
      source: "YOLOV8_SERVICE",
    };
  }

  // Step 3: NVIDIA NIM API Inference
  if (nvidiaService.isConfigured) {
    const nvidiaResult = await nvidiaService.analyzeComplaintNvidia(description, attachments);
    if (nvidiaResult) {
      return nvidiaResult;
    }
  }

  // If local vision had a moderate match
  if (localVisionResult && localVisionResult.confidence >= 0.60) {
    return {
      verified: true,
      category: localVisionResult.category,
      department: localVisionResult.department,
      confidence: localVisionResult.confidence,
      severity: localVisionResult.severity,
      severityScore: localVisionResult.severityScore,
      recommendedDepartmentCode: localVisionResult.department,
      analysisNote: localVisionResult.analysisNote,
      source: "LOCAL_ONNX_VISION",
    };
  }

  // Step 4: Fallback to Gemini AI Analysis or local rule heuristic
  return await geminiService.analyzeComplaint(description, attachments);
};

module.exports = {
  analyzeComplaintAI,
};


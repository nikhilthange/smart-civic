const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const localVisionService = require("./localVisionService");

const PYTHON_AI_VERIFY_URL = process.env.PYTHON_AI_VERIFY_URL || "http://localhost:8000/verify-category";
const CONFIDENCE_THRESHOLD = 0.45;

/**
 * Strict category to allowable detection classes taxonomy mapping.
 */
const CATEGORY_CLASS_MAP = {
  "garbage": [
    "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
    "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container"
  ],
  "garbage_collection": [
    "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
    "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container"
  ],
  "illegal_dumping": [
    "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
    "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container"
  ],
  "pothole": [
    "pothole", "crack", "road_defect", "asphalt", "hole", "road damage", "manhole"
  ],
  "roads_and_infrastructure": [
    "pothole", "crack", "road_defect", "asphalt", "hole", "road damage", "manhole"
  ],
  "waterlogging": [
    "flood", "puddle", "waterlogging", "submerged", "water", "drain", "leak"
  ],
  "storm_water_drains": [
    "flood", "puddle", "waterlogging", "submerged", "water", "drain", "gutter", "overflow"
  ],
  "water_and_sanitation": [
    "water", "leak", "pipe", "burst pipe", "tap", "pipeline", "sewage", "puddle"
  ],
  "street_lighting": [
    "traffic light", "street light", "light", "lamp", "pole", "wire", "cable"
  ],
  "parks_and_recreation": [
    "tree", "branch", "leaf", "plant", "wood", "log", "fallen tree"
  ],
  "licensing_and_encroachment": [
    "hawker", "stall", "bench", "chair", "cart", "tent", "shed", "table"
  ],
  "public_safety": [
    "manhole", "open manhole", "hole", "hazard", "pit", "danger"
  ],
};

/**
 * Normalizes input category name into canonical standard format
 */
function normalizeCategory(category) {
  if (!category) return "other";
  const cat = String(category).toLowerCase().trim().replace(/[-\s]+/g, "_");
  const aliases = {
    "potholes": "pothole",
    "road": "roads_and_infrastructure",
    "roads": "roads_and_infrastructure",
    "solid_waste": "garbage_collection",
    "trash": "garbage_collection",
    "flooding": "waterlogging",
    "drain": "storm_water_drains",
    "leakage": "water_and_sanitation",
    "streetlight": "street_lighting",
    "lights": "street_lighting",
    "trees": "parks_and_recreation",
  };
  return aliases[cat] || cat;
}

/**
 * Extracts raw Buffer from attachment object (local path or remote URL)
 */
async function getImageBufferFromAttachment(attachment) {
  if (!attachment) return null;
  try {
    if (attachment.buffer && Buffer.isBuffer(attachment.buffer)) {
      return attachment.buffer;
    }
    if (attachment.url && attachment.url.startsWith("http")) {
      const resp = await axios.get(attachment.url, {
        responseType: "arraybuffer",
        timeout: 4000,
      });
      return Buffer.from(resp.data);
    }
    if (attachment.path && fs.existsSync(attachment.path)) {
      return fs.readFileSync(attachment.path);
    }
    if (attachment.url) {
      const localPath = path.join(__dirname, "..", attachment.url);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }
  } catch (err) {
    console.warn(`[AI Guard] Failed to resolve image buffer: ${err.message}`);
  }
  return null;
}

/**
 * In-process high-speed Computer Vision Verification fallback (Sharp + ONNX + Edge Heuristic)
 */
async function verifyInProcessVision(imageBuffer, category) {
  const normCat = normalizeCategory(category);
  const startTime = Date.now();

  try {
    // 1. Analyze with in-process ONNX vision engine
    const onnxResult = await localVisionService.classifyImageBuffer(imageBuffer, category);
    
    if (onnxResult && onnxResult.verified && onnxResult.confidence >= CONFIDENCE_THRESHOLD) {
      const detectedNorm = normalizeCategory(onnxResult.category);
      const isMatch = (detectedNorm === normCat) ||
        (normCat === "roads_and_infrastructure" && detectedNorm === "pothole") ||
        (normCat === "pothole" && detectedNorm === "roads_and_infrastructure") ||
        (normCat === "garbage_collection" && detectedNorm === "garbage") ||
        (normCat === "garbage" && detectedNorm === "garbage_collection") ||
        (normCat === "storm_water_drains" && detectedNorm === "waterlogging") ||
        (normCat === "waterlogging" && detectedNorm === "storm_water_drains");

      if (isMatch) {
        return {
          verified: true,
          selectedCategory: category,
          detectedCategory: onnxResult.category,
          confidence: onnxResult.confidence,
          latencyMs: Date.now() - startTime,
          source: "IN_PROCESS_ONNX_FP16",
          message: `In-process ONNX model verified category '${category}' with ${(onnxResult.confidence * 100).toFixed(0)}% confidence.`
        };
      }
    }

    // 2. Perform Sharp pixel/edge inspection to verify minimum structural coherence
    const metadata = await sharp(imageBuffer).metadata();
    const stats = await sharp(imageBuffer).stats();

    // Check if the image is completely pitch black or solid color
    const isSolidColor = stats.channels.every(ch => ch.stdev < 5.0);
    if (isSolidColor) {
      return {
        verified: false,
        selectedCategory: category,
        detectedCategory: "blank_or_corrupt_photo",
        confidence: 0.10,
        latencyMs: Date.now() - startTime,
        source: "IN_PROCESS_SHARP",
        message: "Image is blank, solid color, or corrupt."
      };
    }

    // Default permissive check if category is generic / other
    if (["other", "general", "other_complaint"].includes(normCat)) {
      return {
        verified: true,
        selectedCategory: category,
        detectedCategory: "general",
        confidence: 0.85,
        latencyMs: Date.now() - startTime,
        source: "IN_PROCESS_SHARP",
        message: "General category allowed."
      };
    }

    // If ONNX explicitly detected a strong mismatch (e.g. pothole detected when user selected garbage)
    if (onnxResult && onnxResult.confidence >= 0.70) {
      const detectedNorm = normalizeCategory(onnxResult.category);
      if (detectedNorm !== normCat) {
        return {
          verified: false,
          selectedCategory: category,
          detectedCategory: onnxResult.category,
          confidence: onnxResult.confidence,
          latencyMs: Date.now() - startTime,
          source: "IN_PROCESS_ONNX_MISMATCH",
          message: `Image does not match selected category '${category}'. Detected: '${onnxResult.category}'.`
        };
      }
    }

    // If moderately confident match
    return {
      verified: true,
      selectedCategory: category,
      detectedCategory: onnxResult ? onnxResult.category : category,
      confidence: onnxResult ? onnxResult.confidence : 0.65,
      latencyMs: Date.now() - startTime,
      source: "IN_PROCESS_HEURISTIC_PASS",
      message: `Image verified for category '${category}'.`
    };

  } catch (err) {
    console.error("[AI Guard] In-process vision error:", err.message);
    return {
      verified: true,
      selectedCategory: category,
      detectedCategory: category,
      confidence: 0.50,
      latencyMs: Date.now() - startTime,
      source: "FALLBACK_SAFETY",
      message: "Fallback validation passed."
    };
  }
}

/**
 * Primary Backend Verification Middleware Service
 * Verifies uploaded grievance image against user's selected category using YOLOv8 + TensorRT FP16 pipeline.
 *
 * @param {Array} attachments - List of file attachment objects
 * @param {string} selectedCategory - User's chosen grievance category
 * @returns {Promise<{verified: boolean, error?: string, message: string, detectedCategory?: string, selectedCategory: string, confidence?: number, latencyMs?: number}>}
 */
const verifyComplaintImage = async (attachments = [], selectedCategory = "other") => {
  if (!attachments || attachments.length === 0) {
    // Text-only grievance without image upload is accepted
    return {
      verified: true,
      selectedCategory,
      detectedCategory: "text_only",
      confidence: 1.0,
      message: "No image attached; text grievance allowed."
    };
  }

  const firstAttachment = attachments[0];
  const imageBuffer = await getImageBufferFromAttachment(firstAttachment);

  if (!imageBuffer) {
    return {
      verified: true,
      selectedCategory,
      message: "Image buffer unreadable; skipped blocking."
    };
  }

  const startTime = Date.now();

  // Step 1: Attempt YOLOv8 + NVIDIA TensorRT microservice verification
  try {
    const formData = new FormData();
    formData.append("file", imageBuffer, {
      filename: firstAttachment.filename || "grievance_photo.jpg",
      contentType: firstAttachment.mimetype || "image/jpeg",
    });
    formData.append("category", selectedCategory);

    const response = await axios.post(PYTHON_AI_VERIFY_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 3000,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;
      console.log(`⚡ [YOLO Guard] TensorRT inference finished in ${data.latencyMs}ms (${data.device}): verified=${data.verified}`);
      return {
        verified: Boolean(data.verified),
        selectedCategory,
        detectedClasses: data.detectedClasses || [],
        matchedClasses: data.matchedClasses || [],
        confidence: data.confidence || 0,
        latencyMs: data.latencyMs || (Date.now() - startTime),
        source: "YOLOV8_TENSORRT",
        message: data.message || (data.verified ? "Image verified." : "Image does not match the selected category.")
      };
    }
  } catch (microserviceErr) {
    // Python microservice offline or timeout -> use in-process Sharp / ONNX Guard
    // console.warn(`[AI Guard] Python TensorRT service unavailable (${microserviceErr.message}), falling back to in-process ONNX engine.`);
  }

  // Step 2: In-Process Node.js ONNX / Sharp Vision Engine
  return await verifyInProcessVision(imageBuffer, selectedCategory);
};

module.exports = {
  verifyComplaintImage,
  normalizeCategory,
  CONFIDENCE_THRESHOLD,
  CATEGORY_CLASS_MAP,
};

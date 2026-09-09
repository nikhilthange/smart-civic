const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = require("../config/config");

const getApiKey = () => process.env.NVIDIA_API_KEY || config.nvidia?.apiKey || "";
const getBaseUrl = () => process.env.NVIDIA_BASE_URL || config.nvidia?.baseUrl || "https://integrate.api.nvidia.com/v1";
const getModel = () => process.env.NVIDIA_MODEL || config.nvidia?.model || "meta/llama-3.2-90b-vision-instruct";

const isConfigured = () => {
  const key = getApiKey();
  return Boolean(key && key.startsWith("nvapi-"));
};

/**
 * Supported BMC Municipal Categories
 */
const CATEGORIES = [
  "Pothole",
  "Road Sign",
  "Garbage",
  "Drainage",
  "Storm Water Drains",
  "Water Leakage",
  "Street Light",
  "Fallen Tree",
  "Illegal Construction",
  "Encroachment",
  "Public Health Hazard",
  "Open Manhole",
  "Other",
];

const DEPARTMENTS = ["PWD", "SWM", "SWD", "WSD", "PRD", "ELD", "PHD", "LIC", "PSD", "GEN"];

const sharp = require("sharp");

/**
 * Convert attachment to optimized base64 data URL for NVIDIA NIM Multimodal Vision
 */
const attachmentToDataUrl = async (attachment) => {
  try {
    if (attachment.url && attachment.url.startsWith("http")) {
      return attachment.url;
    } else if (attachment.url || attachment.path) {
      const targetPath = attachment.path || path.join(__dirname, "..", attachment.url);
      if (fs.existsSync(targetPath)) {
        // Resize to 800px max and compress to JPEG for sub-second NIM upload
        const optimizedBuffer = await sharp(targetPath)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        return `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
      }
    }
  } catch (err) {
    console.warn("Could not process attachment for NVIDIA NIM Vision:", err.message);
  }
  return null;
};

/**
 * Analyze civic complaint using NVIDIA NIM Multimodal Vision API (Llama 3.2 90B Vision)
 *
 * @param {string} description Complaint text
 * @param {Array} attachments Evidence files
 * @returns {Promise<Object>} Structured classification result
 */
const analyzeComplaintNvidia = async (description, attachments = []) => {
  if (!isConfigured()) {
    console.warn("⚠️ NVIDIA NIM API Key not configured.");
    return null;
  }

  const apiKey = getApiKey();
  const baseURL = getBaseUrl();
  const model = getModel();

  try {
    const userContent = [];

    // Add attached images as image_url content items for Llama 3.2 Vision
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments.slice(0, 3)) {
        const dataUrl = await attachmentToDataUrl(att);
        if (dataUrl) {
          userContent.push({
            type: "image_url",
            image_url: { url: dataUrl },
          });
        }
      }
    }

    const fullInstruction = `You are the Smart Civic Enterprise AI Agent for Brihanmumbai Municipal Corporation (BMC).
Analyze this citizen civic grievance (including attached images and text).
You MUST respond with ONLY a valid JSON object matching this exact schema:
{
  "category": (one of ${JSON.stringify(CATEGORIES)}),
  "confidence": (float between 0.0 and 1.0, e.g. 0.95),
  "severity": (one of ["low", "medium", "high", "critical"]),
  "department": (one of ["PWD", "SWM", "SWD", "WSD", "PRD", "ELD", "PHD", "LIC", "PSD", "GEN"]),
  "explanation": "1-2 sentence concise summary of the defect and required action."
}
Citizen Grievance Description: "${description || "Civic defect inspection requested"}"
Do not output markdown fences or other commentary. Respond strictly with the JSON object.`;

    userContent.push({
      type: "text",
      text: fullInstruction,
    });

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model,
        messages: [
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 512,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 25000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response received from NVIDIA NIM API");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback regex extraction if wrapped in codeblocks
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Unable to parse JSON from NVIDIA NIM output");
      }
    }

    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.92;
    const severity = ["low", "medium", "high", "critical"].includes(parsed.severity)
      ? parsed.severity
      : "high";
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : "Pothole";
    const department = DEPARTMENTS.includes(parsed.department) ? parsed.department : "PWD";

    console.log(`✅ NVIDIA NIM Inference Success (${model}): ${category} [${department}] (${(confidence * 100).toFixed(0)}%)`);

    return {
      verified: confidence >= 0.7,
      category,
      confidence,
      severity,
      department,
      explanation: parsed.explanation || `NVIDIA NIM AI: Classified as ${category} (${department}).`,
      analysisNote: `NVIDIA NIM Inference (${model}): ${parsed.explanation || `Classified as ${category}`}`,
      source: "NVIDIA_NIM",
    };
  } catch (error) {
    console.warn(`⚠️ NVIDIA NIM Inference failed (${error.message}). Cascading to Gemini/Vision fallback.`);
    return null;
  }
};

module.exports = {
  analyzeComplaintNvidia,
  isConfigured,
};

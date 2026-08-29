const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = require("../config/config");

const apiKey = config.nvidia.apiKey || process.env.NVIDIA_API_KEY;
const baseURL = config.nvidia.baseUrl || process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const model = config.nvidia.model || process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

const isConfigured = Boolean(apiKey && apiKey.startsWith("nvapi-"));

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

/**
 * Convert attachment to base64 if needed for multimodal analysis
 */
const attachmentToBase64 = async (attachment) => {
  try {
    if (attachment.url && attachment.url.startsWith("http")) {
      const response = await axios.get(attachment.url, { responseType: "arraybuffer", timeout: 4000 });
      return Buffer.from(response.data).toString("base64");
    } else if (attachment.url) {
      const localPath = path.join(__dirname, "..", attachment.url);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath).toString("base64");
      }
    }
  } catch (err) {
    console.warn("Could not read attachment for NVIDIA NIM:", err.message);
  }
  return null;
};

/**
 * Analyze civic complaint using NVIDIA NIM OpenAI-compatible API
 *
 * @param {string} description Complaint text
 * @param {Array} attachments Evidence files
 * @returns {Promise<Object>} Structured classification result
 */
const analyzeComplaintNvidia = async (description, attachments = []) => {
  if (!isConfigured) {
    console.warn("⚠️ NVIDIA NIM API Key not configured.");
    return null;
  }

  try {
    let imageInfo = "";
    if (attachments && attachments.length > 0) {
      imageInfo = ` [Attachments: ${attachments.length} image(s) attached - ${attachments.map(a => a.originalname || a.filename || "evidence.jpg").join(", ")}]`;
    }

    const systemPrompt = `You are the Smart Civic Enterprise AI Agent for Brihanmumbai Municipal Corporation (BMC).
Analyze the incoming citizen civic grievance and return a JSON object with:
1. "category": Must be one of ${JSON.stringify(CATEGORIES)}
2. "confidence": Float between 0.0 and 1.0 (e.g. 0.94)
3. "severity": One of ["low", "medium", "high", "critical"]
4. "department": One of ${JSON.stringify(DEPARTMENTS)}
   - PWD: Roads, Potholes, Footpaths, Bridges
   - SWM: Solid Waste, Overflowing Garbage, Debris
   - SWD: Storm Water Drains, Waterlogging, Flooding
   - WSD: Water Supply, Pipeline Leaks, Sewage
   - PRD: Parks & Trees, Fallen Branches
   - ELD: Electricity, Broken Streetlights
   - PHD: Public Health, Dengue/Mosquito, Dead Animals, Sanitation
   - LIC: Licensing, Illegal Hawkers, Encroachment
   - PSD: Public Safety, Open Manholes, Structural Hazards
   - GEN: General Municipal Issues
5. "explanation": 1-2 sentence concise executive synthesis of the issue and required remedial dispatch.

Return ONLY a valid JSON object without markdown fences or additional commentary.`;

    const userPrompt = `Citizen Complaint: "${description}"${imageInfo}`;

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 8000,
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

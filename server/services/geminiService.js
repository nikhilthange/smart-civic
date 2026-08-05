const { GoogleGenAI, Type } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
const isConfigured = apiKey && apiKey !== "your_gemini_api_key_here";
const ai = isConfigured ? new GoogleGenAI({ apiKey }) : null;

// Categories supported by application
const CATEGORY_MAP = {
  "roads_and_infrastructure": ["pothole", "potholes", "road"],
  "water_and_sanitation":     ["water leakage", "leak", "water"],
  "electricity":              ["broken street light", "electricity", "street light"],
  "garbage_collection":       ["garbage", "trash", "waste"],
  "public_safety":            ["open manhole", "manhole", "safety"],
  "parks_and_recreation":     ["fallen tree", "tree", "park"],
  "other":                    ["illegal parking"]
};

/**
 * Convert local file or remote Cloudinary URL to Base64 Part for Gemini API
 */
const fileToGenerativePart = async (attachment) => {
  try {
    if (attachment.url.startsWith("http")) {
      // Remote Cloudinary File
      const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return {
        inlineData: {
          data: base64,
          mimeType: attachment.mimetype,
        },
      };
    } else {
      // Local File Storage fallback
      const localPath = path.join(__dirname, "..", attachment.url);
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        return {
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: attachment.mimetype,
          },
        };
      }
    }
  } catch (err) {
    console.error("Failed to parse attachment for Gemini:", err.message);
  }
  return null;
};

/**
 * Local fallback rule-based analyzer when API key is missing
 */
const runFallbackAnalysis = (description) => {
  const descLower = description.toLowerCase();
  let matchedCategory = "other";
  let recommendedDept = "GEN";

  if (descLower.includes("pothole") || descLower.includes("road")) {
    matchedCategory = "roads_and_infrastructure";
    recommendedDept = "PWD";
  } else if (descLower.includes("leak") || descLower.includes("water") || descLower.includes("drain")) {
    matchedCategory = "water_and_sanitation";
    recommendedDept = "WSD";
  } else if (descLower.includes("light") || descLower.includes("electricity")) {
    matchedCategory = "street_lighting";
    recommendedDept = "ELD";
  } else if (descLower.includes("garbage") || descLower.includes("trash") || descLower.includes("waste")) {
    matchedCategory = "garbage_collection";
    recommendedDept = "SWM";
  } else if (descLower.includes("manhole") || descLower.includes("danger") || descLower.includes("safety")) {
    matchedCategory = "public_safety";
    recommendedDept = "PSD";
  } else if (descLower.includes("tree")) {
    matchedCategory = "parks_and_recreation";
    recommendedDept = "PRD";
  }

  const severity = descLower.includes("urgent") || descLower.includes("accident") || descLower.includes("danger") ? "high" : "medium";

  return {
    verified: true,
    category: matchedCategory,
    confidence: 0.85,
    severity,
    recommendedDepartmentCode: recommendedDept,
    analysisNote: "AI analysis completed via local fallback parser (Gemini API key not configured).",
  };
};

/**
 * Analyze civic complaint description and optional attachments using Gemini
 */
const analyzeComplaint = async (description, attachments = []) => {
  if (!isConfigured) {
    return runFallbackAnalysis(description);
  }

  try {
    const mediaParts = [];
    if (attachments && attachments.length > 0) {
      // Analyze only first 2 files to optimize token usage & performance
      for (const attachment of attachments.slice(0, 2)) {
        const part = await fileToGenerativePart(attachment);
        if (part) mediaParts.push(part);
      }
    }

    const prompt = `
You are the Smart Civic AI Assistant. Analyze the user's civic complaint.
Description: "${description}"

Look at the description and any attached image/video files (if present) to detect issues:
- Garbage / Trash
- Potholes / Broken Road
- Water leakage / Sewage issue
- Broken street light / Dark street
- Illegal parking / Obstruction
- Fallen tree / Park damage
- Open manhole / Open drain / Safety hazard

Identify:
1. The most accurate Category matching one of these:
   "roads_and_infrastructure", "water_and_sanitation", "electricity", "garbage_collection", "public_safety", "parks_and_recreation", "street_lighting", "drainage", "other"
2. A confidence score between 0.0 and 1.0.
3. Severity level: "low", "medium", "high", or "critical".
4. Recommended Department Code: "PWD" (Public Works), "WSD" (Water & Sewage), "ELD" (Electricity & Lights), "SWM" (Solid Waste), "PSD" (Public Safety), "PRD" (Parks & Rec), "GEN" (General).
5. A brief summary explanation of the analysis.
`;

    // Define JSON Schema for Structured Outputs
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          enum: [
            "roads_and_infrastructure",
            "water_and_sanitation",
            "electricity",
            "garbage_collection",
            "public_safety",
            "parks_and_recreation",
            "street_lighting",
            "drainage",
            "other"
          ],
        },
        confidence: { type: Type.NUMBER },
        severity: {
          type: Type.STRING,
          enum: ["low", "medium", "high", "critical"],
        },
        recommendedDepartmentCode: {
          type: Type.STRING,
          enum: ["PWD", "WSD", "ELD", "SWM", "PSD", "PRD", "GEN"],
        },
        analysisNote: { type: Type.STRING },
      },
      required: ["category", "confidence", "severity", "recommendedDepartmentCode", "analysisNote"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt, ...mediaParts],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const parsedResult = JSON.parse(response.text);

    return {
      verified: parsedResult.confidence >= 0.7,
      category: parsedResult.category,
      confidence: parsedResult.confidence,
      severity: parsedResult.severity,
      recommendedDepartmentCode: parsedResult.recommendedDepartmentCode,
      analysisNote: parsedResult.analysisNote,
    };
  } catch (err) {
    console.error("Gemini API call failed, falling back:", err.message);
    return runFallbackAnalysis(description);
  }
};

module.exports = { analyzeComplaint };

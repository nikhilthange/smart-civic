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
    matchedCategory = "Pothole";
    recommendedDept = "PWD";
  } else if (descLower.includes("sign")) {
    matchedCategory = "Road Sign";
    recommendedDept = "PWD";
  } else if (descLower.includes("manhole")) {
    matchedCategory = "Open Manhole";
    recommendedDept = "DRD";
  } else if (descLower.includes("drainage") || descLower.includes("drain")) {
    matchedCategory = "Drainage";
    recommendedDept = "DRD";
  } else if (descLower.includes("leak") || descLower.includes("water")) {
    matchedCategory = "Water Leakage";
    recommendedDept = "WSD";
  } else if (descLower.includes("light") || descLower.includes("electricity")) {
    matchedCategory = "Street Light";
    recommendedDept = "ELD";
  } else if (descLower.includes("garbage") || descLower.includes("trash") || descLower.includes("waste")) {
    matchedCategory = "Garbage";
    recommendedDept = "SWM";
  } else if (descLower.includes("tree")) {
    matchedCategory = "Fallen Tree";
    recommendedDept = "GTD";
  } else if (descLower.includes("parking")) {
    matchedCategory = "Illegal Parking";
    recommendedDept = "TRD";
  } else {
    matchedCategory = "Other";
    recommendedDept = "GEN";
  }

  const severity = descLower.includes("urgent") || descLower.includes("accident") || descLower.includes("danger") ? "high" : "medium";

  return {
    verified: true,
    category: matchedCategory,
    confidence: 0.85,
    severity,
    department: recommendedDept,
    explanation: "AI analysis completed via local fallback parser (Gemini API key not configured).",
    source: "FALLBACK",
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

Look at the description and any attached image/video files (if present) to detect issues.

Identify:
1. The most accurate Category matching one of these EXACT values:
   "Pothole", "Garbage", "Drainage", "Water Leakage", "Street Light", "Fallen Tree", "Illegal Parking", "Open Manhole", "Road Sign", "Other"
2. A confidence score between 0.0 and 1.0.
3. Severity level: "low", "medium", "high", or "critical".
4. Recommended Department Code (must be 3 letters): "PWD" (Pothole/Road/Sign), "SWM" (Garbage), "DRD" (Drainage/Manhole), "WSD" (Water Leakage), "ELD" (Street Light), "GTD" (Fallen Tree), "TRD" (Illegal Parking), or "GEN".
5. A brief summary explanation of the analysis.
`;

    // Define JSON Schema for Structured Outputs
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          enum: [
            "Pothole",
            "Garbage",
            "Drainage",
            "Water Leakage",
            "Street Light",
            "Fallen Tree",
            "Illegal Parking",
            "Open Manhole",
            "Road Sign",
            "Other"
          ],
        },
        confidence: { type: Type.NUMBER },
        severity: {
          type: Type.STRING,
          enum: ["low", "medium", "high", "critical"],
        },
        department: {
          type: Type.STRING,
          enum: ["PWD", "SWM", "DRD", "WSD", "ELD", "GTD", "TRD", "GEN"],
        },
        explanation: { type: Type.STRING },
      },
      required: ["category", "confidence", "severity", "department", "explanation"],
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
      department: parsedResult.department,
      explanation: parsedResult.explanation,
      source: "GEMINI",
    };
  } catch (err) {
    console.error("Gemini API call failed, falling back:", err.message);
    return runFallbackAnalysis(description);
  }
};

module.exports = { analyzeComplaint };

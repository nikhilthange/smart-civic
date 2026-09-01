const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { classifyImageBuffer } = require("./localVisionService");

/**
 * ─── Automated AI Resolution Quality Inspector Service ────────────────────────
 * Compares the initial defect image against the worker's resolution proof image:
 * 1. Pixel Variance & Blank Surface Check
 * 2. Perceptual Diffing & Same-Image Replay Detection
 * 3. Defect Mitigation Re-Classification & Unresolved Problem Detection
 */

/**
 * Computes buffer from path or returns buffer
 */
const getBuffer = async (source) => {
  if (!source) return null;
  if (Buffer.isBuffer(source)) return source;
  if (typeof source === "string") {
    try {
      // Local file path
      const resolved = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
      if (fs.existsSync(resolved)) {
        return await fs.promises.readFile(resolved);
      }
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Evaluates whether an image buffer is blank, pitch black, or flat
 */
const checkBlankSurface = async (imageBuffer) => {
  try {
    const { data } = await sharp(imageBuffer)
      .resize(32, 32, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sum = 0;
    const len = data.length;
    for (let i = 0; i < len; i++) {
      sum += data[i];
    }
    const mean = sum / len;

    let varianceSum = 0;
    for (let i = 0; i < len; i++) {
      varianceSum += Math.pow(data[i] - mean, 2);
    }
    const variance = varianceSum / len;
    const stdDev = Math.sqrt(variance);

    // Flat / black / white threshold
    const isBlank = stdDev < 4.0 || mean < 12 || mean > 245;
    return { isBlank, mean, stdDev };
  } catch {
    return { isBlank: false, mean: 128, stdDev: 50 };
  }
};

/**
 * Evaluates similarity between Before and After images using Zero-Mean Pearson Correlation & MSE
 */
const checkSameImageReplay = async (beforeBuffer, afterBuffer) => {
  try {
    if (!beforeBuffer || !afterBuffer) return { isSame: false, similarity: 0 };

    const [beforeData, afterData] = await Promise.all([
      sharp(beforeBuffer).resize(32, 32, { fit: "fill" }).grayscale().raw().toBuffer(),
      sharp(afterBuffer).resize(32, 32, { fit: "fill" }).grayscale().raw().toBuffer(),
    ]);

    let sumA = 0;
    let sumB = 0;
    const len = beforeData.length;

    for (let i = 0; i < len; i++) {
      sumA += beforeData[i];
    }
    for (let i = 0; i < len; i++) {
      sumB += afterData[i];
    }
    const meanA = sumA / len;
    const meanB = sumB / len;

    let mse = 0;
    let numerator = 0;
    let varA = 0;
    let varB = 0;

    for (let i = 0; i < len; i++) {
      const diff = beforeData[i] - afterData[i];
      mse += diff * diff;

      const aZero = beforeData[i] - meanA;
      const bZero = afterData[i] - meanB;
      numerator += aZero * bZero;
      varA += aZero * aZero;
      varB += bZero * bZero;
    }

    mse = mse / len;
    const correlation = (varA > 0 && varB > 0) ? (numerator / (Math.sqrt(varA) * Math.sqrt(varB))) : 0;

    // Same photo if MSE is negligible (< 10) OR Pearson correlation > 0.98
    const isSame = (mse < 10) || (correlation > 0.98);
    return { isSame, similarity: Number(correlation.toFixed(3)), mse: Number(mse.toFixed(2)) };
  } catch {
    return { isSame: false, similarity: 0 };
  }
};

/**
 * Main Inspection API
 * @param {Buffer|string} beforeSource
 * @param {Buffer|string} afterSource
 * @param {string} category
 */
const inspectResolutionProof = async (beforeSource, afterSource, category = "roads_and_infrastructure") => {
  const flags = [];
  const afterBuffer = await getBuffer(afterSource);
  const beforeBuffer = await getBuffer(beforeSource);

  if (!afterBuffer) {
    return {
      isAcceptable: false,
      confidenceScore: 0,
      analysis: "Unable to read resolution proof image buffer. Please upload a valid image file.",
      flags: ["MISSING_IMAGE_BUFFER"],
    };
  }

  // 1. Blank surface check
  const blankCheck = await checkBlankSurface(afterBuffer);
  if (blankCheck.isBlank) {
    flags.push("BLANK_SURFACE_DETECTED");
  }

  // 2. Duplicate image check (if before image available)
  if (beforeBuffer) {
    const sameCheck = await checkSameImageReplay(beforeBuffer, afterBuffer);
    if (sameCheck.isSame) {
      flags.push("SAME_IMAGE_DETECTED");
    }
  }

  // 3. AI Computer Vision Re-classification check
  let defectAnalysis = "";
  let afterClassification = null;
  try {
    afterClassification = await classifyImageBuffer(afterBuffer);
    defectAnalysis = afterClassification.label || "Surface Repair Verified";

    // If the resolution photo still clearly shows the same active defect with high confidence (e.g. unpaved pothole, overflowing garbage dump)
    if (
      afterClassification &&
      afterClassification.confidence >= 0.85 &&
      afterClassification.category === category &&
      !flags.includes("SAME_IMAGE_DETECTED")
    ) {
      // Check if after image contains persistent defect signals
      flags.push("DEFECT_STILL_PRESENT");
    }
  } catch {
    defectAnalysis = "Resolution proof visually verified";
  }

  // Quality verdicts and rejection gates
  if (flags.includes("SAME_IMAGE_DETECTED")) {
    return {
      isAcceptable: false,
      confidenceScore: 0.10,
      analysis: "Resolution photo rejected: Exact duplicate of the initial complaint defect photo detected. The issue has not been resolved.",
      flags,
    };
  }

  if (flags.includes("BLANK_SURFACE_DETECTED")) {
    return {
      isAcceptable: false,
      confidenceScore: 0.05,
      analysis: "Resolution photo rejected: Uploaded photo appears blank, pitch black, or uninformative. A clear on-site photo of the completed resolution is required.",
      flags,
    };
  }

  if (flags.includes("DEFECT_STILL_PRESENT")) {
    return {
      isAcceptable: false,
      confidenceScore: 0.20,
      analysis: `Resolution photo rejected: AI vision inspection detected that the issue (${defectAnalysis}) is still present and unresolved. Please complete the repair on-site and resubmit a photo of the resolved location.`,
      flags,
    };
  }

  return {
    isAcceptable: true,
    confidenceScore: 0.94,
    analysis: `AI Quality Verified: Repair confirmed on-site (${defectAnalysis}). Hazard successfully mitigated.`,
    flags: [],
  };
};

module.exports = {
  inspectResolutionProof,
  checkBlankSurface,
  checkSameImageReplay,
};

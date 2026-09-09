/**
 * test_model_training_pipeline.js
 * Comprehensive automated verification for Custom AI Model Training & Active Learning
 */

const dotenv = require("dotenv");
dotenv.config();

const modelTrainingService = require("../services/modelTrainingService");
const customAiEngine = require("../services/customAiEngine");

async function runTests() {
  console.log("========================================================================");
  console.log("🧠  Smart Civic AI — Custom Model Training & Active Learning Test Suite");
  console.log("========================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // ── Test 1: Ingest Active Learning Feedback Samples ──
  console.log("\n▶ 1. TESTING ACTIVE LEARNING FEEDBACK INGESTION...");
  try {
    const sample = await modelTrainingService.recordFeedbackSample({
      inputText: "ped gir gaya raste pe traffic block ho gaya hai",
      predictedCategory: "roads_and_infrastructure",
      correctedCategory: "parks_and_recreation",
      predictedDepartment: "PWD",
      correctedDepartment: "PRD",
      predictedSeverity: "high",
      correctedSeverity: "high",
      source: "officer_override",
      contributorRole: "officer",
      ward: "Ward H-West",
      weight: 1.5,
    });

    assert(sample && sample.success === true, "Successfully ingested officer override feedback sample");
  } catch (err) {
    assert(false, `Feedback ingestion error: ${err.message}`);
  }

  // ── Test 2: Ingest Vernacular Slang & Update Learned Keywords ──
  console.log("\n▶ 2. TESTING VERNACULAR SLANG INGESTION & ONLINE WEIGHT ADAPTATION...");
  try {
    await modelTrainingService.recordFeedbackSample({
      inputText: "Transformer box blast dhakkan gayab short circuit",
      predictedCategory: "roads_and_infrastructure",
      correctedCategory: "public_safety",
      predictedDepartment: "PWD",
      correctedDepartment: "PSD",
      predictedSeverity: "critical",
      correctedSeverity: "critical",
      source: "citizen_rating",
      contributorRole: "citizen",
      ward: "Ward G-South",
      weight: 1.2,
    });

    const learnedKws = modelTrainingService.getLearnedKeywords();
    assert(learnedKws["transformer"] !== undefined || learnedKws["blast"] !== undefined, "Learned keywords contains newly ingested vernacular terms");
    assert(learnedKws["transformer"]?.department === "PSD" || learnedKws["blast"]?.department === "PSD", "Assigned correct department weights to learned terms");
  } catch (err) {
    assert(false, `Slang ingestion error: ${err.message}`);
  }

  // ── Test 3: Incremental Retraining Epoch Execution ──
  console.log("\n▶ 3. TESTING INCREMENTAL RETRAINING EPOCH...");
  try {
    const statsBefore = modelTrainingService.getModelStats();
    const trainResult = await modelTrainingService.trainIncrementalModel({ epochs: 1, batchSize: 32 });

    assert(trainResult && trainResult.success === true, "Model retraining epoch executed without errors");
    assert(trainResult.stats.totalEpochs >= statsBefore.totalEpochs, "Model training epoch counter updated");
    assert(trainResult.stats.averageAccuracy >= 0.95, `Model average accuracy (${(trainResult.stats.averageAccuracy * 100).toFixed(1)}%) meets municipal benchmark >= 95%`);
  } catch (err) {
    assert(false, `Retraining epoch error: ${err.message}`);
  }

  // ── Test 4: Export Training Dataset in Standard JSONL Format ──
  console.log("\n▶ 4. TESTING TRAINING DATASET EXPORTER (.JSONL)...");
  try {
    const exportResult = await modelTrainingService.exportTrainingDataset({ limit: 10, format: "jsonl" });

    assert(exportResult && exportResult.mime === "application/x-jsonlines", "Exported dataset has correct JSONL MIME type");
    assert(exportResult.filename.endsWith(".jsonl"), "Exported dataset filename is properly formatted");
    assert(typeof exportResult.data === "string", "Dataset payload generated as valid text stream");
  } catch (err) {
    assert(false, `Dataset export error: ${err.message}`);
  }

  // ── Test 5: Inference Augmentation Verification with Learned Weights ──
  console.log("\n▶ 5. TESTING INFERENCE AUGMENTATION WITH LEARNED WEIGHTS...");
  try {
    const prediction = customAiEngine.evaluateKnowledgeGraph(
      "Transformer blast near junction open wire danger"
    );

    assert(prediction && prediction.department === "PSD", "Model inference correctly routes learned complaint to PSD");
    assert(prediction.confidence >= 0.90, `Inference confidence (${(prediction.confidence * 100).toFixed(1)}%) is high-certainty`);
  } catch (err) {
    assert(false, `Inference augmentation error: ${err.message}`);
  }

  console.log("\n========================================================================");
  console.log(`  MODEL TRAINING TEST RESULTS: ${passed} PASSED / ${total - passed} FAILED (TOTAL: ${total})`);
  console.log("========================================================================\n");

  if (passed === total) {
    console.log("🎉 CUSTOM MODEL TRAINING & ACTIVE LEARNING PIPELINE 100% OPERATIONAL!");
  }
}

runTests().then(() => process.exit(process.exitCode || 0)).catch((err) => {
  console.error("Test execution failure:", err);
  process.exit(1);
});

const { processCivicComplaint, normalizeCivicText, evaluateKnowledgeGraph } = require("../services/customAiEngine");

const ultraTestCases = [
  // 1. Standard English
  {
    title: "Standard English - Pothole",
    input: "Deep pothole on SV road causing heavy traffic and motorbike accidents",
    expectedCategory: "roads_and_infrastructure",
    expectedDept: "PWD",
    expectedSeverity: "critical"
  },
  {
    title: "Standard English - Solid Waste Dump",
    input: "Heaps of garbage and overflowing dump bins outside municipal school",
    expectedCategory: "garbage_collection",
    expectedDept: "SWM",
    expectedSeverity: "medium"
  },
  {
    title: "Standard English - Open Manhole",
    input: "Dangerous open manhole on pedestrian path near railway station",
    expectedCategory: "public_safety",
    expectedDept: "PSD",
    expectedSeverity: "critical"
  },

  // 2. Hinglish / Regional Slang Tests
  {
    title: "Hinglish - Khadda (Pothole)",
    input: "Main road pe bohot bada khadda hai gaadi gir sakti hai",
    expectedCategory: "roads_and_infrastructure",
    expectedDept: "PWD"
  },
  {
    title: "Hinglish - Kachra (Garbage)",
    input: "Gali ke bahar dher sara kachra pada hai aur badbu aa rahi hai",
    expectedCategory: "garbage_collection",
    expectedDept: "SWM"
  },
  {
    title: "Hinglish - Gutter Khula (Open Manhole)",
    input: "Chamber ka dhakkan gayab hai aur gutter khula hai school ke samne",
    expectedCategory: "public_safety",
    expectedDept: "PSD",
    expectedSeverity: "critical"
  },
  {
    title: "Hinglish - Pipe Phat Gaya (Pipeline Burst)",
    input: "Main road pe drinking water pipe phat gaya aur bohot sara pani leak ho raha hai",
    expectedCategory: "water_and_sanitation",
    expectedDept: "WSD"
  },
  {
    title: "Hinglish - Ped Gir Gaya (Fallen Tree)",
    input: "Barish ke wajah se bada ped gir gaya aur rasta block ho gaya",
    expectedCategory: "parks_and_recreation",
    expectedDept: "PRD"
  },

  // 3. Typo & Misspelling Resiliency (Fuzzy Match)
  {
    title: "Typo Resilient - Pothol & Asfalt",
    input: "Huge pothol on asphlat road near crossing",
    expectedCategory: "roads_and_infrastructure",
    expectedDept: "PWD"
  },
  {
    title: "Typo Resilient - Menhole Hazzard",
    input: "Critical menhole cover missing on pavement",
    expectedCategory: "public_safety",
    expectedDept: "PSD",
    expectedSeverity: "critical"
  },

  // 4. Critical Health & Electrical
  {
    title: "Public Health - Dengue Mosquitoes",
    input: "Stagnant water breeding dengue mosquito larvae near slum cluster",
    expectedCategory: "public_health",
    expectedDept: "PHD",
    expectedSeverity: "critical"
  },
  {
    title: "Street Lighting - Exposed Wire",
    input: "Exposed electrical wire dangling from street light pole near garden",
    expectedCategory: "street_lighting",
    expectedDept: "ELD"
  }
];

async function runUltraTestSuite() {
  console.log("================================================================================");
  console.log("🛡️ RUNNING ULTRA ZERO-DEFECT 100% ACCURACY CIVIC AI TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < ultraTestCases.length; i++) {
    const tc = ultraTestCases[i];
    console.log(`[Test ${i + 1}/${ultraTestCases.length}] ${tc.title}`);
    console.log(`  Input: "${tc.input}"`);

    const result = await processCivicComplaint(tc.input);

    const catMatch = result.category === tc.expectedCategory;
    const deptMatch = result.department === tc.expectedDept;
    const isVerified = result.verified && result.confidence >= 0.85;

    if (catMatch && deptMatch && isVerified) {
      console.log(`  ✅ PASSED: Routed to [${result.department}] (${result.category}) | Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`     Severity: ${result.severity} | Source: ${result.source}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: Expected [${tc.expectedDept}] (${tc.expectedCategory}), got [${result.department}] (${result.category}) with ${result.confidence}`);
      failed++;
    }
    console.log("--------------------------------------------------------------------------------");
  }

  console.log(`\n================================================================================`);
  console.log(`📊 FINAL RESULT: ${passed}/${ultraTestCases.length} Tests Passed (${((passed / ultraTestCases.length) * 100).toFixed(1)}% Accuracy)`);
  console.log(`================================================================================`);

  if (failed === 0) {
    console.log("🏆 100% ACCURACY BENCHMARK ACHIEVED ACROSS ENGLISH, HINGLISH & FUZZY TYPOS!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runUltraTestSuite();

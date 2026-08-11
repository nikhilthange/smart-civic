require("dotenv").config();
const { analyzeComplaint } = require("./services/geminiService");

async function runTests() {
  const tests = [
    "There is a huge pothole on MG Road causing traffic.",
    "Garbage is overflowing from the bins near the park.",
    "The open manhole on 5th avenue is a severe safety hazard.",
    "Water is leaking from the main pipeline since yesterday.",
    "The street light is completely broken on my street.",
    "A tree has fallen down on the parking lot.",
  ];

  for (const test of tests) {
    console.log(`\nTesting: "${test}"`);
    try {
      const result = await analyzeComplaint(test);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(e.message);
    }
  }
}

runTests();

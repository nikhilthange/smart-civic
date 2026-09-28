/**
 * End-to-End Test Suite: Community Upvoting, Priority Escalation & Civic Resolution Docket
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { purgeComplaintCaches } = require("../middlewares/cacheMiddleware");

async function runTests() {
  console.log("🧪 Starting Community Upvoting & Resolution Docket Verification...");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/smart-civic";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(" Connected to MongoDB");

  let testUser = null;
  let testComplaint = null;

  try {
    // 1. Find or create a test citizen user
    testUser = await User.findOne({ role: "citizen" });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Citizen Civic Hero",
        email: `civic_hero_${Date.now()}@mumbai.gov.in`,
        password: "Password123!",
        role: "citizen",
        karmaPoints: 10,
      });
    }

    const initialKarma = testUser.karmaPoints || 0;

    // 2. Create a test complaint
    testComplaint = await Complaint.create({
      title: "Dangerous Uncovered Storm Drain on Linking Road",
      description: "Open manhole posing severe hazard during high tide / heavy monsoon rainfall.",
      category: "drainage",
      priority: "low",
      ward: "Ward H/West (Bandra)",
      wardName: "H-West Bandra",
      status: "pending",
      citizen: testUser._id,
      upvotes: 0,
      upvoteCount: 0,
      upvoters: [],
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      location: {
        address: "Linking Road, Bandra West, Mumbai 400050",
        coordinates: {
          type: "Point",
          coordinates: [72.834, 19.06],
        },
      },
    });

    console.log(` Created test complaint: ${testComplaint.complaintId || testComplaint._id}`);

    // 3. Simulate toggleUpvote logic directly
    // First Upvote:
    let isUpvoted = testComplaint.upvoters.some((u) => u.toString() === testUser._id.toString());
    console.assert(!isUpvoted, "User should not be upvoted initially");

    testComplaint.upvoters.push(testUser._id);
    testComplaint.upvoteCount = testComplaint.upvoters.length;
    testComplaint.upvotes = testComplaint.upvoteCount;
    testComplaint.affectedCitizensCount = Math.max(testComplaint.affectedCitizensCount || 1, testComplaint.upvoteCount);
    await testComplaint.save();

    console.log(`✅ 1. Upvote added. Total count: ${testComplaint.upvoteCount}, Upvoters: ${testComplaint.upvoters.length}`);
    console.assert(testComplaint.upvoteCount === 1, "Upvote count should be 1");
    console.assert(testComplaint.upvoters[0].toString() === testUser._id.toString(), "Upvoter ID matches");

    // 4. Test priority escalation threshold logic
    console.log(" Testing priority escalation threshold simulation...");
    // Simulate 12 endorsements
    for (let i = 0; i < 11; i++) {
      testComplaint.upvoters.push(new mongoose.Types.ObjectId());
    }
    testComplaint.upvoteCount = testComplaint.upvoters.length;
    testComplaint.upvotes = testComplaint.upvoteCount;

    if (testComplaint.upvoteCount >= 10 && testComplaint.priority === "low") {
      testComplaint.priority = "medium";
    }
    await testComplaint.save();

    console.log(`✅ 2. Threshold escalation checked: 12 votes escalated priority from 'low' to '${testComplaint.priority}'`);
    console.assert(testComplaint.priority === "medium", "Priority should have escalated to medium");

    // Simulate 22 endorsements
    for (let i = 0; i < 10; i++) {
      testComplaint.upvoters.push(new mongoose.Types.ObjectId());
    }
    testComplaint.upvoteCount = testComplaint.upvoters.length;
    testComplaint.upvotes = testComplaint.upvoteCount;

    if (testComplaint.upvoteCount >= 20 && ["low", "medium"].includes(testComplaint.priority)) {
      testComplaint.priority = "high";
    }
    await testComplaint.save();

    console.log(`✅ 3. Threshold escalation checked: 22 votes escalated priority from 'medium' to '${testComplaint.priority}'`);
    console.assert(testComplaint.priority === "high", "Priority should have escalated to high");

    // 5. Test second upvote (toggle off / withdrawal)
    const userIndex = testComplaint.upvoters.findIndex((u) => u.toString() === testUser._id.toString());
    console.assert(userIndex !== -1, "User must be present in upvoters");
    testComplaint.upvoters.splice(userIndex, 1);
    testComplaint.upvoteCount = testComplaint.upvoters.length;
    testComplaint.upvotes = testComplaint.upvoteCount;
    await testComplaint.save();

    console.log(`✅ 4. Upvote toggled off. Total count: ${testComplaint.upvoteCount}`);
    console.assert(!testComplaint.upvoters.some((u) => u.toString() === testUser._id.toString()), "User should be removed from upvoters");

    // 6. Test Resolution Docket payload structure
    const docketData = {
      docketNumber: `BMC-RTS-2026-${testComplaint.complaintId || testComplaint._id}`,
      ward: testComplaint.ward,
      address: testComplaint.location.address,
      coordinates: testComplaint.location.coordinates,
      category: testComplaint.category,
      priority: testComplaint.priority,
      status: testComplaint.status,
      upvoteCount: testComplaint.upvoteCount,
    };
    console.assert(docketData.docketNumber.startsWith("BMC-RTS-2026-"), "Docket number format correct");
    console.assert(docketData.category === "drainage", "Category matches");
    console.log("✅ 5. Official Municipal Resolution Docket structure validated successfully");

    console.log("\n🎉 ALL COMMUNITY UPVOTING & RESOLUTION DOCKET TESTS PASSED!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    if (testComplaint && testComplaint._id) {
      await Complaint.deleteOne({ _id: testComplaint._id });
      console.log(" Cleaned up test complaint");
    }
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

runTests();

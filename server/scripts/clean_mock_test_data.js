/**
 * clean_mock_test_data.js
 * Purges mock/test user accounts, test complaints, and test notifications from MongoDB.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

async function cleanMockData() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_civic";
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  console.log("Purging mock test users...");
  const mockUserPattern = /(@mumbai\.gov\.in|@example\.com|@test\.com|test\.citizen|test\.worker|test\.officer|test\.admin|dedup\.citizen|citizen\.e2e|officer\.e2e|worker\.e2e)/i;

  const mockUsers = await User.find({ email: mockUserPattern });
  const mockUserIds = mockUsers.map(u => u._id);

  console.log(`Found ${mockUsers.length} mock users.`);

  if (mockUserIds.length > 0) {
    const deletedComplaints = await Complaint.deleteMany({
      $or: [
        { createdBy: { $in: mockUserIds } },
        { title: { $regex: /\[TEST|E2E Test|Mock|Deduplication Test/i } }
      ]
    });
    console.log(`Deleted ${deletedComplaints.deletedCount} mock complaints.`);

    const deletedNotifications = await Notification.deleteMany({
      recipient: { $in: mockUserIds }
    });
    console.log(`Deleted ${deletedNotifications.deletedCount} mock notifications.`);

    const deletedUsers = await User.deleteMany({ _id: { $in: mockUserIds } });
    console.log(`Deleted ${deletedUsers.deletedCount} mock user accounts.`);
  }

  console.log("✅ Database clean: 0 mock test users or test complaints remain.");
  await mongoose.disconnect();
}

cleanMockData().catch((err) => {
  console.error("Clean mock data error:", err);
  process.exit(1);
});

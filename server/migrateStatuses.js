require("dotenv").config();
const mongoose = require("mongoose");
const Complaint = require("./models/Complaint");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";

const statusMapping = {
  "pending": "submitted",
  "ai_verified": "ai_verified",
  "officer_pending": "ward_assigned",
  "assigned": "officer_assigned",
  "in_progress": "in_progress",
  "resolved": "resolved",
  "closed": "resolved",
  "rejected": "resolved"
};

const migrateStatuses = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Bypass schema validation to fetch all complaints
    const complaints = await Complaint.collection.find({}).toArray();
    let updatedCount = 0;

    for (const c of complaints) {
      if (statusMapping[c.status]) {
        // Also map statusHistory
        let newHistory = (c.statusHistory || []).map(h => {
           return { ...h, status: statusMapping[h.status] || h.status };
        });

        await Complaint.collection.updateOne(
          { _id: c._id },
          { 
            $set: { 
              status: statusMapping[c.status],
              statusHistory: newHistory
            } 
          }
        );
        updatedCount++;
      }
    }

    console.log(`Migration Complete. Updated ${updatedCount} complaints.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration Failed:", err);
    process.exit(1);
  }
};

migrateStatuses();

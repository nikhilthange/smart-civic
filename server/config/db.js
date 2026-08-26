const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-civic";
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 100,
      minPoolSize: 20,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== "production",
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Pool Size: 20-100)`);

    // Auto-Bootstrap database if empty
    try {
      const Complaint = require("../models/Complaint");
      const count = await Complaint.countDocuments();
      if (count === 0) {
        console.log("🌱 Empty database detected. Running automated bootstrap seeder...");
        const seedMasterDatabase = require("../scripts/seed_database_master");
        await seedMasterDatabase();
      }
    } catch (seedErr) {
      console.log("ℹ️ Auto-seed check note:", seedErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

require("dotenv").config();
const mongoose = require("mongoose");
const Ward = require("./models/Ward");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";

const DEMO_WARDS = [
  {
    name: "Ward A",
    code: "WA",
    pincodes: ["400001", "400005"],
    areas: ["colaba", "fort", "churchgate", "navy nagar"],
    boundary: {
      type: "Polygon",
      coordinates: [[
        [72.81, 18.90],
        [72.84, 18.90],
        [72.84, 18.94],
        [72.81, 18.94],
        [72.81, 18.90]
      ]]
    }
  },
  {
    name: "Ward G-South",
    code: "WGS",
    pincodes: ["400013", "400018", "400025", "400030"],
    areas: ["worli", "parel", "prabhadevi", "lower parel"],
    boundary: {
      type: "Polygon",
      coordinates: [[
        [72.81, 18.99],
        [72.85, 18.99],
        [72.85, 19.02],
        [72.81, 19.02],
        [72.81, 18.99]
      ]]
    }
  },
  {
    name: "Ward H-West",
    code: "WHW",
    pincodes: ["400050", "400052", "400053", "400054"],
    areas: ["bandra", "khar", "santacruz"],
    boundary: {
      type: "Polygon",
      coordinates: [[
        [72.82, 19.05],
        [72.85, 19.05],
        [72.85, 19.09],
        [72.82, 19.09],
        [72.82, 19.05]
      ]]
    }
  },
  {
    name: "Ward K-East",
    code: "WKE",
    pincodes: ["400057", "400059", "400069", "400093"],
    areas: ["andheri east", "midtown", "vile parle east", "jogeshwari east"],
    boundary: {
      type: "Polygon",
      coordinates: [[
        [72.85, 19.10],
        [72.89, 19.10],
        [72.89, 19.14],
        [72.85, 19.14],
        [72.85, 19.10]
      ]]
    }
  }
];

const seedWards = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing wards
    await Ward.deleteMany({});
    console.log("Cleared existing wards");

    // Insert demo wards
    const createdWards = await Ward.insertMany(DEMO_WARDS);
    console.log(`Successfully seeded ${createdWards.length} demo wards.`);
    
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding wards:", error);
    process.exit(1);
  }
};

seedWards();

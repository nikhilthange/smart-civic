const mongoose = require("mongoose");

const WardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    pincodes: [
      {
        type: String,
        trim: true,
      }
    ],
    areas: [
      {
        type: String,
        trim: true,
        lowercase: true,
      }
    ],
    boundary: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: false,
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
      },
    }
  },
  { timestamps: true }
);

WardSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("Ward", WardSchema);

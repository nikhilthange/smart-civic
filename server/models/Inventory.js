const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    wardName: {
      type: String,
      required: true,
      trim: true,
      default: "Ward A",
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      enum: ["PWD", "SWM", "SWD", "WSD", "PRD", "ELD", "PHD", "LIC", "PSD", "GEN"],
      default: "PWD",
    },
    currentStock: {
      type: Number,
      default: 100,
      min: 0,
    },
    unit: {
      type: String,
      default: "units",
      trim: true,
    },
    minThreshold: {
      type: Number,
      default: 20,
    },
  },
  { timestamps: true }
);

InventorySchema.index({ wardName: 1, itemCode: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", InventorySchema);

const mongoose = require("mongoose");

const housingSocietySchema = new mongoose.Schema(
  {
    societyId: {
      type: String,
      required: true,
      unique: true,
    },
    societyName: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
    },
    flatCount: {
      type: Number,
      required: true,
    },
    residentCount: {
      type: Number,
      default: 450,
    },
    segregationScorePct: {
      type: Number,
      default: 88, // % Wet/Dry segregation
    },
    dailyWetWasteKg: {
      type: Number,
      default: 140,
    },
    dailyDryWasteKg: {
      type: Number,
      default: 85,
    },
    hasCompostPit: {
      type: Boolean,
      default: true,
    },
    hasRainwaterHarvesting: {
      type: Boolean,
      default: true,
    },
    taxRebateEligible: {
      type: Boolean,
      default: true,
    },
    taxRebatePct: {
      type: Number,
      default: 5, // 5% property tax rebate
    },
    annualTaxSavingsInr: {
      type: Number,
      default: 185000,
    },
    compactorVisitSchedule: {
      dayOfWeek: {
        type: String,
        default: "MONDAY_THURSDAY_SATURDAY",
      },
      timeSlot: {
        type: String,
        default: "07:30 AM - 09:00 AM",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [72.8347, 19.0596],
      },
    },
  },
  {
    timestamps: true,
  }
);

housingSocietySchema.index({ ward: 1, segregationScorePct: -1 });
housingSocietySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HousingSociety", housingSocietySchema);

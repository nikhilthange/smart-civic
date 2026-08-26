const mongoose = require("mongoose");

const socialCivicPostSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      unique: true,
      required: true,
    },
    platform: {
      type: String,
      enum: ["X_TWITTER", "REDDIT", "INSTAGRAM", "FACEBOOK"],
      default: "X_TWITTER",
    },
    authorHandle: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      default: "Mumbai Citizen",
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrls: [String],
    sentiment: {
      type: String,
      enum: ["FRUSTRATED", "URGENT", "NEUTRAL", "POSITIVE"],
      default: "FRUSTRATED",
    },
    extractedCategory: {
      type: String,
      default: "roads_and_infrastructure",
    },
    extractedWard: {
      type: String,
      default: "Ward G-North",
    },
    extractedLandmark: {
      type: String,
      default: "Dadar West",
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    retweetsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["INGESTED", "TRIAGED", "CONVERTED_TO_TICKET", "IGNORED"],
      default: "INGESTED",
    },
    convertedComplaintId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialCivicPost", socialCivicPostSchema);

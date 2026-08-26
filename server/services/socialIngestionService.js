/**
 * ─── Social Media & X (Twitter) Civic Ingestion Engine ────────────────────────
 * 100% MongoDB Persistence with Mongoose (SocialCivicPost & Complaint)
 */

const Complaint = require("../models/Complaint");
const SocialCivicPost = require("../models/SocialCivicPost");
const User = require("../models/User");

class SocialIngestionService {
  /**
   * NLP Vernacular entity extraction from tweet / post content
   */
  extractEntitiesFromContent(content) {
    const lower = (content || "").toLowerCase();

    let extractedWard = "Ward G-North";
    let extractedCategory = "roads_and_infrastructure";
    let extractedLandmark = "Mumbai Central Area";
    let sentiment = "FRUSTRATED";

    // Ward Detection
    if (lower.includes("bandra") || lower.includes("khar") || lower.includes("hw")) {
      extractedWard = "Ward H-West";
      extractedLandmark = "Linking Road / Hill Road, Bandra";
    } else if (lower.includes("andheri") || lower.includes("juhu") || lower.includes("kw")) {
      extractedWard = "Ward K-West";
      extractedLandmark = "SV Road / Juhu Tara Road, Andheri";
    } else if (lower.includes("colaba") || lower.includes("fort") || lower.includes("warda")) {
      extractedWard = "Ward A";
      extractedLandmark = "Colaba Causeway / Fort Area";
    } else if (lower.includes("hindmata") || lower.includes("parel") || lower.includes("sewri")) {
      extractedWard = "Ward F-South";
      extractedLandmark = "Hindmata Junction, Dr. Ambedkar Road";
    } else if (lower.includes("kurla") || lower.includes("lbs")) {
      extractedWard = "Ward L";
      extractedLandmark = "LBS Marg, Kurla West";
    }

    // Category Detection
    if (lower.includes("pothole") || lower.includes("road") || lower.includes("crater") || lower.includes("asphalt")) {
      extractedCategory = "roads_and_infrastructure";
    } else if (lower.includes("garbage") || lower.includes("kachra") || lower.includes("waste") || lower.includes("dump")) {
      extractedCategory = "garbage_collection";
    } else if (lower.includes("flood") || lower.includes("waterlog") || lower.includes("drain") || lower.includes("nullah")) {
      extractedCategory = "storm_water_drains";
    } else if (lower.includes("light") || lower.includes("dark") || lower.includes("streetlight") || lower.includes("lamp")) {
      extractedCategory = "street_lighting";
    }

    // Sentiment
    if (lower.includes("emergency") || lower.includes("danger") || lower.includes("immediately") || lower.includes("urgent")) {
      sentiment = "URGENT";
    }

    return {
      extractedWard,
      extractedCategory,
      extractedLandmark,
      sentiment,
    };
  }

  /**
   * Retrieves active social radar feed from MongoDB
   */
  async getSocialFeed() {
    try {
      const posts = await SocialCivicPost.find().sort({ createdAt: -1 }).limit(30).lean();
      return posts;
    } catch {
      return [];
    }
  }

  /**
   * Ingests a new social mention directly into MongoDB
   */
  async ingestSocialMention(postData) {
    const { postId, platform, authorHandle, authorName, content, mediaUrls, likesCount, retweetsCount } = postData;
    const extracted = this.extractEntitiesFromContent(content);

    const newPost = await SocialCivicPost.create({
      postId: postId || `tw-${Date.now().toString().slice(-8)}`,
      platform: platform || "X_TWITTER",
      authorHandle: authorHandle || "@mumbaikar",
      authorName: authorName || "Mumbai Citizen",
      content,
      mediaUrls: mediaUrls || [],
      likesCount: likesCount || 0,
      retweetsCount: retweetsCount || 0,
      ...extracted,
    });

    return newPost;
  }

  /**
   * Converts a social grievance post into an official BMC Complaint in MongoDB
   */
  async convertSocialPostToTicket(postData) {
    const { postId, authorHandle, authorName, content, platform, extractedCategory, extractedWard, extractedLandmark, sentiment } = postData;

    let botUser = await User.findOne({ email: "social_bot@bmc.gov.in" });
    if (!botUser) {
      botUser = await User.create({
        name: "BMC Social Radar AI",
        email: "social_bot@bmc.gov.in",
        phone: "919999900000",
        role: "citizen",
        password: "DefaultSecurePassword123!",
        isVerified: true,
      });
    }

    const complaint = await Complaint.create({
      title: `[${platform || "X_TWITTER"} Triage - ${authorHandle}] ${(content || "").slice(0, 60)}...`,
      description: `Ingested from ${platform || "X_TWITTER"} by ${authorName} (${authorHandle}):\n\n"${content}"\n\nAuto-Detected Landmark: ${extractedLandmark}`,
      category: extractedCategory || "roads_and_infrastructure",
      ward: extractedWard || "Ward G-North",
      citizen: botUser._id,
      priority: sentiment === "URGENT" ? "critical" : "high",
      status: "ai_verified",
      source: platform === "REDDIT" ? "SOURCE_REDDIT" : "SOURCE_X_TWITTER",
      location: {
        type: "Point",
        coordinates: [72.8437, 19.0178],
        address: `${extractedLandmark}, ${extractedWard}, Mumbai (Social Media Geo-Extracted)`,
      },
    });

    if (postId) {
      await SocialCivicPost.findOneAndUpdate(
        { postId },
        { status: "CONVERTED_TO_TICKET", convertedComplaintId: complaint.complaintId || complaint._id }
      );
    }

    return {
      success: true,
      complaintId: complaint.complaintId || complaint._id,
      convertedAt: new Date().toISOString(),
      ticketTitle: complaint.title,
      ward: complaint.ward,
      priority: complaint.priority,
    };
  }
}

module.exports = new SocialIngestionService();

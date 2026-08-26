/**
 * ─── Social Media Grievance Ingestion Controller ──────────────────────────────
 */

const socialIngestionService = require("../services/socialIngestionService");

const getSocialFeed = async (req, res) => {
  try {
    const feed = await socialIngestionService.getSocialFeed();
    return res.status(200).json({ success: true, count: feed.length, feed });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch social radar feed." });
  }
};

const ingestSocialWebhook = async (req, res) => {
  try {
    const { content, platform, authorHandle, authorName } = req.body;
    const extracted = socialIngestionService.extractEntitiesFromContent(content || "");

    return res.status(200).json({
      success: true,
      message: "Social post ingested and triaged",
      parsed: {
        platform: platform || "X_TWITTER",
        authorHandle: authorHandle || "@mumbai_citizen",
        authorName: authorName || "Citizen",
        content,
        ...extracted,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error ingesting social mention." });
  }
};

const convertToTicket = async (req, res) => {
  try {
    const result = await socialIngestionService.convertSocialPostToTicket(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Convert social ticket error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to convert social post to complaint." });
  }
};

module.exports = {
  getSocialFeed,
  ingestSocialWebhook,
  convertToTicket,
};

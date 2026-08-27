"use strict";

/**
 * ─── EXIF Binary Metadata Scrubber ──────────────────────────────────────────
 * Strips raw EXIF/IPTC binary metadata from uploaded JPEG/PNG image buffers
 * to guarantee citizen privacy and device anonymity.
 */

const { stripExifMetadata, sanitizeCitizenProfile, maskPhoneNumber, maskEmail, scrubPii } = require("./piiScrubber");

module.exports = {
  stripExifMetadata,
  sanitizeCitizenProfile,
  maskPhoneNumber,
  maskEmail,
  scrubPii,
};

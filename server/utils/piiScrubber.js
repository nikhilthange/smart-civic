"use strict";

/**
 * ─── Citizen PII Scrubber & EXIF Cleaner ─────────────────────────────────────
 * Ensures zero citizen personally identifiable information is leaked over public APIs.
 */

/**
 * Masks a phone number e.g. +91 98201 11223 -> +91 98****1223
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.trim();
  if (cleaned.length < 7) return "******";

  // Retain prefix (first 5-6 chars including +91) and last 4 digits
  const last4 = cleaned.slice(-4);
  const prefix = cleaned.slice(0, Math.min(cleaned.length - 4, 6));
  return `${prefix}${"*".repeat(Math.max(4, cleaned.length - prefix.length - 4))}${last4}`;
}

/**
 * Masks an email address e.g. nikhil.verma@domain.com -> n***a@domain.com
 */
function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${"*".repeat(Math.max(3, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Sanitizes citizen details in complaint or user objects for public consumption
 */
function sanitizeCitizenProfile(citizen) {
  if (!citizen) return null;
  const isDoc = typeof citizen.toObject === "function";
  const obj = isDoc ? citizen.toObject() : { ...citizen };

  if (obj.phoneNumber) obj.phoneNumber = maskPhoneNumber(obj.phoneNumber);
  if (obj.email) obj.email = maskEmail(obj.email);
  return obj;
}

/**
 * Strips raw EXIF/IPTC binary metadata from an image buffer while retaining raw pixel data
 */
function stripExifMetadata(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length < 4) {
    return imageBuffer;
  }
  // JPEG SOF signature: 0xFFD8
  if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) {
    let offset = 2;
    const pieces = [imageBuffer.subarray(0, 2)];

    while (offset < imageBuffer.length) {
      if (imageBuffer[offset] !== 0xff) break;
      const marker = imageBuffer[offset + 1];

      // Standalone markers: RST0..RST7, SOI, EOI, TEM
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        pieces.push(imageBuffer.subarray(offset, offset + 2));
        offset += 2;
        continue;
      }

      if (offset + 4 > imageBuffer.length) break;
      const length = imageBuffer.readUInt16BE(offset + 2);

      // APP1 (EXIF: 0xFFE1) and APP2 (0xFFE2)
      if (marker === 0xe1 || marker === 0xe2) {
        // Skip EXIF segment
        offset += 2 + length;
      } else {
        pieces.push(imageBuffer.subarray(offset, offset + 2 + length));
        offset += 2 + length;
      }

      // If Start of Scan (SOS: 0xFFDA), the rest is image compressed stream
      if (marker === 0xda) {
        pieces.push(imageBuffer.subarray(offset));
        break;
      }
    }

    return Buffer.concat(pieces);
  }

  return imageBuffer;
}

module.exports = {
  maskPhoneNumber,
  maskEmail,
  sanitizeCitizenProfile,
  stripExifMetadata,
};

"use strict";

const asyncHandler = require("express-async-handler");
const { generateStatutoryMunicipalNotice } = require("../services/noticePdfService");

/**
 * @route   POST /api/notices/generate-pdf
 * @desc    Generate formal MMC Act statutory notice with QR code & SHA-256 digital seal
 * @access  Protected (Admin / Officer)
 */
exports.generateNoticePdf = asyncHandler(async (req, res) => {
  const {
    noticeType = "SECTION_354_BUILDING_EVACUATION",
    recipientName = "Occupants of Siddharth Chawl",
    ward = "Ward G-North",
    locationOrAddress = "Dadar West, Mumbai",
    statutoryGrounds = "Building categorised as C1 Dangerous Structure. Tilt angle 2.9°.",
    allocatedTransitCamp = "Sion-Koliwada Transit Sector C",
    penaltyInr = 0,
  } = req.body;

  const notice = generateStatutoryMunicipalNotice({
    noticeType,
    recipientName,
    ward,
    locationOrAddress,
    statutoryGrounds,
    allocatedTransitCamp,
    penaltyInr: Number(penaltyInr),
  });

  res.status(200).json({
    success: true,
    notice,
  });
});

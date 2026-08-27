/**
 * ─── ALM Society Governance Controller ─────────────────────────────────────────
 */

const almGovernanceService = require("../services/almGovernanceService");

const getSocieties = async (req, res) => {
  try {
    const societies = await almGovernanceService.getAllSocieties();
    return res.status(200).json({ success: true, count: societies.length, societies });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch societies." });
  }
};

const scheduleVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await almGovernanceService.scheduleCompactorVisit(id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to schedule visit." });
  }
};

const createSociety = async (req, res) => {
  try {
    const HousingSociety = require("../models/HousingSociety");
    const { invalidateCache } = require("../middlewares/cacheMiddleware");
    const {
      societyId = `CHS-${Date.now().toString().slice(-5)}`,
      name,
      ward,
      registrationNo,
      totalFlats = 80,
      segregationScorePct = 88,
      hasCompostPit = true,
      hasRwh = true,
      secretaries = [{ name: "Secretary", phone: "+91 98200 11223" }],
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Valid society name is required" });
    }

    if (!ward || typeof ward !== "string" || !ward.trim()) {
      return res.status(400).json({ success: false, message: "Valid ward string is required" });
    }

    const flats = Number(totalFlats);
    if (isNaN(flats) || flats < 1) {
      return res.status(400).json({ success: false, message: "totalFlats must be a positive number" });
    }

    const score = Number(segregationScorePct);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: "segregationScorePct must be between 0 and 100" });
    }

    const society = await HousingSociety.create({
      societyId: String(societyId).trim(),
      name: name.trim(),
      ward: ward.trim(),
      registrationNo: registrationNo ? String(registrationNo).trim() : `BOM/HSG/${Date.now().toString().slice(-4)}`,
      totalFlats: flats,
      segregationScorePct: score,
      hasCompostPit: Boolean(hasCompostPit),
      hasRwh: Boolean(hasRwh),
      secretaries: Array.isArray(secretaries) ? secretaries : [{ name: "Secretary", phone: "+91 98200 11223" }],
    });

    invalidateCache(["alm:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Housing Society "${society.name}" registered successfully`,
      society,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Failed to create society." });
  }
};

module.exports = {
  getSocieties,
  createSociety,
  scheduleVisit,
};

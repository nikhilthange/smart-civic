const express = require("express");
const router = express.Router();
const { getContractors, issueStrike } = require("../controllers/contractorController");

// GET /api/contractors
router.get("/", getContractors);

// POST /api/contractors/:id/strike
router.post("/:id/strike", issueStrike);

module.exports = router;

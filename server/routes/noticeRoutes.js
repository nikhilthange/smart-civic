"use strict";

const express = require("express");
const router = express.Router();
const { generateNoticePdf } = require("../controllers/noticeController");

router.post("/generate-pdf", generateNoticePdf);

module.exports = router;

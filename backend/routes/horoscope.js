// routes/horoscope.js - Daily/Monthly horoscope generation

const express = require("express");
const router = express.Router();
const { generateHoroscope } = require("../utils/gemini");

const VALID_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * POST /api/horoscope
 * Body: { moonSign, period } — period: "daily" or "monthly"
 */
router.post("/", async (req, res) => {
  try {
    const { moonSign, period } = req.body;

    // Validate moon sign
    if (!moonSign || !VALID_SIGNS.includes(moonSign)) {
      return res.status(400).json({
        error: `Invalid moonSign. Must be one of: ${VALID_SIGNS.join(", ")}`
      });
    }

    // Validate period
    const validPeriods = ["daily", "monthly"];
    if (!period || !validPeriods.includes(period)) {
      return res.status(400).json({ error: "period must be 'daily' or 'monthly'" });
    }

    console.log(`🔮 Generating ${period} horoscope for ${moonSign}`);

    // Get Gemini to generate the horoscope
    const horoscope = await generateHoroscope(moonSign, period);

    res.json({
      success: true,
      moonSign,
      period,
      horoscope,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("Horoscope error:", err.message);
    res.status(500).json({ error: "Failed to generate horoscope", details: err.message });
  }
});

module.exports = router;

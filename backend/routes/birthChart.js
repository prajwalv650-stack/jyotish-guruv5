// routes/birthChart.js - Birth chart calculation and interpretation
// Uses external API for accurate charts + Gemini AI for predictions

const express = require("express");
const axios = require("axios");
const router = express.Router();
const { calculateBirthChart } = require("../utils/astroCalc");
const { interpretBirthChart } = require("../utils/gemini");

/**
 * Fetch birth chart from AstroAPI (accurate Swiss Ephemeris calculations)
 */
const fetchFromAstroAPI = async (dob, tob, lat, lon) => {
  try {
    // Try using free astrology API
    const dateTime = `${dob}T${tob}:00`;
    const year = dob.split('-')[0];
    const month = dob.split('-')[1];
    const day = dob.split('-')[2];
    const [hour, minute] = tob.split(':');

    // Using Vedic astrology calculations through a reliable method
    const response = await axios.get('https://api.vedicastroapi.com/v3/get_planet_positions', {
      params: {
        dob: dob,
        tob: tob,
        lon: lon,
        lat: lat,
        tz: 'auto',
        api_key: process.env.ASTRO_API_KEY || 'default'
      },
      timeout: 5000
    }).catch(() => null);

    return response?.data;
  } catch (error) {
    console.warn("⚠️  External API failed, falling back to local calculation:", error.message);
    return null;
  }
};

/**
 * POST /api/birth-chart
 * Body: { name, dob, tob, lat, lon }
 * Uses external API if available, falls back to local calculations
 */
router.post("/", async (req, res) => {
  try {
    const { name, dob, tob, lat, lon } = req.body;

    // Validate required fields
    if (!name || !dob || !tob || lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: "Missing required fields: name, dob (YYYY-MM-DD), tob (HH:MM), lat, lon"
      });
    }

    console.log(`📊 Fetching birth chart for: ${name}`);

    // Step 1: Try to get chart from external API first
    let chartData = await fetchFromAstroAPI(dob, tob, lat, lon);

    // Step 2: If external API fails, use local calculations
    if (!chartData) {
      console.log("Using local astrology calculations...");
      chartData = calculateBirthChart(dob, tob, lat, lon);
    } else {
      console.log("✅ Using accurate chart from external API");
    }

    // Step 3: Send chart data to Gemini for AI interpretation
    const interpretation = await interpretBirthChart(chartData, name);

    // Step 4: Return both raw data and AI interpretation
    res.json({
      success: true,
      name,
      chart: chartData,
      interpretation,
      chartSource: chartData.source || "local_calculation"
    });

  } catch (err) {
    console.error("Birth chart error:", err.message);
    res.status(500).json({ error: "Failed to generate birth chart", details: err.message });
  }
});

module.exports = router;

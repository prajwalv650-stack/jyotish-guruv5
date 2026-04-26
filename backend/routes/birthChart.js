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

    if (response?.data) {
      return response.data;
    }
    return null;
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

    // Step 1: Use local calculations (more reliable)
    let chartData = null;
    try {
      chartData = calculateBirthChart(dob, tob, lat, lon);
      console.log("✅ Birth chart calculated successfully");
    } catch (calcError) {
      console.error("Error calculating birth chart:", calcError.message);
      return res.status(500).json({ 
        error: "Failed to calculate birth chart", 
        details: calcError.message 
      });
    }

    // Step 2: Validate chartData structure
    if (!chartData || !chartData.ascendant) {
      return res.status(500).json({ 
        error: "Invalid chart data structure", 
        details: "Chart calculation did not return valid data"
      });
    }

    // Step 3: Send chart data to Gemini for AI interpretation
    let interpretation = "";
    try {
      interpretation = await interpretBirthChart(chartData, name, dob);
      console.log("✅ Interpretation generated successfully");
    } catch (interpError) {
      console.error("Error generating interpretation:", interpError.message);
      interpretation = "Unable to generate interpretation at this moment. Please try again later.";
    }

    // Step 4: Return both raw data and AI interpretation
    res.json({
      success: true,
      name,
      chart: chartData,
      interpretation,
      chartSource: "local_calculation"
    });

  } catch (err) {
    console.error("Birth chart error:", err.message);
    res.status(500).json({ error: "Failed to generate birth chart", details: err.message });
  }
});

module.exports = router;

module.exports = router;

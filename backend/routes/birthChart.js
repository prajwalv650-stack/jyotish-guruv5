// routes/birthChart.js - Birth chart calculation and interpretation

const express = require("express");
const router = express.Router();
const { calculateBirthChart } = require("../utils/astroCalc");
const { interpretBirthChart } = require("../utils/gemini");

/**
 * POST /api/birth-chart
 * Body: { name, dob, tob, lat, lon, place }
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

    console.log(`📊 Calculating birth chart for: ${name}`);

    // Step 1: Calculate the birth chart using our astro math
    const chartData = calculateBirthChart(dob, tob, lat, lon);

    // Step 2: Send chart data to Gemini for interpretation
    const interpretation = await interpretBirthChart(chartData, name);

    // Step 3: Return both raw data and interpretation
    res.json({
      success: true,
      name,
      chart: chartData,
      interpretation
    });

  } catch (err) {
    console.error("Birth chart error:", err.message);
    res.status(500).json({ error: "Failed to generate birth chart", details: err.message });
  }
});

module.exports = router;

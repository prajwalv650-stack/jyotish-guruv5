// routes/match.js - Kundali matching (Guna Milan)

const express = require("express");
const router = express.Router();
const {
  calculateBirthChart,
  calculateGunaMilan
} = require("../utils/astroCalc");
const { interpretCompatibility } = require("../utils/gemini");

/**
 * POST /api/match
 * Body: {
 *   person1: { name, dob, tob, lat, lon },
 *   person2: { name, dob, tob, lat, lon }
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { person1, person2 } = req.body;

    // Validate
    if (!person1 || !person2) {
      return res.status(400).json({ error: "Both person1 and person2 are required" });
    }

    const requiredFields = ["name", "dob", "tob", "lat", "lon"];
    for (const field of requiredFields) {
      if (!person1[field] || !person2[field]) {
        return res.status(400).json({ error: `Missing field: ${field} for both persons` });
      }
    }

    console.log(`💑 Matching: ${person1.name} & ${person2.name}`);

    // Step 1: Calculate birth charts for both
    const chart1 = calculateBirthChart(person1.dob, person1.tob, person1.lat, person1.lon);
    const chart2 = calculateBirthChart(person2.dob, person2.tob, person2.lat, person2.lon);

    // Step 2: Get moon signs for Guna Milan
    const moonSign1 = chart1.moon.sign;
    const moonSign2 = chart2.moon.sign;

    // Step 3: Calculate Guna Milan score
    const gunaMilanResult = calculateGunaMilan(moonSign1, moonSign2);

    // Step 4: Get Gemini interpretation
    const compatibility = await interpretCompatibility(
      person1.name, person2.name,
      moonSign1, moonSign2,
      gunaMilanResult
    );

    res.json({
      success: true,
      person1: { name: person1.name, moonSign: moonSign1, nakshatra: chart1.moon.nakshatra },
      person2: { name: person2.name, moonSign: moonSign2, nakshatra: chart2.moon.nakshatra },
      gunaMilan: gunaMilanResult,
      compatibility
    });

  } catch (err) {
    console.error("Match error:", err.message);
    res.status(500).json({ error: "Failed to calculate compatibility", details: err.message });
  }
});

module.exports = router;

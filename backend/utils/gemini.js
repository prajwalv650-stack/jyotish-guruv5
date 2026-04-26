// utils/gemini.js - Gemini API wrapper (ALL Gemini calls happen here)

const { GoogleGenerativeAI } = require("@google/generative-ai");

// List of supported Gemini models in order of preference
const SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite-001"
];

// Track model availability and last failed time
const modelStatus = {};
SUPPORTED_MODELS.forEach(model => {
  modelStatus[model] = { available: true, failedAt: null };
});

const MODEL_RETRY_DELAY = 30000; // 30 seconds before retrying a failed model

// Initialize Gemini with API key from environment variable ONLY
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ CRITICAL: GEMINI_API_KEY environment variable is not set!");
    throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in Railway.");
  }
  
  console.log(`✅ Gemini API key loaded (length: ${apiKey.length} chars)`);
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("❌ Failed to initialize GoogleGenerativeAI:", error.message);
    throw error;
  }
};

/**
 * Get the next available model, with fallback to others if one fails
 */
const getAvailableModel = () => {
  const now = Date.now();
  
  // Reset models that have been in cooldown for long enough
  SUPPORTED_MODELS.forEach(model => {
    if (modelStatus[model].failedAt && (now - modelStatus[model].failedAt) > MODEL_RETRY_DELAY) {
      modelStatus[model].available = true;
      modelStatus[model].failedAt = null;
    }
  });
  
  // Return first available model
  for (const model of SUPPORTED_MODELS) {
    if (modelStatus[model].available) {
      return model;
    }
  }
  
  // If all are unavailable, return the first one (most recent failure)
  return SUPPORTED_MODELS[0];
};

/**
 * Mark a model as failed
 */
const markModelFailed = (model) => {
  if (modelStatus[model]) {
    modelStatus[model].available = false;
    modelStatus[model].failedAt = Date.now();
  }
};

/**
 * Send a prompt to Gemini and get text response with fallback to other models
 */
const askGemini = async (prompt) => {
  try {
    console.log("🔵 Starting askGemini...");
    const genAI = getGeminiClient();
    const availableModels = SUPPORTED_MODELS.filter(m => modelStatus[m].available);
    
    console.log(`📊 Available models: ${availableModels.length}/${SUPPORTED_MODELS.length}`);
    
    if (availableModels.length === 0) {
      // All models in cooldown, try all in order
      availableModels.push(...SUPPORTED_MODELS);
      console.log("⚠️  All models in cooldown, trying all...");
    }
    
    let lastError;
    
    for (const modelName of availableModels) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`📤 Sending prompt to ${modelName} (${prompt.length} chars)...`);
        
        const result = await model.generateContent(prompt);
        
        if (!result?.response) {
          throw new Error("No response object received from API");
        }
        
        const text = result.response.text();
        if (!text) {
          throw new Error("Empty response text from API");
        }
        
        // Mark model as available if it succeeded
        if (modelStatus[modelName]) {
          modelStatus[modelName].available = true;
          modelStatus[modelName].failedAt = null;
        }
        
        console.log(`✅ Request succeeded with model: ${modelName} (${text.length} chars)`);
        return text;
      } catch (error) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        console.error(`❌ Model ${modelName} failed:`, errorMsg);
        markModelFailed(modelName);
        // Continue to next model
      }
    }
    
    // If all models failed
    console.error("❌ All models exhausted");
    throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
  } catch (error) {
    console.error("🔴 Fatal error in askGemini:", error.message);
    throw error;
  }
};

/**
 * Generate birth chart interpretation with enhanced AI predictions (10 years)
 */
const interpretBirthChart = async (chartData, name, dob = "") => {
  try {
    // Safely extract chart data with fallbacks
    const ascendant = chartData?.ascendant || {};
    const sun = chartData?.sun || {};
    const moon = chartData?.moon || {};
    const planets = chartData?.planets || {};
    
    const lagna = ascendant.sign || "Unknown";
    const sunSign = sun.sign || "Unknown";
    const moonSign = moon.sign || "Unknown";
    
    const prompt = `You are a Vedic astrologer. Analyze this birth chart:

NAME: ${name} | DOB: ${dob}

CHART:
Lagna: ${lagna} (${ascendant.degrees?.toFixed(1) || "N/A"}°) | Sun: ${sunSign} (H${sun.house || "?"})
Moon: ${moonSign} (H${moon.house || "?"}, ${moon.nakshatra || "?"}) | Mercury: ${planets.Mercury?.sign || "?"} (H${planets.Mercury?.house || "?"})
Venus: ${planets.Venus?.sign || "?"} (H${planets.Venus?.house || "?"}) | Mars: ${planets.Mars?.sign || "?"} (H${planets.Mars?.house || "?"})
Jupiter: ${planets.Jupiter?.sign || "?"} (H${planets.Jupiter?.house || "?"}) | Saturn: ${planets.Saturn?.sign || "?"} (H${planets.Saturn?.house || "?"})
Rahu: ${planets.Rahu?.sign || "?"} (H${planets.Rahu?.house || "?"}) | Ketu: ${planets.Ketu?.sign || "?"} (H${planets.Ketu?.house || "?"})

PROVIDE DETAILED 10-YEAR PREDICTION:

1. PERSONALITY (4-5 sentences): Analyze Lagna, Sun, Moon for personality traits, strengths, and challenges.

2. CAREER (4-5 sentences): Analyze 10th house and Jupiter for career path, suitable professions, and financial outlook.

3. RELATIONSHIPS (4-5 sentences): Analyze 7th house and Venus for love, marriage timing, and relationship patterns.

4. HEALTH (3 sentences): Physical constitution, vulnerable areas, and wellness recommendations.

5. NEXT 10 YEARS PREDICTIONS (12-15 sentences - CRITICAL):
   - Years 0-3: Current phase, opportunities, challenges, relationship developments
   - Years 3-5: Mid-term transitions, career changes, major decisions
   - Years 5-7: Significant achievements, family milestones, spiritual growth
   - Years 7-10: Long-term stability, life purpose alignment, legacy building
   
   Base on: Dasha periods, Saturn transits, Jupiter cycles, and planetary periods.

6. STRENGTHS & TALENTS (3 sentences): Key strengths to leverage.

7. CHALLENGES (3 sentences): Areas needing conscious growth with specific solutions.

8. RECOMMENDATIONS (3 sentences): Practical advice and spiritual practices.

Use Vedic astrology principles. Be specific, honest, and encouraging. Format with clear headers.`;

    return await askGemini(prompt);
  } catch (error) {
    console.error("Error in interpretBirthChart:", error.message);
    throw error;
  }
};

/**
 * Generate detailed compatibility analysis for Kundali matching (10+ years outlook)
 */
const interpretCompatibility = async (boyName, girlName, boyMoon, girlMoon, gunaMilanResult) => {
  const score = gunaMilanResult.score || 0;
  const details = gunaMilanResult.details || {};
  
  const prompt = `You are a Vedic astrologer specializing in marriage compatibility.

COUPLE: ${boyName} (Moon: ${boyMoon}) & ${girlName} (Moon: ${girlMoon})
GUNA MILAN SCORE: ${score}/36

BREAKDOWN: ${Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" | ")}

PROVIDE COMPREHENSIVE 10+ YEAR MARRIAGE ANALYSIS:

1. OVERALL COMPATIBILITY (4 sentences): Is this a good match? Base on score and Moon compatibility.

2. EMOTIONAL COMPATIBILITY (4 sentences): How well do they understand each other emotionally? Communication patterns.

3. PHYSICAL & ROMANTIC COMPATIBILITY (3 sentences): Chemistry, passion, and intimate life.

4. FINANCIAL & PRACTICAL LIFE (3 sentences): Money management, lifestyle compatibility, domestic harmony.

5. FAMILY & CHILDREN (3 sentences): Parenting styles, family expansion plans, family harmony.

6. STRENGTHS OF THIS MARRIAGE (6-8 sentences): 
List areas where this couple will succeed, areas of natural harmony, and bonding opportunities.

7. CHALLENGES & SOLUTIONS (6-8 sentences): 
Potential friction areas, different values/styles, and specific solutions to overcome each challenge.

8. NEXT 10+ YEARS MARRIAGE PREDICTIONS (15-18 sentences - MOST IMPORTANT):
   - YEAR 1-3: Honeymoon phase, adjustment period, expectations vs reality, bonding opportunities
   - YEAR 3-5: Stabilization, major decisions (children, home, career), family integration
   - YEAR 5-7: Maturity of relationship, family establishment, career peak, commitment deepening
   - YEAR 7-10: Long-term stability, spiritual partnership, legacy building, joy and fulfillment
   - YEAR 10+: Golden years, continued growth, financial security, life purpose alignment

Base on Moon sign compatibility, Saturn transits, Jupiter cycles, and 7-year marriage cycles.

9. AUSPICIOUS TIMING (2 sentences): Best time for marriage and major life events.

10. REMEDIES & ADVICE (4 sentences): 
Specific practices to strengthen bond, communication techniques, date ideas, and how to navigate challenges together.

11. FINAL RECOMMENDATION (2 sentences): 
Clear verdict on proceeding with marriage and likelihood of long-term success.

Score interpretation: <18=challenging, 18-24=acceptable, 24-32=good, 32-36=excellent

Use Vedic astrology principles. Be honest but diplomatic. Provide actionable marriage advice. Format with clear headers.`;

  return await askGemini(prompt);
};

/**
 * Generate horoscope for a moon sign
 */
const generateHoroscope = async (moonSign, period) => {
  const prompt = `
You are a Vedic astrologer. Generate a ${period} horoscope for the moon sign ${moonSign}.

Please cover:
1. **Overall Energy**: General theme for the ${period}
2. **Love & Relationships**: What to expect
3. **Career & Finance**: Professional and financial outlook
4. **Health**: Wellness guidance
5. **Lucky Number & Color**: One lucky number and color for the ${period}

Keep it insightful, practical, and inspiring. Use Vedic astrology principles.
Format with clear section headers.
Write about 200-250 words total.
`;
  return await askGemini(prompt);
};

module.exports = {
  interpretBirthChart,
  interpretCompatibility,
  generateHoroscope,
  getAvailableModel,
  modelStatus,
  SUPPORTED_MODELS
};

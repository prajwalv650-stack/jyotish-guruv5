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
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
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
  const genAI = getGeminiClient();
  const availableModels = SUPPORTED_MODELS.filter(m => modelStatus[m].available);
  
  if (availableModels.length === 0) {
    // All models in cooldown, try all in order
    availableModels.push(...SUPPORTED_MODELS);
  }
  
  let lastError;
  
  for (const modelName of availableModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      
      // Mark model as available if it succeeded
      if (modelStatus[modelName]) {
        modelStatus[modelName].available = true;
        modelStatus[modelName].failedAt = null;
      }
      
      console.log(`✅ Request succeeded with model: ${modelName}`);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Model ${modelName} failed: ${error.message}`);
      markModelFailed(modelName);
      // Continue to next model
    }
  }
  
  // If all models failed
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
};

/**
 * Generate birth chart interpretation with enhanced AI predictions
 */
const interpretBirthChart = async (chartData, name) => {
  // Extract key data for more detailed analysis
  const lagna = chartData.ascendant?.sign || "Unknown";
  const sun = chartData.sun?.sign || "Unknown";
  const moon = chartData.moon?.sign || "Unknown";
  const venus = chartData.planets?.Venus?.sign || "Unknown";
  const mars = chartData.planets?.Mars?.sign || "Unknown";
  const jupiter = chartData.planets?.Jupiter?.sign || "Unknown";
  const saturn = chartData.planets?.Saturn?.sign || "Unknown";
  
  const prompt = `
You are an expert Vedic astrologer with deep knowledge of natal chart interpretation and predictive astrology.

NATIVE DETAILS:
Name: ${name}

ACCURATE BIRTH CHART DATA:
- Lagna/Ascendant: ${lagna} (${chartData.ascendant?.degrees?.toFixed(2) || "N/A"}°)
- Sun: ${sun} (House ${chartData.sun?.house || "N/A"})
- Moon: ${moon} (House ${chartData.moon?.house || "N/A"}, Nakshatra: ${chartData.moon?.nakshatra || "N/A"})
- Mercury: ${chartData.planets?.Mercury?.sign || "N/A"} (House ${chartData.planets?.Mercury?.house || "N/A"})
- Venus: ${venus} (House ${chartData.planets?.Venus?.house || "N/A"})
- Mars: ${mars} (House ${chartData.planets?.Mars?.house || "N/A"})
- Jupiter: ${jupiter} (House ${chartData.planets?.Jupiter?.house || "N/A"})
- Saturn: ${saturn} (House ${chartData.planets?.Saturn?.house || "N/A"})
- Rahu: ${chartData.planets?.Rahu?.sign || "N/A"} (House ${chartData.planets?.Rahu?.house || "N/A"})
- Ketu: ${chartData.planets?.Ketu?.sign || "N/A"} (House ${chartData.planets?.Ketu?.house || "N/A"})

ANALYSIS INSTRUCTIONS:
Use classical Vedic astrology principles to provide accurate, data-driven predictions.

Please provide a detailed interpretation covering:

1. **Personality & Core Nature** (4-5 sentences):
   - Analyze Lagna for overall personality and health
   - Consider Sun for identity and ego
   - Include Moon for emotional nature
   - Mention key strengths and innate challenges

2. **Career & Finances** (4-5 sentences):
   - Analyze 10th house ruler and career indicators
   - Consider Jupiter for expansion and luck
   - Mercury for intellectual pursuits
   - Predict suitable professions and financial patterns

3. **Love & Relationships** (3-4 sentences):
   - Analyze 7th house and Venus for romantic life
   - Mars influence on passion and compatibility
   - Saturn's role in long-term commitment
   - Timeline for significant relationships

4. **Health Patterns** (2-3 sentences):
   - Moon and 8th house influence
   - Lagna strength for physical constitution
   - Vulnerable periods and health recommendations

5. **Life Predictions** (5-6 sentences):
   - Current Dasha/planetary period influence
   - Next 2-3 years outlook and major events
   - Saturn transit effects if applicable
   - Auspicious periods for major decisions
   - Challenges to be prepared for

6. **Spiritual & Personal Growth** (2-3 sentences):
   - Nodes (Rahu/Ketu) spiritual lessons
   - Saturn's wisdom and maturity phases
   - Recommended practices or focus areas

Keep predictions specific, honest, and based on planetary positions.
Use Vedic astrology terminology and principles.
Provide actionable insights while maintaining accuracy.
Format with clear headers as shown above.
`;
  return await askGemini(prompt);
};

/**
 * Generate compatibility summary for Kundali matching
 */
const interpretCompatibility = async (boyName, girlName, boyMoon, girlMoon, gunaMilanResult) => {
  const prompt = `
You are a Vedic astrologer specializing in Kundali matching.

MATCHING DETAILS:
- Person 1: ${boyName}, Moon Sign: ${boyMoon}
- Person 2: ${girlName}, Moon Sign: ${girlMoon}

GUNA MILAN SCORE: ${gunaMilanResult.score} / 36

BREAKDOWN:
${Object.entries(gunaMilanResult.details).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Please provide:
1. **Overall Compatibility**: One sentence summarizing the match quality
2. **Strengths**: 2-3 areas where this couple will thrive
3. **Challenges**: 1-2 areas to be mindful of
4. **Recommendation**: Final advice about this union (1-2 sentences)

Score interpretation: <18 = challenging, 18-24 = acceptable, 24-32 = good, 32-36 = excellent
Be honest but diplomatic.
`;
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

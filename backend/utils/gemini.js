// utils/gemini.js - Gemini API wrapper (ALL Gemini calls happen here)

const { GoogleGenerativeAI } = require("@google/generative-ai");

// List of supported Gemini models in order of preference
// Using correct model names with full paths
const SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001"
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
    
    // Try models in order
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    let lastError;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Add safety settings to avoid content filtering issues
        const response = await model.generateContent({
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          }
        });
        
        // Check if we got a valid response
        if (response && response.response && response.response.text) {
          const text = response.response.text();
          if (text && text.length > 0) {
            console.log(`✅ Request succeeded with model: ${modelName} (${text.length} chars)`);
            return text;
          }
        }
        
        throw new Error("Empty response from model");
      } catch (error) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        console.error(`❌ Model ${modelName} failed:`, errorMsg);
        // Continue to next model
      }
    }
    
    // If all models failed, throw error
    console.error("❌ All models exhausted");
    throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
  } catch (error) {
    console.error("🔴 Fatal error in askGemini:", error.message);
    throw error;
  }
};

/**
 * Generate birth chart interpretation with 10 year predictions
 */
const interpretBirthChart = async (chartData, name, dob = "") => {
  try {
    // Safely extract chart data
    const ascendant = chartData?.ascendant || {};
    const sun = chartData?.sun || {};
    const moon = chartData?.moon || {};
    const planets = chartData?.planets || {};
    
    const prompt = `Analyze this birth chart and provide predictions:

Name: ${name}
Lagna: ${ascendant.sign || "?"} | Sun: ${sun.sign || "?"} | Moon: ${moon.sign || "?"}

Provide:
1. Personality (3-4 sentences)
2. Career outlook (3-4 sentences) 
3. Relationships (3-4 sentences)
4. Next 10 years prediction (8-10 sentences covering years 1-3, 3-5, 5-10)
5. Key advice (2-3 sentences)

Be concise and specific.`;

    return await askGemini(prompt);
  } catch (error) {
    console.error("Error in interpretBirthChart:", error.message);
    throw error;
  }
};

/**
 * Generate compatibility analysis for Kundali matching
 */
const interpretCompatibility = async (boyName, girlName, boyMoon, girlMoon, gunaMilanResult) => {
  const score = gunaMilanResult.score || 0;
  
  const prompt = `Analyze marriage compatibility:

${boyName} (Moon: ${boyMoon}) & ${girlName} (Moon: ${girlMoon})
Guna Milan Score: ${score}/36

Provide:
1. Overall compatibility assessment (3-4 sentences)
2. Emotional & romantic compatibility (3-4 sentences)
3. Strengths of this marriage (3-4 sentences)
4. Potential challenges (3 sentences)
5. Next 10 years marriage prediction (8-10 sentences)
6. Final recommendation (2-3 sentences)

Be honest and specific.`;

  return await askGemini(prompt);
};

/**
 * Generate horoscope for a moon sign
 */
const generateHoroscope = async (moonSign, period) => {
  const prompt = `Generate a ${period} horoscope for moon sign ${moonSign}.

Provide:
1. Overall energy and themes
2. Love & relationships outlook  
3. Career & finances
4. Health guidance
5. Lucky number & color

Be concise, practical, and inspiring. Use Vedic astrology principles.`;

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

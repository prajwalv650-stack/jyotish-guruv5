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
    
    const prompt = `
You are an expert Vedic astrologer specializing in natal chart analysis and long-term predictive astrology.

NATIVE DETAILS:
Name: ${name}
Date of Birth: ${dob}

ACCURATE BIRTH CHART DATA:
Lagna/Ascendant: ${lagna} (${ascendant.degrees?.toFixed(2) || "N/A"}°)
Sun: ${sunSign} (House ${sun.house || "N/A"})
Moon: ${moonSign} (House ${moon.house || "N/A"}, Nakshatra: ${moon.nakshatra || "N/A"})
Mercury: ${planets.Mercury?.sign || "N/A"} (House ${planets.Mercury?.house || "N/A"})
Venus: ${planets.Venus?.sign || "N/A"} (House ${planets.Venus?.house || "N/A"})
Mars: ${planets.Mars?.sign || "N/A"} (House ${planets.Mars?.house || "N/A"})
Jupiter: ${planets.Jupiter?.sign || "N/A"} (House ${planets.Jupiter?.house || "N/A"})
Saturn: ${planets.Saturn?.sign || "N/A"} (House ${planets.Saturn?.house || "N/A"})
Rahu: ${planets.Rahu?.sign || "N/A"} (House ${planets.Rahu?.house || "N/A"})
Ketu: ${planets.Ketu?.sign || "N/A"} (House ${planets.Ketu?.house || "N/A"})

DETAILED ANALYSIS:

1. **PERSONALITY & CORE NATURE** (6-8 sentences):
Provide a comprehensive analysis of ${name}'s fundamental personality traits, strengths, and innate challenges based on:
- Lagna for physical appearance and overall personality
- Sun sign for core identity, ego, and life purpose
- Moon sign for emotional nature and subconscious patterns
- Ascendant lord's position for personality expression

2. **CAREER & PROFESSIONAL PATH** (6-8 sentences):
Detail suitable professions and career trajectory including:
- 10th house analysis and its ruler's position
- Jupiter's role in expansion and professional luck
- Mercury's influence on communication and intellectual work
- Saturn's timing for career achievements and structured growth
- Specific career suggestions matching planetary positions

3. **LOVE, MARRIAGE & RELATIONSHIPS** (6-8 sentences):
Provide relationship guidance covering:
- 7th house for marriage and partnership
- Venus for romantic nature and attraction
- Mars for passion and physical compatibility
- Moon for emotional compatibility needs
- Timing of significant relationships (next 3-5 years)

4. **HEALTH & WELLNESS** (4-5 sentences):
Health patterns and recommendations:
- Lagna strength for physical constitution
- Moon's influence on mental health
- Areas prone to health challenges
- Recommended wellness practices

5. **FINANCIAL PROSPERITY** (5-6 sentences):
Financial outlook and wealth potential:
- 2nd and 11th house analysis for wealth
- Jupiter's role in financial expansion
- Saturn's lessons in financial discipline
- Areas of financial opportunity
- Investment timing and financial planning

6. **NEXT 10 YEARS DETAILED PREDICTIONS** (15-20 sentences - THIS IS CRITICAL):

Provide YEAR-BY-YEAR major events, opportunities, and challenges for the next 10 years:

CURRENT YEAR TO NEXT 2-3 YEARS:
- Major themes and life focus areas
- Opportunities and challenges
- Relationship developments
- Career/financial movements
- Health considerations

YEARS 3-5 (MID-TERM):
- Significant life transitions expected
- Career advancements or changes
- Relationship milestones (marriage, children, etc.)
- Financial growth periods
- Health improvements or challenges

YEARS 5-10 (LONG-TERM):
- Major life achievements and goals
- Spiritual growth and maturity
- Career peak periods or shifts
- Family expansion (if applicable)
- Wealth accumulation timeline
- Important timing for major decisions

Base predictions on:
- Current planetary transits and Dasha periods
- Saturn transits and life lessons
- Jupiter's beneficial periods (Guru Peyarchi)
- 7-year cycles and Saturn Returns
- Nodal cycles and spiritual evolution

7. **SPIRITUAL & PERSONAL GROWTH** (4-5 sentences):
- Rahu/Ketu axis for spiritual lessons
- Saturn's wisdom phases and maturity
- Recommended spiritual practices
- Life purpose and soul lessons

8. **STRENGTHS & TALENTS** (3-4 sentences):
Specific talents and strengths to leverage.

9. **CHALLENGES TO OVERCOME** (3-4 sentences):
Areas requiring conscious work and growth.

10. **REMEDIES & RECOMMENDATIONS** (3-4 sentences):
Practical advice for maximizing positive karma and mitigating challenges.

IMPORTANT GUIDELINES:
- Use classical Vedic astrology terminology (Dasha, Rashi, Bhava, Nakshatra, etc.)
- Provide specific, actionable predictions based on planetary positions
- Be honest but constructive in addressing challenges
- Focus on the 10-year outlook as the primary prediction period
- Use clear section headers as shown above
- Write in an insightful, professional, and encouraging tone
- Base all predictions on legitimate Vedic astrology principles
`;

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
  const prompt = `
You are an expert Vedic astrologer specializing in comprehensive Kundali matching and marriage compatibility analysis.

COUPLE DETAILS:
- Person 1 (Male): ${boyName}, Moon Sign: ${boyMoon}
- Person 2 (Female): ${girlName}, Moon Sign: ${girlMoon}

GUNA MILAN SCORE: ${gunaMilanResult.score} / 36

DETAILED GUNA BREAKDOWN:
${Object.entries(gunaMilanResult.details).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

COMPREHENSIVE ANALYSIS:

1. **OVERALL COMPATIBILITY ASSESSMENT** (4-5 sentences):
Provide a thorough overview of this couple's marriage potential:
- Overall compatibility level and quality of match
- Basic compatibility of temperament and nature
- Long-term relationship potential
- Key factors contributing to success or challenges

2. **EMOTIONAL & TEMPERAMENT COMPATIBILITY** (5-6 sentences):
Based on Moon signs and emotional nature:
- Emotional understanding and empathy between partners
- Conflict resolution patterns
- Support and comfort provision in relationship
- Emotional intimacy and bonding potential

3. **INTELLECTUAL & SOCIAL COMPATIBILITY** (4-5 sentences):
How well they relate intellectually and socially:
- Communication compatibility
- Shared interests and social compatibility
- Intellectual stimulation in relationship
- Friendship and companionship quality

4. **PHYSICAL & ROMANTIC COMPATIBILITY** (4-5 sentences):
Passion and romantic aspects:
- Physical attraction and chemistry
- Intimate life compatibility
- Passion and desire balance
- Romance and affection patterns

5. **FINANCIAL & PRACTICAL COMPATIBILITY** (4-5 sentences):
Material and practical life together:
- Financial planning and money management compatibility
- Work-life balance support
- Domestic harmony and household management
- Practical living arrangements compatibility

6. **FAMILY & CHILDREN** (4-5 sentences):
Family life and parenting:
- Parenting styles and agreement on values
- Family relationships and in-law compatibility
- Children planning and family expansion
- Family responsibility sharing

7. **STRENGTHS OF THIS MARRIAGE** (6-8 sentences):
Detailed list of areas where this couple will thrive:
- Specific strengths from Moon sign compatibility
- Areas of natural support and harmony
- Positive cycles and timing advantages
- Talents they bring to relationship
- Bonding opportunities and joint interests

8. **CHALLENGES & AREAS OF CONCERN** (6-8 sentences):
Honest assessment of challenges:
- Potential areas of friction or misunderstanding
- Communication challenges
- Different values or lifestyle preferences
- Timing mismatches in personal goals
- Recommended approaches to overcome challenges

9. **NEXT 10+ YEARS DETAILED MARRIAGE PREDICTIONS** (20-25 sentences - MOST IMPORTANT):

Provide YEAR-BY-YEAR predictions for the first 10 years of marriage:

**FIRST YEAR (Honeymoon Phase)**:
- Adjustment period and bonding
- Expectations vs. reality
- Key adjustments needed
- Opportunities for deepening connection

**YEARS 2-3**:
- Relationship stabilization
- Children planning considerations
- Career/financial developments
- Family integration challenges

**YEARS 4-5**:
- Mid-relationship phase
- Major decisions (children, home, career)
- Financial growth opportunities
- Potential crisis periods requiring attention

**YEARS 5-7**:
- Maturation of relationship
- Family establishment (children if planned)
- Career advancements
- Life purpose alignment

**YEARS 7-10**:
- Long-term stability assessment
- Relationship depth and commitment
- Family responsibilities peak
- Future planning and goals

**10+ YEARS**:
- Golden years of marriage
- Spiritual partnership evolution
- Legacy and life purpose
- Continued growth and adaptation

Predict based on:
- Moon sign compatibility cycles
- Saturn transits and marriage tests
- Jupiter's beneficial periods
- 7-year marriage cycles
- Nodal influences on relationships
- Timing of major life events

10. **AUSPICIOUS TIMING FOR MARRIAGE** (3-4 sentences):
Best timing for marriage and major life events together.

11. **REMEDIES & RECOMMENDATIONS** (6-8 sentences):
Practical guidance to strengthen marriage:
- Specific remedies for challenging areas
- Spiritual practices to do together
- Communication techniques
- Date nights and bonding activities
- How to navigate challenges together
- Maximizing positive karma periods

12. **FINAL VERDICT** (3-4 sentences):
- Clear recommendation on proceeding with marriage
- Likelihood of long-term success
- Overall encouragement or caution
- Hope and optimism for the relationship

IMPORTANT GUIDELINES:
- Use Vedic astrology principles and terminology
- Be honest but diplomatic about challenges
- Provide specific, actionable marriage advice
- Focus heavily on 10+ year outlook
- Use clear section headers as shown
- Maintain professional, encouraging tone
- Base all predictions on Moon sign compatibility and Guna Milan principles
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

// utils/gemini.js - Gemini API wrapper (ALL Gemini calls happen here)

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with API key from environment variable ONLY
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Send a prompt to Gemini and get text response
 */
const askGemini = async (prompt) => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Generate birth chart interpretation
 */
const interpretBirthChart = async (chartData, name) => {
  const prompt = `
You are a Vedic astrologer. Based on the following birth chart data, provide a detailed interpretation.

Person: ${name}

BIRTH CHART DATA:
- Lagna (Ascendant): ${chartData.ascendant.sign} at ${chartData.ascendant.degrees}°
- Sun Sign: ${chartData.sun.sign} in House ${chartData.sun.house}
- Moon Sign (Rashi): ${chartData.moon.sign} in House ${chartData.moon.house}, Nakshatra: ${chartData.moon.nakshatra}
- Mercury: ${chartData.planets.Mercury.sign} in House ${chartData.planets.Mercury.house}
- Venus: ${chartData.planets.Venus.sign} in House ${chartData.planets.Venus.house}
- Mars: ${chartData.planets.Mars.sign} in House ${chartData.planets.Mars.house}
- Jupiter: ${chartData.planets.Jupiter.sign} in House ${chartData.planets.Jupiter.house}
- Saturn: ${chartData.planets.Saturn.sign} in House ${chartData.planets.Saturn.house}
- Rahu: ${chartData.planets.Rahu.sign} in House ${chartData.planets.Rahu.house}
- Ketu: ${chartData.planets.Ketu.sign} in House ${chartData.planets.Ketu.house}

Please provide:
1. **Personality Analysis** (based on Lagna, Sun, Moon): 3-4 sentences about character, strengths, challenges
2. **Career Insights** (based on 10th house and relevant planets): 2-3 sentences about suitable careers and professional life
3. **Relationships** (based on 7th house and Venus): 2 sentences
4. **Future Predictions** (next 1-2 years, based on planetary transits and dashas): 3-4 sentences

Keep the tone insightful, positive yet honest. Use Vedic astrology principles.
Format with clear sections using the headers above.
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
  generateHoroscope
};

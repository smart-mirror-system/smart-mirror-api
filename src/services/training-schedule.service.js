const { GoogleGenAI } = require('@google/genai');

const SYSTEM_PROMPT = `
  You are an expert AI personal trainer embedded within a Smart Mirror Healthcare Ecosystem. 
  Your task is to generate a highly personalized, safe, and effective weekly training schedule.
  
  ### INSTRUCTIONS:
  1. Analyze the provided user profile.
  2. Design a balanced weekly workout routine (Monday - Sunday).
  3. Include rest days.
  4. Keep exercise descriptions concise for a smart mirror display.
  
  ### RULES:
  - Return the output EXCLUSIVELY as a valid JSON object.
  - Do NOT wrap the JSON in markdown code blocks.
  
  ### EXPECTED JSON SCHEMA:
  {
    "summary_message": "A brief, motivating one-sentence message for the mirror UI.",
    "schedule": [
      {
        "day": "Monday",
        "focus": "Upper Body / Cardio / Rest",
        "exercises": [
          { "name": "Exercise Name", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Brief form tip" }
        ]
      }
    ]
  }
`;

/**
 * Generates a workout schedule using Gemini.
 * @param {Object} userProfile - The user's physical profile and goals
 * @returns {Object} The parsed JSON schedule
 */
async function generateTrainingSchedule(userProfile) {
  try {
    const aiClient = new GoogleGenAI({});
    const profileString = JSON.stringify(userProfile);
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: SYSTEM_PROMPT + '\n\nUser Profile: ' + profileString,
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating training schedule:', error);
    throw error;
  }
}

module.exports = { generateTrainingSchedule };

function loadEnv() {
  require('dotenv').config();
  const required = ['MONGO_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
  for (const k of required) {
    if (!process.env[k]) {
      throw new Error(`Missing required env var: ${k}`);
    }
  }
}

module.exports = { loadEnv };

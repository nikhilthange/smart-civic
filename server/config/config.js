require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "smart_civic_jwt_secret_key_12345",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  geminiApiKey: process.env.GEMINI_API_KEY,
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || "",
    baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    model: process.env.NVIDIA_MODEL || "meta/llama-3.2-90b-vision-instruct",
  },
};

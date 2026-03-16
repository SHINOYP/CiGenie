const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the server root
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      console.log(`✅ Success with ${modelName}:`, result.response.text());
    } catch (err) {
      console.error(`❌ Error with ${modelName}:`, err.message);
    }
  }
}

listModels();

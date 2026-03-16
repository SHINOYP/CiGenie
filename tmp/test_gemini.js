const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "server/.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There isn't a direct listModels on genAI in the latest SDKs sometimes, 
    // it's usually done via a fetch or similar if not exposed.
    // However, we can try to just generate a simple content to see if it works.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash");
    console.log(result.response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-pro");
  } catch (err) {
    console.error("Error with gemini-pro:", err.message);
  }
}

listModels();

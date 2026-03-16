const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testRawApi() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log("Fetching available models...");
    const response = await axios.get(url);
    const models = response.data.models;
    fs.writeFileSync(path.join(__dirname, "models_output.json"), JSON.stringify(models, null, 2));
    console.log(`Saved ${models.length} models to models_output.json`);
    
    const flashModels = models.filter(m => m.name.toLowerCase().includes("flash"));
    console.log("Flash models found:", flashModels.map(m => m.name));
  } catch (err) {
    if (err.response) {
      console.error("API Error Status:", err.response.status);
      console.error("API Error Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Request Error:", err.message);
    }
  }
}

testRawApi();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SUMMARY_SYSTEM_PROMPT, getSummaryUserPrompt } = require("../templates/aiPrompts");

const store = require("../models/store");

/**
 * Persistent Gemini client instance
 */
let geminiClient = null;
let currentApiKey = null;

/**
 * Initializes or returns the existing Gemini client
 */
const getGeminiClient = async () => {
  const config = await store.getConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[AIService] GEMINI_API_KEY not set. AI summaries will be skipped.");
    return null;
  }

  // Re-initialize if the key has changed or client doesn't exist
  if (!geminiClient || currentApiKey !== apiKey) {
    geminiClient = new GoogleGenerativeAI(apiKey);
    currentApiKey = apiKey;
  }
  
  return geminiClient;
};

/**
 * Truncates logs to a safe length for the API prompt.
 */
const truncateLogs = (logs, maxChars = 4000) => {
  if (!logs) return "(no logs available)";
  const logText = Array.isArray(logs) ? logs.join("\n") : logs;
  if (logText.length <= maxChars) return logText;
  // Keep the tail of logs — failures are usually at the end
  return "...[truncated]...\n" + logText.slice(-maxChars);
};

/**
 * Generates an AI-powered summary for Jenkins build/test logs
 */
const generateBuildSummary = async ({ logs, status, action }) => {
  const client = await getGeminiClient();
  if (!client) return null;

  const model = client.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: { responseMimeType: "application/json" }
  });

  const logText = truncateLogs(logs);
  const actionLabel = action === "test" ? "Test Run" : "Build/Deploy";
  const userPrompt = getSummaryUserPrompt(actionLabel, status, logText);

  try {
    const result = await model.generateContent(`${SUMMARY_SYSTEM_PROMPT}\n\n${userPrompt}`);
    const rawResponse = result.response.text();
    if (!rawResponse) return null;

    const parsed = JSON.parse(rawResponse);
    return {
      headline: parsed.headline || "Build completed.",
      reason: parsed.reason || "",
      suggestion: parsed.suggestion || "",
      type: parsed.type || "info",
    };
  } catch (err) {
    console.error("[AIService] Failed to get AI summary:", err.message);
    return null;
  }
};

module.exports = {
  summarizeLogs: generateBuildSummary // Keep original name for backward compatibility
};

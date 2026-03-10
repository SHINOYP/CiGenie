const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeLogs(logs) {

 const prompt = `
You are a CI/CD debugging expert.

Analyze these Jenkins logs.

Provide:
1. Failure summary
2. Root cause
3. Suggestions to fix

Logs:
${logs.join("\n")}
`;

 const response = await openai.chat.completions.create({
   model: "gpt-4.1-mini",
   messages: [
     { role: "user", content: prompt }
   ]
 });

 return response.choices[0].message.content;
}

module.exports = analyzeLogs;
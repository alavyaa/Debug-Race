/**
 * OpenRouter AI configuration
 */

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "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",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://debug-race-ztam.onrender.com",
    "X-Title": "Debug Race"
  }
});

// Free models to try in order
const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const SKILL_FOCUS = {
  1: ["syntax", "data types", "basic operators", "input/output"],
  2: ["loops", "conditionals", "strings", "arrays"],
  3: ["functions", "recursion", "scope", "error handling"],
  4: ["data structures", "algorithms", "complexity", "OOP"],
  5: ["advanced algorithms", "edge cases", "optimization"]
};

const LEVEL_NAMES = {
  1: "Rookie Grid",
  2: "Code Circuit",
  3: "Logic Grand Prix",
  4: "Algorithm Arena",
  5: "Championship Circuit"
};

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Try one model
 */
const tryModel = async (model, prompt) => {
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content || content.trim() === "") throw new Error("Empty AI response");
  return content;
};

/**
 * Generate AI Question with fallback models + retry
 */
const generateQuestion = async ({ language, difficulty, type, performanceData }) => {
  const skills = SKILL_FOCUS[difficulty] || SKILL_FOCUS[1];
  const levelName = LEVEL_NAMES[difficulty] || "Rookie Grid";

  let skillFocus;
  if (performanceData?.weakTopics?.length) {
    skillFocus = performanceData.weakTopics[0];
  } else {
    skillFocus = skills[Math.floor(Math.random() * skills.length)];
  }

  const prompt = `You are a coding question generator for a competitive coding game. Return ONLY valid JSON, no explanation, no markdown, no code blocks.

Generate a ${type} question for ${language} programming, difficulty ${difficulty}/5 (${levelName}), topic: ${skillFocus}.

Return EXACTLY this JSON format:
{
  "question": "question text here",
  "code": "code snippet here",
  "topic": "${skillFocus}",
  "options": [
    {"id":"A","text":"option 1"},
    {"id":"B","text":"option 2"},
    {"id":"C","text":"option 3"},
    {"id":"D","text":"option 4"}
  ],
  "correctAnswer":"A",
  "explanation":"explanation here"
}`;

  // Try each model in order
  for (let modelIndex = 0; modelIndex < FREE_MODELS.length; modelIndex++) {
    const model = FREE_MODELS[modelIndex];

    // Retry up to 2 times per model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`🤖 Trying model: ${model} (attempt ${attempt})`);

        const content = await tryModel(model, prompt);
        console.log("📥 Raw AI response:", content.substring(0, 200));

        let questionData;
        try {
          questionData = JSON.parse(content);
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Invalid JSON response");
          questionData = JSON.parse(jsonMatch[0]);
        }

        if (!questionData.question || !questionData.options || !questionData.correctAnswer) {
          throw new Error("Invalid AI question format");
        }

        questionData.timeLimit = type === "DEBUG" ? 45 : 30;
        questionData.language = language;
        questionData.difficulty = difficulty;
        questionData.type = type;

        console.log(`✅ AI Question Generated via ${model}`);
        return questionData;

      } catch (error) {
        console.error(`❌ Model ${model} attempt ${attempt} failed: ${error.message}`);

        if (error.message.includes("429") || error.message.includes("rate limit")) {
          // Rate limited — wait before retry or next model
          const waitTime = attempt === 1 ? 15000 : 30000;
          console.log(`⏳ Rate limited. Waiting ${waitTime / 1000}s...`);
          await sleep(waitTime);
        } else if (error.message.includes("404")) {
          // Model not found — skip to next model immediately
          console.log(`⏭️ Model not available, trying next...`);
          break;
        } else {
          // Other error — short wait then retry
          if (attempt < 2) await sleep(3000);
        }
      }
    }

    // Wait between model switches to avoid hammering
    if (modelIndex < FREE_MODELS.length - 1) {
      await sleep(2000);
    }
  }

  // All models failed
  throw new Error("All AI models failed");
};

module.exports = {
  generateQuestion
};
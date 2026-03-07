/**
 * OpenRouter AI configuration
 */

const OpenAI = require("openai");

/**
 * ⚠️ Replace this with your OpenRouter API key
 */
const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://debug-race-ztam.onrender.com",
    "X-Title": "Debug Race"
  }
});

/**
 * Skill focus areas
 */
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
 * Generate AI Question
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

  const systemPrompt = `
You are a coding question generator for a competitive coding game.

Language: ${language}
Difficulty: ${difficulty}/5 (${levelName})
Type: ${type}
Focus topic: ${skillFocus}

Return ONLY JSON in this format:

{
  "question": "text",
  "code": "code snippet",
  "topic": "${skillFocus}",
  "options": [
    {"id":"A","text":"option"},
    {"id":"B","text":"option"},
    {"id":"C","text":"option"},
    {"id":"D","text":"option"}
  ],
  "correctAnswer":"A",
  "explanation":"text"
}
`;

  try {

    console.log(`🤖 Generating ${type} question | ${language} | Level ${difficulty}`);

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the question." }
      ],
      temperature: 0.7,
      max_tokens: 700
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    console.log("📥 Raw AI response:", content);

    let questionData;

    try {
      questionData = JSON.parse(content);
    } catch {

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid JSON response");
      }

      questionData = JSON.parse(jsonMatch[0]);
    }

    if (
      !questionData.question ||
      !questionData.options ||
      !questionData.correctAnswer
    ) {
      throw new Error("Invalid AI question format");
    }

    questionData.timeLimit = type === "DEBUG" ? 45 : 30;
    questionData.language = language;
    questionData.difficulty = difficulty;
    questionData.type = type;

    console.log("✅ AI Question Generated");

    return questionData;

  } catch (error) {

    console.error("❌ AI generation failed:", error.message);

    return getFallbackQuestion(language, type, difficulty, skillFocus);
  }
};


/**
 * Fallback question
 */

const getFallbackQuestion = (language, type, difficulty, skillFocus) => {

  return {
    question: "What is the output of this code?",
    code: "let x = 5;\nconsole.log(x * 2);",
    topic: skillFocus,
    options: [
      { id: "A", text: "10" },
      { id: "B", text: "5" },
      { id: "C", text: "25" },
      { id: "D", text: "Error" }
    ],
    correctAnswer: "A",
    explanation: "5 * 2 = 10",
    timeLimit: type === "DEBUG" ? 45 : 30,
    language,
    difficulty,
    type,
    isAIGenerated: false
  };
};

module.exports = {
  generateQuestion
};

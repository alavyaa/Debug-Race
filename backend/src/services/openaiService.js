

/**
 * OpenRouter configuration
 */
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://debug-race-ztam.onrender.com",
    "X-Title": "Debug Race"
  }
});

/**
 * Skill focus areas by level
 */
const SKILL_FOCUS = {
  1: ["syntax", "data types", "basic operators", "input/output"],
  2: ["loops", "conditionals", "strings", "arrays"],
  3: ["functions", "recursion", "scope", "error handling"],
  4: ["data structures", "algorithms", "complexity", "OOP"],
  5: ["advanced algorithms", "edge cases", "optimization", "design patterns"]
};

/**
 * Level names
 */
const LEVEL_NAMES = {
  1: "Rookie Grid",
  2: "Code Circuit",
  3: "Logic Grand Prix",
  4: "Algorithm Arena",
  5: "Championship Circuit"
};

/**
 * Generate a coding question using AI
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

Return ONLY valid JSON in this format:

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

Do NOT include markdown.
`;

  try {

    console.log(
      `🤖 Generating ${type} question | ${language} | Level ${difficulty} | Focus ${skillFocus}`
    );

   const completion = await openai.chat.completions.create({
  model: "mistralai/devstral-2512:free",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Generate the question." }
  ],
  temperature: 0.7,
  max_tokens: 800
});

    /**
     * Safety check for API response
     */
    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error("Invalid response from AI");
    }

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned empty content");
    }

    console.log("📥 Raw AI response:", content);

    let questionData;

    /**
     * Parse JSON safely
     */
    try {
      questionData = JSON.parse(content);
    } catch (parseError) {

      console.log("⚠️ JSON parsing failed, attempting extraction...");

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response");
      }

      questionData = JSON.parse(jsonMatch[0]);
    }

    /**
     * Validate response fields
     */
    if (
      !questionData.question ||
      !questionData.options ||
      !questionData.correctAnswer ||
      !questionData.explanation
    ) {
      throw new Error("AI returned invalid question format");
    }

    /**
     * Attach metadata
     */
    questionData.timeLimit = type === "DEBUG" ? 45 : 30;
    questionData.language = language;
    questionData.difficulty = difficulty;
    questionData.type = type;
    questionData.topic = questionData.topic || skillFocus;

    console.log("✅ Question generated successfully");

    return questionData;

  } catch (error) {

    console.error("❌ AI generation failed:", error.message);

    console.log("⚠️ Using fallback question");

    return getFallbackQuestion(language, type, difficulty, skillFocus);
  }
};

/**
 * Fallback question generator
 */
const getFallbackQuestion = (language, type, difficulty, skillFocus) => {

  const defaultQuestion = {
    question: "What is the output of this code?",
    code: "let x = 5;\nconsole.log(x * 2);",
    topic: "operators",
    options: [
      { id: "A", text: "10" },
      { id: "B", text: "5" },
      { id: "C", text: "25" },
      { id: "D", text: "Error" }
    ],
    correctAnswer: "A",
    explanation: "5 multiplied by 2 equals 10.",
    timeLimit: type === "DEBUG" ? 45 : 30
  };

  return {
    ...defaultQuestion,
    language,
    difficulty,
    type,
    topic: skillFocus,
    isAIGenerated: false
  };
};

module.exports = {
  generateQuestion
};

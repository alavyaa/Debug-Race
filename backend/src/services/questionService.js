const Question = require("../models/Question");
const { generateQuestion } = require("./openaiService");

/**
 * Generate questions for a race
 */
const generateQuestionsForRace = async (language, level, totalLaps) => {
  const questions = [];
  const questionsPerLap = 2;

  console.log(
    `📚 Generating ${totalLaps * questionsPerLap} questions for ${language} (Level ${level})`
  );

  for (let lap = 1; lap <= totalLaps; lap++) {
    for (let q = 0; q < questionsPerLap; q++) {

      const questionType = lap === 1 ? "MCQ" : q === 0 ? "MCQ" : "DEBUG";

      console.log(`  Generating Lap ${lap}, Question ${q + 1} (${questionType})`);

      try {

        /**
         * Try cached question
         */
        let question = await Question.findOne({
          language,
          difficulty: level,
          type: questionType,
          isAIGenerated: true
        }).skip(Math.floor(Math.random() * 5));

        /**
         * Generate new AI question if cache empty
         */
        if (!question || Math.random() > 0.7) {

          console.log("🤖 Generating new AI question...");

          const questionData = await generateQuestion({
            language,
            difficulty: level,
            type: questionType
          });

          question = await Question.create({
            ...questionData,
            language,
            difficulty: level,
            type: questionType,
            isAIGenerated: true
          });

          console.log("✅ New question created and cached");

        } else {

          console.log(`📦 Using cached question: ${question._id}`);

        }

        questions.push(question);

      } catch (error) {

        console.error("❌ Error generating question:", error.message);

        /**
         * Fallback question if AI fails
         */
        const fallbackQuestion = {
          question: "What is the output?",
          code: "let x = 5;\nconsole.log(x * 2);",
          topic: "operators",
          options: [
            { id: "A", text: "10" },
            { id: "B", text: "5" },
            { id: "C", text: "25" },
            { id: "D", text: "Error" }
          ],
          correctAnswer: "A",
          explanation: "5 * 2 = 10",
          timeLimit: 30
        };

        const question = await Question.create({
          ...fallbackQuestion,
          language,
          difficulty: level,
          type: questionType,
          isAIGenerated: false
        });

        questions.push(question);
      }
    }
  }

  console.log(`✅ Generated ${questions.length} questions`);
  return questions;
};

/**
 * Seed initial questions using AI
 */
const seedQuestionsWithAI = async () => {

  const languages = ["Python", "JavaScript", "Java", "C"];
  const types = ["MCQ", "DEBUG"];

  console.log("🌱 Starting AI question seeding...");

  for (const language of languages) {
    for (let level = 1; level <= 5; level++) {
      for (const type of types) {

        try {

          const existingCount = await Question.countDocuments({
            language,
            difficulty: level,
            type
          });

          if (existingCount >= 3) {
            console.log(`✓ ${language} L${level} ${type}: ${existingCount} questions exist`);
            continue;
          }

          for (let i = 0; i < 3; i++) {

            console.log(`🤖 Generating ${language} L${level} ${type} #${i + 1}...`);

            const questionData = await generateQuestion({
              language,
              difficulty: level,
              type
            });

            await Question.create({
              ...questionData,
              language,
              difficulty: level,
              type,
              isAIGenerated: true
            });

            console.log("✅ Created");

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

        } catch (error) {

          console.error(
            `❌ Error seeding ${language} L${level} ${type}:`,
            error.message
          );

        }
      }
    }
  }

  console.log("✅ Question seeding complete!");
};

/**
 * Adaptive question generation
 */
const getAdaptiveQuestion = async (language, level, type, performanceData) => {

  try {

    console.log(`🎯 Getting adaptive question for ${language} L${level} ${type}`);

    const questionData = await generateQuestion({
      language,
      difficulty: level,
      type,
      performanceData
    });

    const question = await Question.create({
      ...questionData,
      language,
      difficulty: level,
      type,
      isAIGenerated: true
    });

    console.log("✅ Adaptive question generated");

    return question;

  } catch (error) {

    console.error("❌ Error generating adaptive question:", error.message);
    throw error;

  }
};

module.exports = {
  generateQuestionsForRace,
  seedQuestionsWithAI,
  getAdaptiveQuestion
};

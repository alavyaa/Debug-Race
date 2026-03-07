const Question = require('../models/Question');
const { generateQuestion } = require('./openaiService');

/**
 * Generate questions for a race
 * @param {string} language - Programming language
 * @param {number} level - Difficulty level
 * @param {number} totalLaps - Total number of laps
 * @returns {Promise<Array>} - Array of questions
 */
const generateQuestionsForRace = async (language, level, totalLaps) => {
  const questions = [];
  const questionsPerLap = 2;

  console.log(`📚 Generating ${totalLaps * questionsPerLap} questions for ${language} (Level ${level})`);

  for (let lap = 1; lap <= totalLaps; lap++) {
    for (let q = 0; q < questionsPerLap; q++) {
      // Lap 1: MCQ only
      // Lap 2+: First question MCQ, second question DEBUG
      const questionType = lap === 1 ? 'MCQ' : (q === 0 ? 'MCQ' : 'DEBUG');

      console.log(`  Generating Lap ${lap}, Question ${q + 1} (${questionType})`);

      try {
        // Try to get from cache first
        let question = await Question.findOne({
          language,
          difficulty: level,
          type: questionType,
          isAIGenerated: true
        }).skip(Math.floor(Math.random() * 5));

        // If not in cache or want fresh, generate new
        if (!question || Math.random() > 0.7) { // 30% chance to generate fresh
          console.log(`    🤖 Generating new AI question...`);

          const questionData = await generateQuestion({
            language,
            difficulty: level,
            type: questionType
          });

          // Save to database for caching
          question = await Question.create({
            ...questionData,
            language,
            difficulty: level,
            type: questionType,
            isAIGenerated: true
          });

          console.log(`    ✅ New question created and cached`);
        } else {
          console.log(`    📦 Using cached question: ${question._id}`);
        }

        questions.push(question);

    catch (error) {

  console.error(`❌ Error generating question:`, error.message);

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
  const languages = ['Python', 'JavaScript', 'Java', 'C'];
  const types = ['MCQ', 'DEBUG'];
  
  console.log('🌱 Starting AI question seeding...');
  
  for (const language of languages) {
    for (let level = 1; level <= 5; level++) {
      for (const type of types) {
        try {
          // Check if questions exist
          const existingCount = await Question.countDocuments({
            language,
            difficulty: level,
            type
          });
          
          if (existingCount >= 3) {
            console.log(`✓ ${language} L${level} ${type}: ${existingCount} questions exist`);
            continue;
          }
          
          // Generate 3 questions per combination
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
            
            console.log(`  ✅ Created`);
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Error seeding ${language} L${level} ${type}:`, error.message);
        }
      }
    }
  }
  
  console.log('✅ Question seeding complete!');
};

/**
 * Get adaptive question based on performance
 */
const getAdaptiveQuestion = async (language, level, type, performanceData) => {
  try {
    console.log(`🎯 Getting adaptive question for ${language} L${level} ${type}`);
    
    // Generate with performance adaptation
    const questionData = await generateQuestion({
      language,
      difficulty: level,
      type,
      performanceData
    });
    
    // Save and return
    const question = await Question.create({
      ...questionData,
      language,
      difficulty: level,
      type,
      isAIGenerated: true
    });
    
    console.log(`✅ Adaptive question generated`);
    return question;
    
  } catch (error) {
    console.error(`❌ Error generating adaptive question:`, error.message);
    throw error;
  }
};

module.exports = {
  generateQuestionsForRace,
  seedQuestionsWithAI,
  getAdaptiveQuestion
};

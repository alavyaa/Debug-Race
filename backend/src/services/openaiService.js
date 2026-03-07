const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// Skill focus areas by level
const SKILL_FOCUS = {
  1: ['syntax', 'data types', 'basic operators', 'input/output'],
  2: ['loops', 'conditionals', 'strings', 'arrays'],
  3: ['functions', 'recursion', 'scope', 'error handling'],
  4: ['data structures', 'algorithms', 'complexity', 'OOP'],
  5: ['advanced algorithms', 'edge cases', 'optimization', 'design patterns']
};

// Level names
const LEVEL_NAMES = {
  1: 'Rookie Grid',
  2: 'Code Circuit',
  3: 'Logic Grand Prix',
  4: 'Algorithm Arena',
  5: 'Championship Circuit'
};

/**
 * Generate a coding question using OpenAI
 * @param {Object} params - Question parameters
 * @param {string} params.language - Programming language
 * @param {number} params.difficulty - Difficulty level (1-5)
 * @param {string} params.type - Question type (MCQ or DEBUG)
 * @param {Object} params.performanceData - Optional performance data for adaptation
 * @returns {Promise<Object>} - Generated question
 */
const generateQuestion = async ({ language, difficulty, type, performanceData }) => {
  const skills = SKILL_FOCUS[difficulty] || SKILL_FOCUS[1];
  const levelName = LEVEL_NAMES[difficulty] || 'Rookie Grid';
  
  // Select skill focus based on performance data or random
  let skillFocus;
  if (performanceData?.weakTopics && performanceData.weakTopics.length > 0) {
    skillFocus = performanceData.weakTopics[0];
  } else {
    skillFocus = skills[Math.floor(Math.random() * skills.length)];
  }

  const systemPrompt = `You are an adaptive coding question generator for a multiplayer competitive coding game called "Debug Race".

Your task is to generate coding questions based on:
- Programming language: ${language}
- Difficulty level: ${difficulty}/5 (${levelName})
- Question type: ${type}
- Skill focus: ${skillFocus}

STRICT RULES:

${type === 'MCQ' ? `
1. MCQ QUESTION REQUIREMENTS:
   - Provide a short code snippet (maximum 10 lines)
   - Ask about output, behavior, or concept
   - Provide EXACTLY 4 options labeled A, B, C, D
   - Only ONE correct answer
   - Make distractors plausible but clearly wrong
   - Keep code concise and focused
   - Avoid unnecessary complexity
` : `
1. DEBUG QUESTION REQUIREMENTS:
   - Provide a buggy code snippet (maximum 15 lines)
   - Include EXACTLY ONE logical or syntax error
   - Error should be subtle but findable
   - Clearly indicate task: "Find and fix the error"
   - Provide 4 fix options labeled A, B, C, D
   - Only ONE option should fix the bug
   - Make other options seem plausible
`}

2. DIFFICULTY GUIDELINES:
   - Rookie Grid (1): Basic syntax, simple operations
   - Code Circuit (2): Logic, outputs, conditionals
   - Logic Grand Prix (3): Functions, loops, scope
   - Algorithm Arena (4): Data structures, complexity analysis
   - Championship Circuit (5): Advanced algorithms, edge cases

3. STRICT OUTPUT FORMAT (JSON only, no markdown):
{
  "question": "Clear question text",
  "code": "Code snippet with \\n for newlines",
  "topic": "${skillFocus}",
  "options": [
    {"id": "A", "text": "Option A text"},
    {"id": "B", "text": "Option B text"},
    {"id": "C", "text": "Option C text"},
    {"id": "D", "text": "Option D text"}
  ],
  "correctAnswer": "A",
  "explanation": "Why this is correct and others are wrong"
}

4. QUALITY REQUIREMENTS:
   - Code must be syntactically valid (except for DEBUG type)
   - Question must be unambiguous
   - Explanation must be educational
   - Options should test understanding, not memorization
   - Time limit should be 30 seconds for MCQ, 45 for DEBUG

Generate a ${type} question for ${language} at level ${difficulty} focusing on ${skillFocus}.
RETURN ONLY VALID JSON WITHOUT MARKDOWN CODE BLOCKS.`;

  try {
    console.log(`🤖 Generating ${type} question for ${language} (Level ${difficulty}, Focus: ${skillFocus})`);
    
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-small",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a ${type} question for ${language} at difficulty ${difficulty}.` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content;
    console.log('📥 Raw AI response:', content);
    
    // Parse JSON response
    let questionData;
    try {
      questionData = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Try to extract JSON from markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate required fields
    if (!questionData.question || !questionData.options || !questionData.correctAnswer || !questionData.explanation) {
      throw new Error('Invalid question format from AI');
    }

    // Add metadata
    questionData.timeLimit = type === 'DEBUG' ? 45 : 30;
    questionData.language = language;
    questionData.difficulty = difficulty;
    questionData.type = type;
    questionData.topic = questionData.topic || skillFocus;

    console.log('✅ Question generated successfully');
    return questionData;

  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    
    // Return fallback question
    console.log('⚠️ Using fallback question');
    return getFallbackQuestion(language, type, difficulty, skillFocus);
  }
};

/**
 * Get a fallback question when AI fails
 */
const getFallbackQuestion = (language, type, difficulty, skillFocus) => {
  const fallbacks = {
    MCQ: {
      Python: {
        1: {
          question: "What is the output of this code?",
          code: "x = 5\nprint(x * 2)",
          topic: "basic operators",
          options: [
            { id: "A", text: "10" },
            { id: "B", text: "5" },
            { id: "C", text: "52" },
            { id: "D", text: "Error" }
          ],
          correctAnswer: "A",
          explanation: "x * 2 multiplies 5 by 2, which equals 10.",
          timeLimit: 30
        },
        2: {
          question: "What does this loop print?",
          code: "for i in range(3):\n    print(i, end=' ')",
          topic: "loops",
          options: [
            { id: "A", text: "0 1 2" },
            { id: "B", text: "1 2 3" },
            { id: "C", text: "0 1 2 3" },
            { id: "D", text: "1 2" }
          ],
          correctAnswer: "A",
          explanation: "range(3) generates 0, 1, 2. The end=' ' prints them on one line.",
          timeLimit: 30
        },
        3: {
          question: "What does this function return?",
          code: "def func(n):\n    if n <= 1:\n        return 1\n    return n * func(n-1)\n\nprint(func(4))",
          topic: "recursion",
          options: [
            { id: "A", text: "24" },
            { id: "B", text: "10" },
            { id: "C", text: "4" },
            { id: "D", text: "Error" }
          ],
          correctAnswer: "A",
          explanation: "This is a factorial function. 4! = 4 × 3 × 2 × 1 = 24.",
          timeLimit: 30
        },
        4: {
          question: "What is the time complexity of this code?",
          code: "def search(arr, target):\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i\n    return -1",
          topic: "complexity",
          options: [
            { id: "A", text: "O(n)" },
            { id: "B", text: "O(1)" },
            { id: "C", text: "O(log n)" },
            { id: "D", text: "O(n²)" }
          ],
          correctAnswer: "A",
          explanation: "Linear search checks each element once, giving O(n) time complexity.",
          timeLimit: 30
        },
        5: {
          question: "What design pattern is this?",
          code: "class Logger:\n    _instance = None\n    def __new__(cls):\n        if not cls._instance:\n            cls._instance = super().__new__(cls)\n        return cls._instance",
          topic: "design patterns",
          options: [
            { id: "A", text: "Singleton" },
            { id: "B", text: "Factory" },
            { id: "C", text: "Observer" },
            { id: "D", text: "Decorator" }
          ],
          correctAnswer: "A",
          explanation: "Singleton pattern ensures only one instance exists by controlling object creation.",
          timeLimit: 30
        }
      },
      JavaScript: {
        1: {
          question: "What is the output?",
          code: "let x = '5';\nconsole.log(x + 3);",
          topic: "data types",
          options: [
            { id: "A", text: "53" },
            { id: "B", text: "8" },
            { id: "C", text: "Error" },
            { id: "D", text: "35" }
          ],
          correctAnswer: "A",
          explanation: "String concatenation occurs because x is a string, resulting in '5' + '3' = '53'.",
          timeLimit: 30
        },
        2: {
          question: "What does this print?",
          code: "const arr = [1, 2, 3];\narr.forEach(x => console.log(x * 2));",
          topic: "arrays",
          options: [
            { id: "A", text: "2 4 6" },
            { id: "B", text: "1 2 3" },
            { id: "C", text: "[2, 4, 6]" },
            { id: "D", text: "Error" }
          ],
          correctAnswer: "A",
          explanation: "forEach iterates and prints each element multiplied by 2.",
          timeLimit: 30
        }
      },
      Java: {
        1: {
          question: "What is printed?",
          code: "int x = 10;\nint y = 5;\nSystem.out.println(x / y);",
          topic: "basic operators",
          options: [
            { id: "A", text: "2" },
            { id: "B", text: "2.0" },
            { id: "C", text: "0" },
            { id: "D", text: "Error" }
          ],
          correctAnswer: "A",
          explanation: "Integer division of 10/5 equals 2 (not 2.0 because both are integers).",
          timeLimit: 30
        }
      },
      C: {
        1: {
          question: "What is the output?",
          code: "#include <stdio.h>\nint main() {\n    int x = 5;\n    printf(\"%d\", x++);\n    return 0;\n}",
          topic: "operators",
          options: [
            { id: "A", text: "5" },
            { id: "B", text: "6" },
            { id: "C", text: "Error" },
            { id: "D", text: "0" }
          ],
          correctAnswer: "A",
          explanation: "Post-increment (x++) prints the value first (5), then increments.",
          timeLimit: 30
        }
      }
    },
    DEBUG: {
      Python: {
        1: {
          question: "Find and fix the error:",
          code: "x = 10\nif x > 5\n    print('Greater')",
          topic: "syntax",
          options: [
            { id: "A", text: "Add colon after if condition: if x > 5:" },
            { id: "B", text: "Change print to Print" },
            { id: "C", text: "Add semicolon at end" },
            { id: "D", text: "Change x > 5 to x >= 5" }
          ],
          correctAnswer: "A",
          explanation: "Python requires a colon (:) after if statements.",
          timeLimit: 45
        },
        2: {
          question: "Find and fix the error:",
          code: "def greet(name):\n    print('Hello, ' + Name)\n\ngreet('World')",
          topic: "variables",
          options: [
            { id: "A", text: "Change 'Name' to 'name'" },
            { id: "B", text: "Add return statement" },
            { id: "C", text: "Change def to function" },
            { id: "D", text: "Remove quotes from World" }
          ],
          correctAnswer: "A",
          explanation: "Variable names are case-sensitive. Should use 'name' not 'Name'.",
          timeLimit: 45
        },
        3: {
          question: "Find and fix the error:",
          code: "def factorial(n):\n    return n * factorial(n - 1)\n\nprint(factorial(5))",
          topic: "recursion",
          options: [
            { id: "A", text: "Add base case: if n <= 1: return 1" },
            { id: "B", text: "Change * to +" },
            { id: "C", text: "Change n - 1 to n + 1" },
            { id: "D", text: "Remove return keyword" }
          ],
          correctAnswer: "A",
          explanation: "Recursive functions need a base case to prevent infinite recursion.",
          timeLimit: 45
        }
      },
      JavaScript: {
        1: {
          question: "Find and fix the error:",
          code: "const name = 'Alice';\nname = 'Bob';\nconsole.log(name);",
          topic: "variables",
          options: [
            { id: "A", text: "Change const to let" },
            { id: "B", text: "Remove const keyword" },
            { id: "C", text: "Add var before name" },
            { id: "D", text: "Change console.log to print" }
          ],
          correctAnswer: "A",
          explanation: "const variables cannot be reassigned. Use let or var instead.",
          timeLimit: 45
        }
      },
      Java: {
        1: {
          question: "Find and fix the error:",
          code: "public class Main {\n    public static void main(String[] args) {\n        int x = 5\n        System.out.println(x);\n    }\n}",
          topic: "syntax",
          options: [
            { id: "A", text: "Add semicolon after int x = 5" },
            { id: "B", text: "Change int to Integer" },
            { id: "C", text: "Remove public keyword" },
            { id: "D", text: "Change println to print" }
          ],
          correctAnswer: "A",
          explanation: "Java requires semicolons at the end of statements.",
          timeLimit: 45
        }
      },
      C: {
        1: {
          question: "Find and fix the error:",
          code: "#include <stdio.h>\nint main() {\n    int arr[3] = {1, 2, 3};\n    printf(\"%d\", arr[3]);\n    return 0;\n}",
          topic: "arrays",
          options: [
            { id: "A", text: "Change arr[3] to arr[2]" },
            { id: "B", text: "Change int arr[3] to int arr[4]" },
            { id: "C", text: "Remove return 0" },
            { id: "D", text: "Change %d to %s" }
          ],
          correctAnswer: "A",
          explanation: "Array indices are 0-based. Valid indices are 0, 1, 2 for an array of size 3.",
          timeLimit: 45
        }
      }
    }
  };

  // Get fallback or default
  const langFallbacks = fallbacks[type]?.[language] || fallbacks[type]?.Python;
  const question = langFallbacks?.[difficulty] || langFallbacks?.[1];

  return {
    ...question,
    language,
    difficulty,
    type,
    isAIGenerated: false
  };
};

module.exports = { generateQuestion };
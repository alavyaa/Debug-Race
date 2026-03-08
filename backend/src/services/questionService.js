const Question = require("../models/Question");
const { generateQuestion } = require("./openaiService");

/**
 * Fallback questions organized by language, difficulty level, and type
 */
const FALLBACK_QUESTIONS = {
  JavaScript: {
    MCQ: [
      {
        question: "What is the output of the following code?",
        code: 'console.log(typeof null);',
        topic: "data-types",
        options: [
          { id: "A", text: '"object"' },
          { id: "B", text: '"null"' },
          { id: "C", text: '"undefined"' },
          { id: "D", text: '"boolean"' }
        ],
        correctAnswer: "A",
        explanation:
          'In JavaScript, typeof null returns "object". This is a well-known bug in JavaScript that has persisted since the first version of the language.',
        timeLimit: 30
      },
      {
        question: "What will be logged to the console?",
        code: 'let x = 5;\nconsole.log(x * 2);',
        topic: "operators",
        options: [
          { id: "A", text: "10" },
          { id: "B", text: "5" },
          { id: "C", text: "25" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "A",
        explanation: "The multiplication operator (*) multiplies 5 by 2, resulting in 10.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'console.log("5" + 3);',
        topic: "type-coercion",
        options: [
          { id: "A", text: "8" },
          { id: "B", text: '"53"' },
          { id: "C", text: "NaN" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          'When using + with a string, JavaScript converts the number to a string and concatenates. "5" + 3 becomes "53".',
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'console.log("5" - 3);',
        topic: "type-coercion",
        options: [
          { id: "A", text: "2" },
          { id: "B", text: '"53"' },
          { id: "C", text: "NaN" },
          { id: "D", text: '"2"' }
        ],
        correctAnswer: "A",
        explanation:
          'The - operator converts "5" to a number and performs subtraction: 5 - 3 = 2.',
        timeLimit: 30
      },
      {
        question: "What does the following code return?",
        code: "let arr = [1, 2, 3];\nconsole.log(arr.length);",
        topic: "arrays",
        options: [
          { id: "A", text: "2" },
          { id: "B", text: "3" },
          { id: "C", text: "4" },
          { id: "D", text: "undefined" }
        ],
        correctAnswer: "B",
        explanation: "The .length property returns the number of elements in the array, which is 3.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "let a = 10;\nlet b = a++;\nconsole.log(a, b);",
        topic: "operators",
        options: [
          { id: "A", text: "11 10" },
          { id: "B", text: "10 10" },
          { id: "C", text: "11 11" },
          { id: "D", text: "10 11" }
        ],
        correctAnswer: "A",
        explanation:
          "Post-increment (a++) returns the original value (10) and then increments a to 11. So b = 10 and a = 11.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'console.log(0 == false);\nconsole.log(0 === false);',
        topic: "comparison",
        options: [
          { id: "A", text: "true true" },
          { id: "B", text: "true false" },
          { id: "C", text: "false true" },
          { id: "D", text: "false false" }
        ],
        correctAnswer: "B",
        explanation:
          "== performs type coercion, so 0 == false is true. === checks both value and type, and since 0 is a number and false is a boolean, 0 === false is false.",
        timeLimit: 30
      },
      {
        question: "What will this code output?",
        code: "const obj = { a: 1, b: 2, c: 3 };\nconsole.log(Object.keys(obj).length);",
        topic: "objects",
        options: [
          { id: "A", text: "2" },
          { id: "B", text: "3" },
          { id: "C", text: "6" },
          { id: "D", text: "undefined" }
        ],
        correctAnswer: "B",
        explanation:
          "Object.keys() returns an array of the object's own enumerable property names. The object has 3 keys: 'a', 'b', 'c'.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "let x;\nconsole.log(x);",
        topic: "variables",
        options: [
          { id: "A", text: "null" },
          { id: "B", text: "0" },
          { id: "C", text: "undefined" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "C",
        explanation:
          "A variable declared with let but not assigned a value has the default value undefined.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "const arr = [1, 2, 3, 4, 5];\nconsole.log(arr.slice(1, 3));",
        topic: "arrays",
        options: [
          { id: "A", text: "[1, 2, 3]" },
          { id: "B", text: "[2, 3]" },
          { id: "C", text: "[2, 3, 4]" },
          { id: "D", text: "[1, 2]" }
        ],
        correctAnswer: "B",
        explanation:
          "slice(1, 3) returns elements from index 1 up to (but not including) index 3, which are [2, 3].",
        timeLimit: 30
      },
      {
        question: "What does this code output?",
        code: 'console.log(Boolean(""));',
        topic: "type-coercion",
        options: [
          { id: "A", text: "true" },
          { id: "B", text: "false" },
          { id: "C", text: "undefined" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          'An empty string "" is a falsy value in JavaScript. Boolean("") converts it to false.',
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "function test() {\n  return\n  {\n    name: 'John'\n  }\n}\nconsole.log(test());",
        topic: "functions",
        options: [
          { id: "A", text: "{ name: 'John' }" },
          { id: "B", text: "undefined" },
          { id: "C", text: "null" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "JavaScript automatically inserts a semicolon after 'return' when it's followed by a newline. So the function returns undefined.",
        timeLimit: 30
      }
    ],
    DEBUG: [
      {
        question: "Find and fix the bug in this code:",
        code: 'function greet(name) {\n  return "Hello, " + Name;\n}\nconsole.log(greet("World"));',
        topic: "variables",
        options: [
          { id: "A", text: 'Change "Name" to "name" (lowercase)' },
          { id: "B", text: "Add var Name declaration" },
          { id: "C", text: "Remove the return statement" },
          { id: "D", text: 'Change "Hello, " to \'Hello, \'' }
        ],
        correctAnswer: "A",
        explanation:
          "JavaScript is case-sensitive. The parameter is 'name' (lowercase) but the code references 'Name' (uppercase), causing a ReferenceError.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: "const numbers = [1, 2, 3, 4, 5];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}",
        topic: "loops",
        options: [
          { id: "A", text: "Change <= to <" },
          { id: "B", text: "Change let to var" },
          { id: "C", text: "Change i++ to ++i" },
          { id: "D", text: "Remove const" }
        ],
        correctAnswer: "A",
        explanation:
          "Using <= causes an off-by-one error. When i equals numbers.length (5), numbers[5] is undefined. Use < instead.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this code:",
        code: 'let total = "0";\nfor (let i = 1; i <= 5; i++) {\n  total += i;\n}\nconsole.log(total);',
        topic: "type-coercion",
        options: [
          { id: "A", text: 'Change "0" to 0 (number instead of string)' },
          { id: "B", text: "Change += to = total +" },
          { id: "C", text: "Change let to const" },
          { id: "D", text: "Change <= to <" }
        ],
        correctAnswer: "A",
        explanation:
          'total is initialized as a string "0". When using +=, numbers are concatenated as strings instead of added. Initialize as 0 (number) to fix.',
        timeLimit: 45
      },
      {
        question: "What is the bug in this code?",
        code: "function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n);\n}",
        topic: "recursion",
        options: [
          { id: "A", text: "Change factorial(n) to factorial(n - 1)" },
          { id: "B", text: "Change n === 0 to n === 1" },
          { id: "C", text: "Add else before return" },
          { id: "D", text: "Change return 1 to return 0" }
        ],
        correctAnswer: "A",
        explanation:
          "The recursive call passes n instead of n - 1, causing infinite recursion. It should be factorial(n - 1).",
        timeLimit: 45
      },
      {
        question: "Find the bug in this array reversal code:",
        code: "function reverseArray(arr) {\n  let reversed = [];\n  for (let i = arr.length; i >= 0; i--) {\n    reversed.push(arr[i]);\n  }\n  return reversed;\n}",
        topic: "arrays",
        options: [
          { id: "A", text: "Change arr.length to arr.length - 1" },
          { id: "B", text: "Change >= to >" },
          { id: "C", text: "Change i-- to i++" },
          { id: "D", text: "Change push to unshift" }
        ],
        correctAnswer: "A",
        explanation:
          "Array indices go from 0 to length-1. Starting at arr.length accesses an undefined index. Start at arr.length - 1.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this code:",
        code: "const user = { name: 'Alice', age: 25 };\nconst { name, age } = user;\nname = 'Bob';\nconsole.log(name);",
        topic: "destructuring",
        options: [
          { id: "A", text: "Change const to let in destructuring" },
          { id: "B", text: "Add user. before name" },
          { id: "C", text: "Remove the destructuring" },
          { id: "D", text: "Change 'Bob' to \"Bob\"" }
        ],
        correctAnswer: "A",
        explanation:
          "Variables declared with const cannot be reassigned. Use let { name, age } = user; to allow reassignment.",
        timeLimit: 45
      }
    ]
  },

  Python: {
    MCQ: [
      {
        question: "What is the output of the following code?",
        code: "print(type([]))",
        topic: "data-types",
        options: [
          { id: "A", text: "<class 'list'>" },
          { id: "B", text: "<class 'array'>" },
          { id: "C", text: "<class 'tuple'>" },
          { id: "D", text: "<class 'dict'>" }
        ],
        correctAnswer: "A",
        explanation: "An empty [] creates a list in Python. type([]) returns <class 'list'>.",
        timeLimit: 30
      },
      {
        question: "What will be the output?",
        code: 'x = "Hello"\nprint(x[1])',
        topic: "strings",
        options: [
          { id: "A", text: "H" },
          { id: "B", text: "e" },
          { id: "C", text: "l" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "Python strings are zero-indexed. x[0] is 'H', x[1] is 'e'.",
        timeLimit: 30
      },
      {
        question: "What does this code print?",
        code: "print(2 ** 3)",
        topic: "operators",
        options: [
          { id: "A", text: "6" },
          { id: "B", text: "8" },
          { id: "C", text: "5" },
          { id: "D", text: "9" }
        ],
        correctAnswer: "B",
        explanation: "The ** operator is the exponentiation operator. 2 ** 3 = 2³ = 8.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "my_list = [1, 2, 3, 4, 5]\nprint(my_list[1:3])",
        topic: "lists",
        options: [
          { id: "A", text: "[1, 2, 3]" },
          { id: "B", text: "[2, 3]" },
          { id: "C", text: "[2, 3, 4]" },
          { id: "D", text: "[1, 2]" }
        ],
        correctAnswer: "B",
        explanation:
          "Slicing [1:3] returns elements from index 1 up to (but not including) index 3: [2, 3].",
        timeLimit: 30
      },
      {
        question: "What will this print?",
        code: "print(10 // 3)",
        topic: "operators",
        options: [
          { id: "A", text: "3.33" },
          { id: "B", text: "3" },
          { id: "C", text: "4" },
          { id: "D", text: "3.0" }
        ],
        correctAnswer: "B",
        explanation:
          "The // operator performs floor division (integer division). 10 // 3 = 3 (rounds down).",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "x = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
        topic: "references",
        options: [
          { id: "A", text: "[1, 2, 3]" },
          { id: "B", text: "[1, 2, 3, 4]" },
          { id: "C", text: "[4, 1, 2, 3]" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "y = x creates a reference, not a copy. Both x and y point to the same list, so appending to y also affects x.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'print("hello".upper())',
        topic: "strings",
        options: [
          { id: "A", text: "hello" },
          { id: "B", text: "Hello" },
          { id: "C", text: "HELLO" },
          { id: "D", text: "hELLO" }
        ],
        correctAnswer: "C",
        explanation:
          "The .upper() method converts all characters in the string to uppercase.",
        timeLimit: 30
      },
      {
        question: "What does this code output?",
        code: "d = {'a': 1, 'b': 2, 'c': 3}\nprint(len(d))",
        topic: "dictionaries",
        options: [
          { id: "A", text: "6" },
          { id: "B", text: "3" },
          { id: "C", text: "2" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "len() on a dictionary returns the number of key-value pairs. The dictionary has 3 pairs.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "x = (1, 2, 3)\nprint(type(x))",
        topic: "data-types",
        options: [
          { id: "A", text: "<class 'list'>" },
          { id: "B", text: "<class 'tuple'>" },
          { id: "C", text: "<class 'set'>" },
          { id: "D", text: "<class 'dict'>" }
        ],
        correctAnswer: "B",
        explanation:
          "Parentheses with comma-separated values create a tuple in Python.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "print(bool(0), bool(''), bool([]))",
        topic: "type-coercion",
        options: [
          { id: "A", text: "True True True" },
          { id: "B", text: "False False False" },
          { id: "C", text: "False True False" },
          { id: "D", text: "True False True" }
        ],
        correctAnswer: "B",
        explanation:
          "0, empty string '', and empty list [] are all falsy values in Python. bool() converts them to False.",
        timeLimit: 30
      },
      {
        question: "What does this code output?",
        code: "nums = [1, 2, 3, 4, 5]\nprint(nums[-1])",
        topic: "lists",
        options: [
          { id: "A", text: "1" },
          { id: "B", text: "5" },
          { id: "C", text: "4" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "Negative indexing in Python starts from the end. nums[-1] returns the last element, which is 5.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "x = {1, 2, 3, 2, 1}\nprint(len(x))",
        topic: "sets",
        options: [
          { id: "A", text: "5" },
          { id: "B", text: "3" },
          { id: "C", text: "2" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "Sets automatically remove duplicates. {1, 2, 3, 2, 1} becomes {1, 2, 3}, which has length 3.",
        timeLimit: 30
      }
    ],
    DEBUG: [
      {
        question: "Find the bug in this code:",
        code: 'def greet(name):\n  return "Hello, " + name\n\nprint(greet(123))',
        topic: "type-error",
        options: [
          { id: "A", text: "Convert 123 to string: greet(str(123))" },
          { id: "B", text: "Change + to ," },
          { id: "C", text: "Remove the return statement" },
          { id: "D", text: "Add quotes around 123" }
        ],
        correctAnswer: "A",
        explanation:
          "Python cannot concatenate a string with an integer using +. You need to convert 123 to a string first.",
        timeLimit: 45
      },
      {
        question: "What is the bug in this code?",
        code: "numbers = [1, 2, 3, 4, 5]\nfor i in range(len(numbers)):\n  if numbers[i] % 2 == 0:\n    numbers.remove(numbers[i])",
        topic: "lists",
        options: [
          { id: "A", text: "Modifying a list while iterating over it causes index errors" },
          { id: "B", text: "range() should start from 1" },
          { id: "C", text: "% operator doesn't work with lists" },
          { id: "D", text: "remove() doesn't exist for lists" }
        ],
        correctAnswer: "A",
        explanation:
          "Removing elements from a list while iterating over it by index causes skipped elements and potential IndexError. Use list comprehension instead.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this recursive function:",
        code: "def countdown(n):\n  print(n)\n  countdown(n - 1)",
        topic: "recursion",
        options: [
          { id: "A", text: "Add a base case: if n <= 0: return" },
          { id: "B", text: "Change n - 1 to n + 1" },
          { id: "C", text: "Add return before countdown" },
          { id: "D", text: "Change print(n) to print(n-1)" }
        ],
        correctAnswer: "A",
        explanation:
          "Without a base case, the recursion never stops, causing a RecursionError. Add 'if n <= 0: return' at the beginning.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: "def add_to_list(item, my_list=[]):\n  my_list.append(item)\n  return my_list\n\nprint(add_to_list(1))\nprint(add_to_list(2))",
        topic: "functions",
        options: [
          { id: "A", text: "Use None as default and create list inside function" },
          { id: "B", text: "Change append to insert" },
          { id: "C", text: "Remove the default parameter" },
          { id: "D", text: "Change [] to list()" }
        ],
        correctAnswer: "A",
        explanation:
          "Mutable default arguments are shared across function calls. The second call returns [1, 2] instead of [2]. Use None as default and create a new list inside.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this dictionary code:",
        code: "scores = {'math': 90, 'science': 85}\ntotal = 0\nfor subject in scores:\n  total += subject",
        topic: "dictionaries",
        options: [
          { id: "A", text: "Change 'subject' to 'scores[subject]'" },
          { id: "B", text: "Change 'scores' to 'scores.items()'" },
          { id: "C", text: "Add int() around subject" },
          { id: "D", text: "Change += to =" }
        ],
        correctAnswer: "A",
        explanation:
          "Iterating over a dictionary yields keys (strings), not values. Use scores[subject] to access the values.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: "class Dog:\n  def __init__(self, name):\n    name = name\n\ndog = Dog('Buddy')\nprint(dog.name)",
        topic: "classes",
        options: [
          { id: "A", text: "Change 'name = name' to 'self.name = name'" },
          { id: "B", text: "Add return self" },
          { id: "C", text: "Change __init__ to __new__" },
          { id: "D", text: "Add parentheses after Dog" }
        ],
        correctAnswer: "A",
        explanation:
          "Without 'self.', the assignment creates a local variable instead of an instance attribute. Use self.name = name.",
        timeLimit: 45
      }
    ]
  },

  Java: {
    MCQ: [
      {
        question: "What is the output of this code?",
        code: 'public class Main {\n  public static void main(String[] args) {\n    int x = 10;\n    System.out.println(x / 3);\n  }\n}',
        topic: "operators",
        options: [
          { id: "A", text: "3.33" },
          { id: "B", text: "3" },
          { id: "C", text: "4" },
          { id: "D", text: "3.0" }
        ],
        correctAnswer: "B",
        explanation:
          "Integer division in Java truncates the decimal part. 10 / 3 = 3 (not 3.33).",
        timeLimit: 30
      },
      {
        question: "What will be printed?",
        code: 'String s1 = "Hello";\nString s2 = "Hello";\nSystem.out.println(s1 == s2);',
        topic: "strings",
        options: [
          { id: "A", text: "true" },
          { id: "B", text: "false" },
          { id: "C", text: "Error" },
          { id: "D", text: "null" }
        ],
        correctAnswer: "A",
        explanation:
          'String literals are stored in the String Pool. Both s1 and s2 reference the same object, so == returns true.',
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'int[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr.length);',
        topic: "arrays",
        options: [
          { id: "A", text: "4" },
          { id: "B", text: "5" },
          { id: "C", text: "6" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "The length property of an array returns the number of elements. This array has 5 elements.",
        timeLimit: 30
      },
      {
        question: "Which keyword is used to inherit a class in Java?",
        code: "// Choose the correct keyword\nclass Dog _____ Animal {\n  // ...\n}",
        topic: "inheritance",
        options: [
          { id: "A", text: "inherits" },
          { id: "B", text: "extends" },
          { id: "C", text: "implements" },
          { id: "D", text: "super" }
        ],
        correctAnswer: "B",
        explanation:
          "In Java, the 'extends' keyword is used for class inheritance. 'implements' is used for interfaces.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'String s = "Java";\nSystem.out.println(s.charAt(0));',
        topic: "strings",
        options: [
          { id: "A", text: "J" },
          { id: "B", text: "a" },
          { id: "C", text: "Java" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "A",
        explanation:
          "charAt(0) returns the character at index 0, which is 'J'.",
        timeLimit: 30
      },
      {
        question: "What is the default value of an int variable in Java?",
        code: "class Test {\n  static int x;\n  public static void main(String[] args) {\n    System.out.println(x);\n  }\n}",
        topic: "variables",
        options: [
          { id: "A", text: "null" },
          { id: "B", text: "0" },
          { id: "C", text: "undefined" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "Instance and static variables in Java are automatically initialized. The default value for int is 0.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'System.out.println(5 + 3 + "Java");',
        topic: "type-coercion",
        options: [
          { id: "A", text: "53Java" },
          { id: "B", text: "8Java" },
          { id: "C", text: "5 3 Java" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          'Java evaluates left to right. 5 + 3 = 8 (integer addition), then 8 + "Java" = "8Java" (string concatenation).',
        timeLimit: 30
      },
      {
        question: "What does this code output?",
        code: "int x = 5;\nSystem.out.println(x > 3 && x < 10);",
        topic: "logical-operators",
        options: [
          { id: "A", text: "true" },
          { id: "B", text: "false" },
          { id: "C", text: "1" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "A",
        explanation:
          "5 > 3 is true and 5 < 10 is true. true && true = true.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "int[] arr = new int[3];\nSystem.out.println(arr[0]);",
        topic: "arrays",
        options: [
          { id: "A", text: "null" },
          { id: "B", text: "0" },
          { id: "C", text: "undefined" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "In Java, integer arrays are initialized with 0 by default.",
        timeLimit: 30
      },
      {
        question: "Which access modifier makes a variable accessible only within its class?",
        code: "// Choose the correct modifier\n_____ int secret = 42;",
        topic: "access-modifiers",
        options: [
          { id: "A", text: "public" },
          { id: "B", text: "protected" },
          { id: "C", text: "private" },
          { id: "D", text: "default" }
        ],
        correctAnswer: "C",
        explanation:
          "The 'private' access modifier restricts access to within the same class only.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: 'String s = "Hello World";\nSystem.out.println(s.indexOf("World"));',
        topic: "strings",
        options: [
          { id: "A", text: "5" },
          { id: "B", text: "6" },
          { id: "C", text: "7" },
          { id: "D", text: "-1" }
        ],
        correctAnswer: "B",
        explanation:
          'indexOf() returns the starting index of the substring. "World" starts at index 6 in "Hello World".',
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: "double d = 5.5;\nint i = (int) d;\nSystem.out.println(i);",
        topic: "type-casting",
        options: [
          { id: "A", text: "5.5" },
          { id: "B", text: "5" },
          { id: "C", text: "6" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "Casting a double to int truncates the decimal part. (int) 5.5 = 5.",
        timeLimit: 30
      }
    ],
    DEBUG: [
      {
        question: "Find the bug in this code:",
        code: 'public class Main {\n  public static void main(String[] args) {\n    String name = "Java";\n    if (name == "Java") {\n      System.out.println("Match!");\n    }\n  }\n}',
        topic: "string-comparison",
        options: [
          { id: "A", text: 'Use .equals() instead of == for string comparison' },
          { id: "B", text: "Remove the quotes from Java" },
          { id: "C", text: "Change String to string" },
          { id: "D", text: "Add break after println" }
        ],
        correctAnswer: "A",
        explanation:
          '== compares references, not content. Use name.equals("Java") to compare string values. While this specific case may work due to string pooling, .equals() is the correct approach.',
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: "public class Main {\n  public static void main(String[] args) {\n    int[] arr = {1, 2, 3};\n    for (int i = 0; i <= arr.length; i++) {\n      System.out.println(arr[i]);\n    }\n  }\n}",
        topic: "arrays",
        options: [
          { id: "A", text: "Change <= to <" },
          { id: "B", text: "Change int i = 0 to int i = 1" },
          { id: "C", text: "Add arr.length - 1" },
          { id: "D", text: "Change int[] to Integer[]" }
        ],
        correctAnswer: "A",
        explanation:
          "Using <= arr.length causes ArrayIndexOutOfBoundsException. Array indices go from 0 to length-1. Use < instead.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this code:",
        code: "public class Calculator {\n  int result;\n  \n  public void add(int a, int b) {\n    int result = a + b;\n  }\n  \n  public int getResult() {\n    return result;\n  }\n}",
        topic: "scope",
        options: [
          { id: "A", text: "Change 'int result' to 'this.result' in add method" },
          { id: "B", text: "Make result static" },
          { id: "C", text: "Add return type to add method" },
          { id: "D", text: "Make result public" }
        ],
        correctAnswer: "A",
        explanation:
          "The add method declares a local variable 'result' that shadows the instance variable. Use 'this.result = a + b' to update the instance variable.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: "public class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int num = sc.nextInt();\n    System.out.println(num);\n  }\n}",
        topic: "imports",
        options: [
          { id: "A", text: "Add 'import java.util.Scanner;' at the top" },
          { id: "B", text: "Change Scanner to scanner" },
          { id: "C", text: "Add throws Exception" },
          { id: "D", text: "Change nextInt() to readInt()" }
        ],
        correctAnswer: "A",
        explanation:
          "Scanner class needs to be imported from java.util package. Add 'import java.util.Scanner;' before the class declaration.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this code:",
        code: "public class Main {\n  public static void main(String[] args) {\n    int sum = 0;\n    for (int i = 1; i <= 10; i++)\n      sum += i;\n      System.out.println(\"i = \" + i);\n    System.out.println(\"Sum = \" + sum);\n  }\n}",
        topic: "scope",
        options: [
          { id: "A", text: "Variable 'i' is not accessible outside the for loop" },
          { id: "B", text: "Change int sum to long sum" },
          { id: "C", text: "Add curly braces to for loop" },
          { id: "D", text: "Change <= to <" }
        ],
        correctAnswer: "A",
        explanation:
          "The variable 'i' declared in the for loop header is scoped to the loop. The indented println is not inside the loop (no braces), and 'i' is not accessible there.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: 'public class Main {\n  public static void main(String[] args) {\n    Integer num = null;\n    int result = num + 5;\n    System.out.println(result);\n  }\n}',
        topic: "null-pointer",
        options: [
          { id: "A", text: "Add null check before unboxing: if (num != null)" },
          { id: "B", text: "Change Integer to int" },
          { id: "C", text: "Change null to 0" },
          { id: "D", text: "Both A and C would fix it" }
        ],
        correctAnswer: "D",
        explanation:
          "Unboxing a null Integer throws NullPointerException. Either check for null first or initialize num with a value instead of null.",
        timeLimit: 45
      }
    ]
  },

  C: {
    MCQ: [
      {
        question: "What is the output of this code?",
        code: '#include <stdio.h>\nint main() {\n  int x = 10;\n  printf("%d", x / 3);\n  return 0;\n}',
        topic: "operators",
        options: [
          { id: "A", text: "3.33" },
          { id: "B", text: "3" },
          { id: "C", text: "4" },
          { id: "D", text: "3.0" }
        ],
        correctAnswer: "B",
        explanation:
          "Integer division in C truncates the decimal. 10 / 3 = 3.",
        timeLimit: 30
      },
      {
        question: "What is the size of an int on most 64-bit systems?",
        code: '#include <stdio.h>\nint main() {\n  printf("%lu", sizeof(int));\n  return 0;\n}',
        topic: "data-types",
        options: [
          { id: "A", text: "2" },
          { id: "B", text: "4" },
          { id: "C", text: "8" },
          { id: "D", text: "16" }
        ],
        correctAnswer: "B",
        explanation:
          "On most modern 64-bit systems, an int is 4 bytes (32 bits).",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  int a = 5, b = 2;\n  float c = a / b;\n  printf("%.1f", c);\n  return 0;\n}',
        topic: "type-casting",
        options: [
          { id: "A", text: "2.5" },
          { id: "B", text: "2.0" },
          { id: "C", text: "3.0" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "a / b performs integer division first (5 / 2 = 2), then assigns 2 to float c as 2.0. To get 2.5, cast one operand: (float)a / b.",
        timeLimit: 30
      },
      {
        question: "What does the & operator do in this context?",
        code: '#include <stdio.h>\nint main() {\n  int x = 10;\n  printf("%p", &x);\n  return 0;\n}',
        topic: "pointers",
        options: [
          { id: "A", text: "Bitwise AND" },
          { id: "B", text: "Returns the address of x" },
          { id: "C", text: "Returns the value of x" },
          { id: "D", text: "Logical AND" }
        ],
        correctAnswer: "B",
        explanation:
          "The unary & operator returns the memory address of a variable. &x gives the address where x is stored.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\n#include <string.h>\nint main() {\n  char str[] = "Hello";\n  printf("%lu", strlen(str));\n  return 0;\n}',
        topic: "strings",
        options: [
          { id: "A", text: "5" },
          { id: "B", text: "6" },
          { id: "C", text: "4" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "A",
        explanation:
          'strlen() returns the number of characters before the null terminator. "Hello" has 5 characters.',
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  int arr[] = {10, 20, 30, 40, 50};\n  printf("%d", *(arr + 2));\n  return 0;\n}',
        topic: "pointers",
        options: [
          { id: "A", text: "10" },
          { id: "B", text: "20" },
          { id: "C", text: "30" },
          { id: "D", text: "40" }
        ],
        correctAnswer: "C",
        explanation:
          "*(arr + 2) is equivalent to arr[2]. Pointer arithmetic moves 2 positions forward, giving us 30.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  int x = 5;\n  printf("%d %d", x++, ++x);\n  return 0;\n}',
        topic: "operators",
        options: [
          { id: "A", text: "5 7" },
          { id: "B", text: "5 6" },
          { id: "C", text: "6 7" },
          { id: "D", text: "Undefined behavior" }
        ],
        correctAnswer: "D",
        explanation:
          "Modifying a variable more than once between sequence points is undefined behavior in C. The output is unpredictable.",
        timeLimit: 30
      },
      {
        question: "What does this code print?",
        code: '#include <stdio.h>\nint main() {\n  int x = 0;\n  if (x = 5) {\n    printf("True");\n  } else {\n    printf("False");\n  }\n  return 0;\n}',
        topic: "operators",
        options: [
          { id: "A", text: "True" },
          { id: "B", text: "False" },
          { id: "C", text: "Error" },
          { id: "D", text: "0" }
        ],
        correctAnswer: "A",
        explanation:
          "x = 5 is an assignment, not comparison. It assigns 5 to x and returns 5, which is truthy. Prints 'True'.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  char c = \'A\';\n  printf("%d", c);\n  return 0;\n}',
        topic: "data-types",
        options: [
          { id: "A", text: "A" },
          { id: "B", text: "65" },
          { id: "C", text: "97" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "When printing a char with %d, it prints the ASCII value. 'A' has ASCII value 65.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  int a = 10;\n  int *p = &a;\n  *p = 20;\n  printf("%d", a);\n  return 0;\n}',
        topic: "pointers",
        options: [
          { id: "A", text: "10" },
          { id: "B", text: "20" },
          { id: "C", text: "Address of a" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "p points to a. *p = 20 changes the value at the address p points to, which is a. So a becomes 20.",
        timeLimit: 30
      },
      {
        question: "What is the correct way to declare a constant in C?",
        code: "// Which declaration creates a constant?",
        topic: "variables",
        options: [
          { id: "A", text: "const int MAX = 100;" },
          { id: "B", text: "constant int MAX = 100;" },
          { id: "C", text: "final int MAX = 100;" },
          { id: "D", text: "static int MAX = 100;" }
        ],
        correctAnswer: "A",
        explanation:
          "In C, the 'const' keyword is used to declare constants. 'final' is Java, and 'constant' is not a keyword.",
        timeLimit: 30
      },
      {
        question: "What is the output?",
        code: '#include <stdio.h>\nint main() {\n  int i;\n  for (i = 0; i < 5; i++);\n  printf("%d", i);\n  return 0;\n}',
        topic: "loops",
        options: [
          { id: "A", text: "0 1 2 3 4" },
          { id: "B", text: "5" },
          { id: "C", text: "4" },
          { id: "D", text: "Error" }
        ],
        correctAnswer: "B",
        explanation:
          "The semicolon after for() makes the loop body empty. The loop runs i from 0 to 4, then i becomes 5 and exits. printf prints 5.",
        timeLimit: 30
      }
    ],
    DEBUG: [
      {
        question: "Find the bug in this code:",
        code: '#include <stdio.h>\nint main() {\n  int arr[5] = {1, 2, 3, 4, 5};\n  for (int i = 0; i <= 5; i++) {\n    printf("%d ", arr[i]);\n  }\n  return 0;\n}',
        topic: "arrays",
        options: [
          { id: "A", text: "Change <= 5 to < 5" },
          { id: "B", text: "Change i = 0 to i = 1" },
          { id: "C", text: "Change int arr[5] to int arr[6]" },
          { id: "D", text: "Add \\n to printf" }
        ],
        correctAnswer: "A",
        explanation:
          "Array indices go from 0 to 4 for a size-5 array. Using <= 5 accesses arr[5], which is out of bounds and causes undefined behavior.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: '#include <stdio.h>\n#include <stdlib.h>\nint main() {\n  int *p = (int *)malloc(5 * sizeof(int));\n  for (int i = 0; i < 5; i++) {\n    p[i] = i * 10;\n  }\n  printf("%d", p[2]);\n  return 0;\n}',
        topic: "memory",
        options: [
          { id: "A", text: "Missing free(p) before return to prevent memory leak" },
          { id: "B", text: "malloc is used incorrectly" },
          { id: "C", text: "Should use calloc instead" },
          { id: "D", text: "Missing null check after malloc" }
        ],
        correctAnswer: "A",
        explanation:
          "Dynamically allocated memory must be freed using free(p) before the program ends to prevent memory leaks.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this string code:",
        code: '#include <stdio.h>\n#include <string.h>\nint main() {\n  char str1[5] = "Hello";\n  char str2[10];\n  strcpy(str2, str1);\n  printf("%s", str2);\n  return 0;\n}',
        topic: "strings",
        options: [
          { id: "A", text: 'Change char str1[5] to char str1[6] to include null terminator' },
          { id: "B", text: "Use strncpy instead" },
          { id: "C", text: "Change str2[10] to str2[5]" },
          { id: "D", text: "Add \\0 to str2" }
        ],
        correctAnswer: "A",
        explanation:
          '"Hello" needs 6 bytes (5 chars + null terminator \\0). str1[5] has no room for \\0, causing strcpy to read past the buffer.',
        timeLimit: 45
      },
      {
        question: "What is wrong with this pointer code?",
        code: '#include <stdio.h>\nint main() {\n  int *p;\n  *p = 10;\n  printf("%d", *p);\n  return 0;\n}',
        topic: "pointers",
        options: [
          { id: "A", text: "Initialize pointer before dereferencing: int x = 10; int *p = &x;" },
          { id: "B", text: "Change int *p to int p" },
          { id: "C", text: "Add & before p in printf" },
          { id: "D", text: "Change %d to %p" }
        ],
        correctAnswer: "A",
        explanation:
          "p is an uninitialized pointer (dangling pointer). Dereferencing it (*p = 10) causes undefined behavior. Point it to a valid memory location first.",
        timeLimit: 45
      },
      {
        question: "Find the bug in this function:",
        code: '#include <stdio.h>\nint* getArray() {\n  int arr[5] = {1, 2, 3, 4, 5};\n  return arr;\n}\nint main() {\n  int *p = getArray();\n  printf("%d", p[0]);\n  return 0;\n}',
        topic: "scope",
        options: [
          { id: "A", text: "Returning address of local array - use static or malloc" },
          { id: "B", text: "Change int* to void*" },
          { id: "C", text: "Add & before arr" },
          { id: "D", text: "Change p[0] to *p" }
        ],
        correctAnswer: "A",
        explanation:
          "Local array 'arr' is destroyed when getArray() returns. The returned pointer becomes a dangling pointer. Use 'static int arr[5]' or malloc.",
        timeLimit: 45
      },
      {
        question: "What is wrong with this code?",
        code: '#include <stdio.h>\nint main() {\n  int n;\n  scanf("%d", n);\n  printf("You entered: %d", n);\n  return 0;\n}',
        topic: "input",
        options: [
          { id: "A", text: "Change 'n' to '&n' in scanf" },
          { id: "B", text: "Change %d to %i" },
          { id: "C", text: "Add \\n in scanf" },
          { id: "D", text: "Initialize n to 0" }
        ],
        correctAnswer: "A",
        explanation:
          "scanf requires the address of the variable, not the variable itself. Use &n to pass the address of n.",
        timeLimit: 45
      }
    ]
  }
};

/**
 * Get a random fallback question for given language and type
 */
const getRandomFallbackQuestion = (language, type) => {
  const languageQuestions = FALLBACK_QUESTIONS[language];
  if (!languageQuestions) {
    // Default to JavaScript if language not found
    return FALLBACK_QUESTIONS.JavaScript.MCQ[0];
  }

  const typeQuestions = languageQuestions[type];
  if (!typeQuestions || typeQuestions.length === 0) {
    return languageQuestions.MCQ[0];
  }

  const randomIndex = Math.floor(Math.random() * typeQuestions.length);
  return typeQuestions[randomIndex];
};

/**
 * Generate questions for a race
 */
const generateQuestionsForRace = async (language, level, totalLaps) => {
  const questions = [];
  const questionsPerLap = 2;
  const usedFallbackIndices = new Set();

  console.log(
    `📚 Generating ${totalLaps * questionsPerLap} questions for ${language} (Level ${level})`
  );

  for (let lap = 1; lap <= totalLaps; lap++) {
    for (let q = 0; q < questionsPerLap; q++) {
      const questionType = lap === 1 ? "MCQ" : q === 0 ? "MCQ" : "DEBUG";

      console.log(
        `  Generating Lap ${lap}, Question ${q + 1} (${questionType})`
      );

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
        if (true) {
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
         * Smart fallback: pick a unique random fallback question
         */
        const languageQuestions =
          FALLBACK_QUESTIONS[language]?.[questionType] ||
          FALLBACK_QUESTIONS.JavaScript.MCQ;

        let fallbackIndex = Math.floor(
          Math.random() * languageQuestions.length
        );
        let attempts = 0;

        // Try to pick a unique fallback question
        while (
          usedFallbackIndices.has(`${questionType}-${fallbackIndex}`) &&
          attempts < languageQuestions.length
        ) {
          fallbackIndex = (fallbackIndex + 1) % languageQuestions.length;
          attempts++;
        }
        usedFallbackIndices.add(`${questionType}-${fallbackIndex}`);

        const fallbackQuestion = languageQuestions[fallbackIndex];

        console.log(
          `📦 Using fallback question: ${language} ${questionType} #${fallbackIndex + 1}`
        );

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
            console.log(
              `✓ ${language} L${level} ${type}: ${existingCount} questions exist`
            );
            continue;
          }

          for (let i = 0; i < 3; i++) {
            console.log(
              `🤖 Generating ${language} L${level} ${type} #${i + 1}...`
            );

            try {
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

              console.log("✅ Created via AI");
            } catch (aiError) {
              console.warn(
                `⚠️ AI generation failed, using fallback: ${aiError.message}`
              );

              /**
               * Use fallback question for seeding
               */
              const fallbackQuestion = getRandomFallbackQuestion(
                language,
                type
              );
              await Question.create({
                ...fallbackQuestion,
                language,
                difficulty: level,
                type,
                isAIGenerated: false
              });

              console.log("✅ Created via fallback");
            }

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
const getAdaptiveQuestion = async (
  language,
  level,
  type,
  performanceData
) => {
  try {
    console.log(
      `🎯 Getting adaptive question for ${language} L${level} ${type}`
    );

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

    /**
     * Fallback for adaptive questions
     */
    console.log("📦 Using fallback for adaptive question");
    const fallbackQuestion = getRandomFallbackQuestion(language, type);

    const question = await Question.create({
      ...fallbackQuestion,
      language,
      difficulty: level,
      type,
      isAIGenerated: false
    });

    return question;
  }
};

module.exports = {
  generateQuestionsForRace,
  seedQuestionsWithAI,
  getAdaptiveQuestion,
  getRandomFallbackQuestion,
  FALLBACK_QUESTIONS
};

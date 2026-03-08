const Question = require("../models/Question");
const { generateQuestion } = require("./openaiService");

/**
 * Normalize language name
 */
const normalizeLanguage = (language) => {
  if (!language) return "JavaScript";
  const lang = language.toLowerCase().trim();
  const map = {
    javascript: "JavaScript",
    js: "JavaScript",
    python: "Python",
    py: "Python",
    java: "Java",
    c: "C",
  };
  return map[lang] || language;
};

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Get fallback question for specific language and type
 */
const getFallbackQuestion = (language, type, index = 0) => {
  const lang = normalizeLanguage(language);

  const fallbacks = {
    JavaScript: {
      MCQ: [
        {
          question: "What is the output of this JavaScript code?",
          code: 'console.log(typeof null);',
          topic: "data-types",
          options: [
            { id: "A", text: '"object"' },
            { id: "B", text: '"null"' },
            { id: "C", text: '"undefined"' },
            { id: "D", text: '"boolean"' },
          ],
          correctAnswer: "A",
          explanation: 'typeof null returns "object" in JavaScript.',
          timeLimit: 30,
        },
        {
          question: "What will be logged to the console?",
          code: "let x = 5;\nconsole.log(x * 2);",
          topic: "operators",
          options: [
            { id: "A", text: "10" },
            { id: "B", text: "5" },
            { id: "C", text: "25" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "A",
          explanation: "5 * 2 = 10.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: 'console.log("5" + 3);',
          topic: "type-coercion",
          options: [
            { id: "A", text: "8" },
            { id: "B", text: '"53"' },
            { id: "C", text: "NaN" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: 'String + number concatenates: "5" + 3 = "53".',
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: 'console.log("5" - 3);',
          topic: "type-coercion",
          options: [
            { id: "A", text: "2" },
            { id: "B", text: '"53"' },
            { id: "C", text: "NaN" },
            { id: "D", text: '"2"' },
          ],
          correctAnswer: "A",
          explanation: 'The - operator converts "5" to number: 5 - 3 = 2.',
          timeLimit: 30,
        },
        {
          question: "What does this code return?",
          code: "let arr = [1, 2, 3];\nconsole.log(arr.length);",
          topic: "arrays",
          options: [
            { id: "A", text: "2" },
            { id: "B", text: "3" },
            { id: "C", text: "4" },
            { id: "D", text: "undefined" },
          ],
          correctAnswer: "B",
          explanation: "The array has 3 elements, so .length is 3.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: "let a = 10;\nlet b = a++;\nconsole.log(a, b);",
          topic: "operators",
          options: [
            { id: "A", text: "11 10" },
            { id: "B", text: "10 10" },
            { id: "C", text: "11 11" },
            { id: "D", text: "10 11" },
          ],
          correctAnswer: "A",
          explanation: "Post-increment returns original value (10), then increments a to 11.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: "console.log(0 == false);\nconsole.log(0 === false);",
          topic: "comparison",
          options: [
            { id: "A", text: "true true" },
            { id: "B", text: "true false" },
            { id: "C", text: "false true" },
            { id: "D", text: "false false" },
          ],
          correctAnswer: "B",
          explanation: "== coerces types (true), === checks type too (false).",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: "let x;\nconsole.log(x);",
          topic: "variables",
          options: [
            { id: "A", text: "null" },
            { id: "B", text: "0" },
            { id: "C", text: "undefined" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "C",
          explanation: "Uninitialized variables are undefined.",
          timeLimit: 30,
        },
      ],
      DEBUG: [
        {
          question: "Find and fix the bug:",
          code: 'function greet(name) {\n  return "Hello, " + Name;\n}\nconsole.log(greet("World"));',
          topic: "variables",
          options: [
            { id: "A", text: 'Change "Name" to "name" (lowercase)' },
            { id: "B", text: "Add var Name declaration" },
            { id: "C", text: "Remove the return statement" },
            { id: "D", text: "Change quotes style" },
          ],
          correctAnswer: "A",
          explanation: "JavaScript is case-sensitive. Parameter is 'name' not 'Name'.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this code?",
          code: "const numbers = [1, 2, 3, 4, 5];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}",
          topic: "loops",
          options: [
            { id: "A", text: "Change <= to <" },
            { id: "B", text: "Change let to var" },
            { id: "C", text: "Change i++ to ++i" },
            { id: "D", text: "Remove const" },
          ],
          correctAnswer: "A",
          explanation: "<= causes off-by-one error. numbers[5] is undefined.",
          timeLimit: 45,
        },
        {
          question: "Find the bug:",
          code: 'let total = "0";\nfor (let i = 1; i <= 5; i++) {\n  total += i;\n}\nconsole.log(total);',
          topic: "type-coercion",
          options: [
            { id: "A", text: 'Change "0" to 0 (number not string)' },
            { id: "B", text: "Change += to = total +" },
            { id: "C", text: "Change let to const" },
            { id: "D", text: "Change <= to <" },
          ],
          correctAnswer: "A",
          explanation: 'total is string "0", so += concatenates instead of adding.',
          timeLimit: 45,
        },
        {
          question: "What is the bug?",
          code: "function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n);\n}",
          topic: "recursion",
          options: [
            { id: "A", text: "Change factorial(n) to factorial(n - 1)" },
            { id: "B", text: "Change n === 0 to n === 1" },
            { id: "C", text: "Add else before return" },
            { id: "D", text: "Change return 1 to return 0" },
          ],
          correctAnswer: "A",
          explanation: "Recursive call passes n instead of n-1, causing infinite loop.",
          timeLimit: 45,
        },
      ],
    },

    Python: {
      MCQ: [
        {
          question: "What is the output of this Python code?",
          code: "print(type([]))",
          topic: "data-types",
          options: [
            { id: "A", text: "<class 'list'>" },
            { id: "B", text: "<class 'array'>" },
            { id: "C", text: "<class 'tuple'>" },
            { id: "D", text: "<class 'dict'>" },
          ],
          correctAnswer: "A",
          explanation: "[] creates a list. type([]) returns <class 'list'>.",
          timeLimit: 30,
        },
        {
          question: "What will this Python code output?",
          code: 'x = "Hello"\nprint(x[1])',
          topic: "strings",
          options: [
            { id: "A", text: "H" },
            { id: "B", text: "e" },
            { id: "C", text: "l" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "Python strings are zero-indexed. x[1] is 'e'.",
          timeLimit: 30,
        },
        {
          question: "What does this Python code print?",
          code: "print(2 ** 3)",
          topic: "operators",
          options: [
            { id: "A", text: "6" },
            { id: "B", text: "8" },
            { id: "C", text: "5" },
            { id: "D", text: "9" },
          ],
          correctAnswer: "B",
          explanation: "** is exponentiation. 2 ** 3 = 8.",
          timeLimit: 30,
        },
        {
          question: "What is the output of this Python slice?",
          code: "my_list = [1, 2, 3, 4, 5]\nprint(my_list[1:3])",
          topic: "lists",
          options: [
            { id: "A", text: "[1, 2, 3]" },
            { id: "B", text: "[2, 3]" },
            { id: "C", text: "[2, 3, 4]" },
            { id: "D", text: "[1, 2]" },
          ],
          correctAnswer: "B",
          explanation: "[1:3] returns index 1 up to (not including) 3: [2, 3].",
          timeLimit: 30,
        },
        {
          question: "What will this Python code print?",
          code: "print(10 // 3)",
          topic: "operators",
          options: [
            { id: "A", text: "3.33" },
            { id: "B", text: "3" },
            { id: "C", text: "4" },
            { id: "D", text: "3.0" },
          ],
          correctAnswer: "B",
          explanation: "// is floor division. 10 // 3 = 3.",
          timeLimit: 30,
        },
        {
          question: "What is the output of this Python code?",
          code: "x = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
          topic: "references",
          options: [
            { id: "A", text: "[1, 2, 3]" },
            { id: "B", text: "[1, 2, 3, 4]" },
            { id: "C", text: "[4, 1, 2, 3]" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "y = x creates a reference. Both point to same list.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: 'print("hello".upper())',
          topic: "strings",
          options: [
            { id: "A", text: "hello" },
            { id: "B", text: "Hello" },
            { id: "C", text: "HELLO" },
            { id: "D", text: "hELLO" },
          ],
          correctAnswer: "C",
          explanation: ".upper() converts all characters to uppercase.",
          timeLimit: 30,
        },
        {
          question: "What does negative indexing do in Python?",
          code: "nums = [1, 2, 3, 4, 5]\nprint(nums[-1])",
          topic: "lists",
          options: [
            { id: "A", text: "1" },
            { id: "B", text: "5" },
            { id: "C", text: "4" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "nums[-1] returns the last element: 5.",
          timeLimit: 30,
        },
      ],
      DEBUG: [
        {
          question: "Find the bug in this Python code:",
          code: 'def greet(name):\n  return "Hello, " + name\n\nprint(greet(123))',
          topic: "type-error",
          options: [
            { id: "A", text: "Convert 123 to string: greet(str(123))" },
            { id: "B", text: "Change + to ," },
            { id: "C", text: "Remove the return statement" },
            { id: "D", text: "Add quotes around 123" },
          ],
          correctAnswer: "A",
          explanation: "Python cannot concatenate string + int with +.",
          timeLimit: 45,
        },
        {
          question: "Find the bug in this Python recursive function:",
          code: "def countdown(n):\n  print(n)\n  countdown(n - 1)",
          topic: "recursion",
          options: [
            { id: "A", text: "Add base case: if n <= 0: return" },
            { id: "B", text: "Change n - 1 to n + 1" },
            { id: "C", text: "Add return before countdown" },
            { id: "D", text: "Change print(n) to print(n-1)" },
          ],
          correctAnswer: "A",
          explanation: "No base case causes infinite recursion.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this Python function?",
          code: "def add_to_list(item, my_list=[]):\n  my_list.append(item)\n  return my_list\n\nprint(add_to_list(1))\nprint(add_to_list(2))",
          topic: "functions",
          options: [
            { id: "A", text: "Use None as default, create list inside" },
            { id: "B", text: "Change append to insert" },
            { id: "C", text: "Remove default parameter" },
            { id: "D", text: "Change [] to list()" },
          ],
          correctAnswer: "A",
          explanation: "Mutable default args are shared across calls.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this Python class?",
          code: "class Dog:\n  def __init__(self, name):\n    name = name\n\ndog = Dog('Buddy')\nprint(dog.name)",
          topic: "classes",
          options: [
            { id: "A", text: "Change 'name = name' to 'self.name = name'" },
            { id: "B", text: "Add return self" },
            { id: "C", text: "Change __init__ to __new__" },
            { id: "D", text: "Add parentheses after Dog" },
          ],
          correctAnswer: "A",
          explanation: "Without self., it creates a local variable not attribute.",
          timeLimit: 45,
        },
      ],
    },

    Java: {
      MCQ: [
        {
          question: "What is the output of this Java code?",
          code: "int x = 10;\nSystem.out.println(x / 3);",
          topic: "operators",
          options: [
            { id: "A", text: "3.33" },
            { id: "B", text: "3" },
            { id: "C", text: "4" },
            { id: "D", text: "3.0" },
          ],
          correctAnswer: "B",
          explanation: "Integer division truncates: 10 / 3 = 3.",
          timeLimit: 30,
        },
        {
          question: "What will be printed?",
          code: 'String s1 = "Hello";\nString s2 = "Hello";\nSystem.out.println(s1 == s2);',
          topic: "strings",
          options: [
            { id: "A", text: "true" },
            { id: "B", text: "false" },
            { id: "C", text: "Error" },
            { id: "D", text: "null" },
          ],
          correctAnswer: "A",
          explanation: "String literals share the String Pool, same reference.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: "int[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr.length);",
          topic: "arrays",
          options: [
            { id: "A", text: "4" },
            { id: "B", text: "5" },
            { id: "C", text: "6" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "Array has 5 elements, length is 5.",
          timeLimit: 30,
        },
        {
          question: "Which Java keyword inherits a class?",
          code: "class Dog _____ Animal { }",
          topic: "inheritance",
          options: [
            { id: "A", text: "inherits" },
            { id: "B", text: "extends" },
            { id: "C", text: "implements" },
            { id: "D", text: "super" },
          ],
          correctAnswer: "B",
          explanation: "'extends' is for class inheritance.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: 'String s = "Java";\nSystem.out.println(s.charAt(0));',
          topic: "strings",
          options: [
            { id: "A", text: "J" },
            { id: "B", text: "a" },
            { id: "C", text: "Java" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "A",
          explanation: "charAt(0) returns 'J'.",
          timeLimit: 30,
        },
        {
          question: "Default value of int in Java?",
          code: "class Test {\n  static int x;\n  public static void main(String[] args) {\n    System.out.println(x);\n  }\n}",
          topic: "variables",
          options: [
            { id: "A", text: "null" },
            { id: "B", text: "0" },
            { id: "C", text: "undefined" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "Default int value is 0 in Java.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: 'System.out.println(5 + 3 + "Java");',
          topic: "type-coercion",
          options: [
            { id: "A", text: "53Java" },
            { id: "B", text: "8Java" },
            { id: "C", text: "5 3 Java" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: '5+3=8 first, then 8+"Java"="8Java".',
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: "int[] arr = new int[3];\nSystem.out.println(arr[0]);",
          topic: "arrays",
          options: [
            { id: "A", text: "null" },
            { id: "B", text: "0" },
            { id: "C", text: "undefined" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "int arrays default to 0 in Java.",
          timeLimit: 30,
        },
      ],
      DEBUG: [
        {
          question: "Find the bug in this Java code:",
          code: 'String name = "Java";\nif (name == "Java") {\n  System.out.println("Match!");\n}',
          topic: "string-comparison",
          options: [
            { id: "A", text: "Use .equals() instead of ==" },
            { id: "B", text: "Remove quotes from Java" },
            { id: "C", text: "Change String to string" },
            { id: "D", text: "Add break after println" },
          ],
          correctAnswer: "A",
          explanation: "== compares references. Use .equals() for content.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this Java code?",
          code: "int[] arr = {1, 2, 3};\nfor (int i = 0; i <= arr.length; i++) {\n  System.out.println(arr[i]);\n}",
          topic: "arrays",
          options: [
            { id: "A", text: "Change <= to <" },
            { id: "B", text: "Change int i = 0 to int i = 1" },
            { id: "C", text: "Add arr.length - 1" },
            { id: "D", text: "Change int[] to Integer[]" },
          ],
          correctAnswer: "A",
          explanation: "<= causes ArrayIndexOutOfBoundsException.",
          timeLimit: 45,
        },
        {
          question: "Find the bug:",
          code: "public class Calculator {\n  int result;\n  public void add(int a, int b) {\n    int result = a + b;\n  }\n  public int getResult() { return result; }\n}",
          topic: "scope",
          options: [
            { id: "A", text: "Change 'int result' to 'this.result' in add" },
            { id: "B", text: "Make result static" },
            { id: "C", text: "Add return type to add" },
            { id: "D", text: "Make result public" },
          ],
          correctAnswer: "A",
          explanation: "Local 'result' shadows instance variable. Use this.result.",
          timeLimit: 45,
        },
        {
          question: "What is wrong?",
          code: "Scanner sc = new Scanner(System.in);\nint num = sc.nextInt();",
          topic: "imports",
          options: [
            { id: "A", text: "Add import java.util.Scanner;" },
            { id: "B", text: "Change Scanner to scanner" },
            { id: "C", text: "Add throws Exception" },
            { id: "D", text: "Change nextInt() to readInt()" },
          ],
          correctAnswer: "A",
          explanation: "Scanner must be imported from java.util.",
          timeLimit: 45,
        },
      ],
    },

    C: {
      MCQ: [
        {
          question: "What is the output of this C code?",
          code: '#include <stdio.h>\nint main() {\n  int x = 10;\n  printf("%d", x / 3);\n  return 0;\n}',
          topic: "operators",
          options: [
            { id: "A", text: "3.33" },
            { id: "B", text: "3" },
            { id: "C", text: "4" },
            { id: "D", text: "3.0" },
          ],
          correctAnswer: "B",
          explanation: "Integer division truncates: 10 / 3 = 3.",
          timeLimit: 30,
        },
        {
          question: "What is sizeof(int) on most 64-bit systems?",
          code: '#include <stdio.h>\nint main() {\n  printf("%lu", sizeof(int));\n  return 0;\n}',
          topic: "data-types",
          options: [
            { id: "A", text: "2" },
            { id: "B", text: "4" },
            { id: "C", text: "8" },
            { id: "D", text: "16" },
          ],
          correctAnswer: "B",
          explanation: "int is 4 bytes on most 64-bit systems.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: '#include <stdio.h>\nint main() {\n  int a = 5, b = 2;\n  float c = a / b;\n  printf("%.1f", c);\n  return 0;\n}',
          topic: "type-casting",
          options: [
            { id: "A", text: "2.5" },
            { id: "B", text: "2.0" },
            { id: "C", text: "3.0" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "Integer division happens first: 5/2=2, then stored as 2.0.",
          timeLimit: 30,
        },
        {
          question: "What does & do here?",
          code: '#include <stdio.h>\nint main() {\n  int x = 10;\n  printf("%p", &x);\n  return 0;\n}',
          topic: "pointers",
          options: [
            { id: "A", text: "Bitwise AND" },
            { id: "B", text: "Returns address of x" },
            { id: "C", text: "Returns value of x" },
            { id: "D", text: "Logical AND" },
          ],
          correctAnswer: "B",
          explanation: "Unary & returns the memory address of a variable.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: '#include <stdio.h>\n#include <string.h>\nint main() {\n  char str[] = "Hello";\n  printf("%lu", strlen(str));\n  return 0;\n}',
          topic: "strings",
          options: [
            { id: "A", text: "5" },
            { id: "B", text: "6" },
            { id: "C", text: "4" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "A",
          explanation: 'strlen counts chars before null terminator. "Hello" = 5.',
          timeLimit: 30,
        },
        {
          question: "What is *(arr + 2)?",
          code: '#include <stdio.h>\nint main() {\n  int arr[] = {10, 20, 30, 40, 50};\n  printf("%d", *(arr + 2));\n  return 0;\n}',
          topic: "pointers",
          options: [
            { id: "A", text: "10" },
            { id: "B", text: "20" },
            { id: "C", text: "30" },
            { id: "D", text: "40" },
          ],
          correctAnswer: "C",
          explanation: "*(arr + 2) equals arr[2] which is 30.",
          timeLimit: 30,
        },
        {
          question: "What does printing char with %d give?",
          code: "#include <stdio.h>\nint main() {\n  char c = 'A';\n  printf(\"%d\", c);\n  return 0;\n}",
          topic: "data-types",
          options: [
            { id: "A", text: "A" },
            { id: "B", text: "65" },
            { id: "C", text: "97" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "%d prints ASCII value. 'A' = 65.",
          timeLimit: 30,
        },
        {
          question: "What is the output?",
          code: '#include <stdio.h>\nint main() {\n  int a = 10;\n  int *p = &a;\n  *p = 20;\n  printf("%d", a);\n  return 0;\n}',
          topic: "pointers",
          options: [
            { id: "A", text: "10" },
            { id: "B", text: "20" },
            { id: "C", text: "Address" },
            { id: "D", text: "Error" },
          ],
          correctAnswer: "B",
          explanation: "*p = 20 changes value at address of a. a becomes 20.",
          timeLimit: 30,
        },
      ],
      DEBUG: [
        {
          question: "Find the bug in this C code:",
          code: '#include <stdio.h>\nint main() {\n  int arr[5] = {1, 2, 3, 4, 5};\n  for (int i = 0; i <= 5; i++) {\n    printf("%d ", arr[i]);\n  }\n  return 0;\n}',
          topic: "arrays",
          options: [
            { id: "A", text: "Change <= 5 to < 5" },
            { id: "B", text: "Change i = 0 to i = 1" },
            { id: "C", text: "Change arr[5] to arr[6]" },
            { id: "D", text: "Add newline" },
          ],
          correctAnswer: "A",
          explanation: "<= 5 accesses arr[5] which is out of bounds.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this C code?",
          code: '#include <stdio.h>\n#include <stdlib.h>\nint main() {\n  int *p = (int *)malloc(5 * sizeof(int));\n  p[0] = 10;\n  printf("%d", p[0]);\n  return 0;\n}',
          topic: "memory",
          options: [
            { id: "A", text: "Missing free(p) - memory leak" },
            { id: "B", text: "malloc used incorrectly" },
            { id: "C", text: "Should use calloc" },
            { id: "D", text: "Missing null check" },
          ],
          correctAnswer: "A",
          explanation: "Must free(p) before return to prevent memory leak.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this C pointer?",
          code: '#include <stdio.h>\nint main() {\n  int *p;\n  *p = 10;\n  printf("%d", *p);\n  return 0;\n}',
          topic: "pointers",
          options: [
            { id: "A", text: "Initialize pointer: int x; int *p = &x;" },
            { id: "B", text: "Change int *p to int p" },
            { id: "C", text: "Add & before p" },
            { id: "D", text: "Change %d to %p" },
          ],
          correctAnswer: "A",
          explanation: "Uninitialized pointer causes undefined behavior.",
          timeLimit: 45,
        },
        {
          question: "What is wrong with this C scanf?",
          code: '#include <stdio.h>\nint main() {\n  int n;\n  scanf("%d", n);\n  printf("You entered: %d", n);\n  return 0;\n}',
          topic: "input",
          options: [
            { id: "A", text: "Change n to &n in scanf" },
            { id: "B", text: "Change %d to %i" },
            { id: "C", text: "Add newline in scanf" },
            { id: "D", text: "Initialize n to 0" },
          ],
          correctAnswer: "A",
          explanation: "scanf needs address: &n not n.",
          timeLimit: 45,
        },
      ],
    },
  };

  const langFallbacks = fallbacks[lang];
  if (!langFallbacks) {
    const jsFallbacks = fallbacks.JavaScript;
    const normalizedType = type === "DEBUG" ? "DEBUG" : "MCQ";
    const pool = jsFallbacks[normalizedType];
    return pool[index % pool.length];
  }

  const normalizedType = type === "DEBUG" ? "DEBUG" : "MCQ";
  const pool = langFallbacks[normalizedType];

  if (!pool || pool.length === 0) {
    const mcqPool = langFallbacks.MCQ;
    return mcqPool[index % mcqPool.length];
  }

  return pool[index % pool.length];
};

/**
 * Generate questions for a race
 */
const generateQuestionsForRace = async (language, level, totalLaps) => {
  const questions = [];
  const questionsPerLap = 2;
  const normalizedLanguage = normalizeLanguage(language);
  const usedQuestionIds = new Set();
  let fallbackCounter = 0;

  console.log(`📚 Generating ${totalLaps * questionsPerLap} questions for ${normalizedLanguage} (Level ${level})`);

  for (let lap = 1; lap <= totalLaps; lap++) {
    for (let q = 0; q < questionsPerLap; q++) {
      const questionType = lap === 1 ? "MCQ" : q === 0 ? "MCQ" : "DEBUG";

      console.log(`  Lap ${lap}, Q${q + 1} (${questionType}) for ${normalizedLanguage}`);

      try {
        let question = null;

        // Step 1: Try cached questions
        const cachedQuestions = await Question.find({
          language: normalizedLanguage,
          difficulty: level,
          type: questionType,
          _id: { $nin: Array.from(usedQuestionIds) },
        }).limit(20);

        if (cachedQuestions && cachedQuestions.length > 0) {
          const randomIdx = Math.floor(Math.random() * cachedQuestions.length);
          question = cachedQuestions[randomIdx];
          console.log(`📦 Cached: ${question._id}`);
        }

        // Step 2: No cache? Try AI generation
        if (!question) {
          console.log("🤖 Generating AI question...");
          try {
            const questionData = await generateQuestion({
              language: normalizedLanguage,
              difficulty: level,
              type: questionType,
            });

            question = await Question.create({
              ...questionData,
              language: normalizedLanguage,
              difficulty: level,
              type: questionType,
              isAIGenerated: true,
            });
            console.log("✅ AI question created");

            // ✅ Wait between AI calls to avoid rate limiting
            await sleep(12000);

          } catch (aiError) {
            console.error("❌ AI failed:", aiError.message);
            question = null;
          }
        }

        // Step 3: Still no question? Use fallback
        if (!question) {
          const fallbackData = getFallbackQuestion(normalizedLanguage, questionType, fallbackCounter);
          fallbackCounter++;
          console.log(`📦 Fallback #${fallbackCounter} for ${normalizedLanguage} ${questionType}`);

          try {
            question = await Question.create({
              ...fallbackData,
              language: normalizedLanguage,
              difficulty: level,
              type: questionType,
              isAIGenerated: false,
            });
          } catch (dbError) {
            question = {
              _id: `fallback_${normalizedLanguage}_${fallbackCounter}_${Date.now()}`,
              ...fallbackData,
              language: normalizedLanguage,
              difficulty: level,
              type: questionType,
              isAIGenerated: false,
            };
          }
        }

        if (question._id) usedQuestionIds.add(question._id.toString());
        questions.push(question);

      } catch (error) {
        console.error("❌ Total failure:", error.message);
        const fallbackData = getFallbackQuestion(normalizedLanguage, questionType, fallbackCounter);
        fallbackCounter++;
        questions.push({
          _id: `emergency_${normalizedLanguage}_${fallbackCounter}_${Date.now()}`,
          ...fallbackData,
          language: normalizedLanguage,
          difficulty: level,
          type: questionType,
          isAIGenerated: false,
        });
      }
    }
  }

  console.log(`✅ Generated ${questions.length} questions for ${normalizedLanguage}`);
  return questions;
};

/**
 * Seed initial questions
 */
const seedQuestionsWithAI = async () => {
  const languages = ["Python", "JavaScript", "Java", "C"];
  const types = ["MCQ", "DEBUG"];

  console.log("🌱 Starting question seeding...");

  for (const language of languages) {
    for (let level = 1; level <= 5; level++) {
      for (const type of types) {
        try {
          const existingCount = await Question.countDocuments({ language, difficulty: level, type });

          if (existingCount >= 3) {
            console.log(`✓ ${language} L${level} ${type}: ${existingCount} exist`);
            continue;
          }

          const needed = 3 - existingCount;
          for (let i = 0; i < needed; i++) {
            console.log(`🤖 ${language} L${level} ${type} #${i + 1}...`);
            try {
              const questionData = await generateQuestion({ language, difficulty: level, type });
              await Question.create({ ...questionData, language, difficulty: level, type, isAIGenerated: true });
              console.log("✅ AI created");
            } catch (aiError) {
              console.warn(`⚠️ AI failed: ${aiError.message}`);
              const fallbackData = getFallbackQuestion(language, type, i);
              await Question.create({ ...fallbackData, language, difficulty: level, type, isAIGenerated: false });
              console.log(`✅ Fallback created for ${language}`);
            }
            await sleep(12000);
          }
        } catch (error) {
          console.error(`❌ Seed error ${language} L${level} ${type}:`, error.message);
        }
      }
    }
  }
  console.log("✅ Seeding complete!");
};

/**
 * Adaptive question generation
 */
const getAdaptiveQuestion = async (language, level, type, performanceData) => {
  const normalizedLanguage = normalizeLanguage(language);
  try {
    const questionData = await generateQuestion({ language: normalizedLanguage, difficulty: level, type, performanceData });
    const question = await Question.create({ ...questionData, language: normalizedLanguage, difficulty: level, type, isAIGenerated: true });
    return question;
  } catch (error) {
    console.error("❌ Adaptive failed:", error.message);
    const fallbackData = getFallbackQuestion(normalizedLanguage, type, 0);
    try {
      return await Question.create({ ...fallbackData, language: normalizedLanguage, difficulty: level, type, isAIGenerated: false });
    } catch (dbError) {
      return { _id: `adaptive_fallback_${Date.now()}`, ...fallbackData, language: normalizedLanguage, difficulty: level, type, isAIGenerated: false };
    }
  }
};

module.exports = {
  generateQuestionsForRace,
  seedQuestionsWithAI,
  getAdaptiveQuestion,
  getFallbackQuestion,
  normalizeLanguage,
};
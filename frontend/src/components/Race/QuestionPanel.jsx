import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function QuestionPanel({ question, questionNumber, totalQuestions = 3, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit || 30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Normalize options to always be { id, text } objects
  const options = (question?.options || []).map((opt, i) => ({
    id: typeof opt === 'object' && opt.id ? opt.id : String.fromCharCode(65 + i),
    text: typeof opt === 'object' ? (opt.text || String(opt)) : String(opt),
  }));

  // Refs to avoid stale closures
  const isSubmittedRef = useRef(false);
  const selectedAnswerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Keep selectedAnswerRef in sync with state
  useEffect(() => { selectedAnswerRef.current = selectedAnswer; }, [selectedAnswer]);

  // handleSubmit must be declared BEFORE any useEffect that references it
  const handleSubmit = useCallback(async (answer) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSubmitted(true);

    const finalAnswer = (answer !== null && answer !== undefined) ? answer : selectedAnswerRef.current;
    const responseTime = (Date.now() - startTimeRef.current) / 1000;

    const response = await onAnswer(finalAnswer, responseTime);
    if (response) setResult(response);
  }, [onAnswer]);

  // Reset ALL state when question._id changes (new question)
  useEffect(() => {
    isSubmittedRef.current = false;
    selectedAnswerRef.current = null;
    startTimeRef.current = Date.now();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSelectedAnswer(null);
    setTimeLeft(question?.timeLimit || 30);
    setIsSubmitted(false);
    setResult(null);
  }, [question?._id]);

  // Timer — count down independently
  useEffect(() => {
    if (isSubmitted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSubmitted, question?._id]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isSubmittedRef.current) {
      handleSubmit(selectedAnswerRef.current);
    }
  }, [timeLeft, handleSubmit]);

  const getTimerColor = () => {
    if (timeLeft > 20) return '#00ff88';
    if (timeLeft > 10) return '#ffdd00';
    return '#ff4444';
  };

  const getOptionStyle = (optId) => {
    const base = 'w-full text-left p-3 rounded-lg border transition-all mb-2 text-sm ';
    if (isSubmitted && result) {
      if (optId === result.correctAnswer) return base + 'border-green-500 bg-green-500/20 text-green-300';
      if (optId === selectedAnswer && !result.isCorrect) return base + 'border-red-500 bg-red-500/20 text-red-300';
      return base + 'border-gray-700 bg-gray-900/30 text-gray-500';
    }
    if (selectedAnswer === optId) return base + 'border-blue-400 bg-blue-400/20 text-white';
    return base + 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-400 cursor-pointer';
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-racing text-neon-blue">
          Question {questionNumber}/{totalQuestions}
        </span>
        <span className="font-racing text-xl" style={{ color: getTimerColor() }}>
          {timeLeft}s
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-dark-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(timeLeft / (question?.timeLimit || 30)) * 100}%`,
            background: getTimerColor(),
            transition: 'width 1s linear, background 0.3s',
          }}
        />
      </div>

      {/* Question Type Badge */}
      <div className="mb-4">
        <span className={`px-2 py-1 rounded text-xs font-body ${
          question?.type === 'DEBUG'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-neon-purple/20 text-neon-purple'
        }`}>
          {question?.type === 'DEBUG' ? '🐛 Debug' : '📝 MCQ'}
        </span>
      </div>

      {/* Question Text */}
      <div className="mb-4">
        <p className="font-body text-white text-lg leading-relaxed">
          {question?.question}
        </p>
      </div>

      {/* Code Block (if present) */}
      {question?.code && (
        <div className="mb-4 bg-dark-100 rounded-lg p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-neon-green whitespace-pre-wrap">
            {question.code}
          </pre>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => !isSubmitted && setSelectedAnswer(opt.id)}
            disabled={isSubmitted}
            className={getOptionStyle(opt.id)}
          >
            <span className="font-racing mr-3">{opt.id}.</span>
            <span className="font-body">{opt.text}</span>
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <button
          onClick={() => handleSubmit(selectedAnswerRef.current)}
          disabled={!selectedAnswer}
          className={`w-full py-3 px-4 rounded-lg font-racing text-base transition-all ${
            selectedAnswer
              ? 'bg-neon-blue text-white hover:bg-neon-blue/80'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit Answer
        </button>
      )}

      {/* Result feedback */}
      {isSubmitted && result && (
        <div className={`w-full py-3 px-4 rounded-lg ${
          result.isCorrect
            ? 'bg-neon-green/20 text-neon-green border border-neon-green'
            : 'bg-red-500/20 text-red-500 border border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-racing text-lg">
              {result.isCorrect ? '✅ Correct! Speed boost!' : '❌ Wrong! Speed penalty!'}
            </span>
          </div>
          {result.explanation && (
            <p className="font-body text-gray-300 text-sm mt-2">
              {result.explanation}
            </p>
          )}
          {result.streak > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-neon-yellow">🔥</span>
              <span className="font-body text-neon-yellow">
                {result.streak} streak!
                {result.streak === 3 && ' Nitro unlocked!'}
                {result.streak === 5 && ' Shield unlocked!'}
                {result.streak === 7 && ' Slow opponent unlocked!'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
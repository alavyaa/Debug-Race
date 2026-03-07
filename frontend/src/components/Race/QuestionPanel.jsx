import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../common/Button';

export default function QuestionPanel({ question, questionNumber, totalQuestions, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit || 30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Refs to avoid stale closures in timer and submit
  const isSubmittedRef = useRef(false);
  const selectedAnswerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const handleSubmitRef = useRef(null);

  // Keep selectedAnswerRef in sync with state
  useEffect(() => {
    selectedAnswerRef.current = selectedAnswer;
  }, [selectedAnswer]);

  // Reset on new question (keyed by question._id to avoid re-triggering on same question)
  useEffect(() => {
    isSubmittedRef.current = false;
    selectedAnswerRef.current = null;
    startTimeRef.current = Date.now();
    setSelectedAnswer(null);
    setTimeLeft(question?.timeLimit || 30);
    setIsSubmitted(false);
    setResult(null);
  }, [question?._id]);

  // Timer — decrement every second
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isSubmittedRef.current) {
      handleSubmitRef.current?.(null);
    }
  }, [timeLeft]);

  const handleSubmit = useCallback(async (answer) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setIsSubmitted(true);

    const finalAnswer = (answer !== undefined && answer !== null)
      ? answer
      : selectedAnswerRef.current;

    const responseTime = (Date.now() - startTimeRef.current) / 1000;

    const response = await onAnswer(finalAnswer, responseTime);
    setResult(response);
  }, [onAnswer]);

  // Keep handleSubmitRef up-to-date so the timeLeft effect can call it without stale closure
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-neon-green';
    if (timeLeft > 10) return 'text-neon-yellow';
    return 'text-red-500';
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-racing text-neon-blue">
          Question {questionNumber}{totalQuestions ? ` / ${totalQuestions}` : ''}
        </span>
        <span className={`font-racing text-xl ${getTimerColor()}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-dark-100 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            timeLeft > 20 ? 'bg-neon-green' : timeLeft > 10 ? 'bg-neon-yellow' : 'bg-red-500'
          }`}
          style={{ width: `${(timeLeft / (question?.timeLimit || 30)) * 100}%` }}
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
        {question?.options?.map((option) => {
          let optionClass = 'border-gray-600 hover:border-neon-blue/50 text-gray-300';
          if (isSubmitted && result) {
            if (result.isCorrect && option.id === selectedAnswer) {
              // User's correct answer
              optionClass = 'border-green-500 bg-green-500/20 text-green-400';
            } else if (!result.isCorrect && option.id === selectedAnswer) {
              // User's wrong answer
              optionClass = 'border-red-500 bg-red-500/20 text-red-400';
            } else if (option.id === result?.correctAnswer) {
              // Show the correct answer even when user was wrong
              optionClass = 'border-green-500 bg-green-500/20 text-green-400';
            } else {
              optionClass = 'border-gray-700 text-gray-500';
            }
          } else if (isSubmitted) {
            // result not yet loaded — keep neutral
            optionClass = option.id === selectedAnswer
              ? 'border-neon-blue bg-neon-blue/20 text-white'
              : 'border-gray-600 text-gray-400';
          } else if (selectedAnswer === option.id) {
            optionClass = 'border-neon-blue bg-neon-blue/20 text-white';
          }
          return (
            <button
              key={option.id}
              onClick={() => !isSubmitted && setSelectedAnswer(option.id)}
              disabled={isSubmitted}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${optionClass}`}
            >
              <span className="font-racing mr-3">{option.id}.</span>
              <span className="font-body">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleSubmit(selectedAnswer)}
          disabled={!selectedAnswer}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {isSubmitted && result && (
        <div className={`w-full py-3 px-4 rounded-lg ${
          result.isCorrect ? 'bg-neon-green/20 text-neon-green border border-neon-green' : 'bg-red-500/20 text-red-500 border border-red-500'
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
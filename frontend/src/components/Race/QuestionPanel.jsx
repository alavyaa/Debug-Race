import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';

export default function QuestionPanel({ question, questionNumber, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit || 30);
  const [startTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Timer
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  // Reset on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setTimeLeft(question?.timeLimit || 30);
    setIsSubmitted(false);
    setResult(null);
  }, [question]);

  const handleSubmit = useCallback(async (answer) => {
    if (isSubmitted) return;

    setIsSubmitted(true);
    const responseTime = (Date.now() - startTime) / 1000;
    
    const response = await onAnswer(answer || selectedAnswer, responseTime);
    setResult(response);
  }, [isSubmitted, selectedAnswer, startTime, onAnswer]);

  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-neon-green';
    if (timeLeft > 10) return 'text-neon-yellow';
    return 'text-red-500';
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-racing text-neon-blue">Question {questionNumber}</span>
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
          if (isSubmitted) {
            if (option.id === result?.correctAnswer) {
              optionClass = 'border-neon-green bg-neon-green/20 text-neon-green';
            } else if (option.id === selectedAnswer && !result?.isCorrect) {
              optionClass = 'border-red-500 bg-red-500/20 text-red-500';
            } else {
              optionClass = 'border-gray-600 text-gray-400';
            }
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
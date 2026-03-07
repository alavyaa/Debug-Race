import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import api from '../../services/api.service';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Podium from './Podium';
import Analytics from './Analytics';

export default function RaceEndPage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('podium');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get(`/race/${raceId}/results`);
        setResults(response.data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [raceId]);

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
    navigate('/home');
  };

  const currentUserResult = results.find(r => r.user._id === state.user?._id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <Loading text="Calculating results..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-racing text-5xl text-white mb-2 neon-text">
            🏁 Race Complete!
          </h1>
          <p className="font-body text-xl text-neon-blue">
            {currentUserResult?.rank === 1 ? '🎉 Victory!' : `You finished #${currentUserResult?.rank}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('podium')}
            className={`px-6 py-2 font-racing rounded-lg transition-all ${
              activeTab === 'podium'
                ? 'bg-neon-blue text-dark-100'
                : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            🏆 Podium
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 font-racing rounded-lg transition-all ${
              activeTab === 'analytics'
                ? 'bg-neon-blue text-dark-100'
                : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-6 py-2 font-racing rounded-lg transition-all ${
              activeTab === 'review'
                ? 'bg-neon-blue text-dark-100'
                : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            📝 Review
          </button>
        </div>

        {/* Content */}
        <div className="bg-dark-200 rounded-lg border border-neon-blue/30 p-6 mb-8">
          {activeTab === 'podium' && <Podium results={results} />}
          {activeTab === 'analytics' && <Analytics result={currentUserResult} />}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <h3 className="font-racing text-xl text-neon-blue mb-4">Wrong Answers Review</h3>
              {currentUserResult?.wrongAnswers?.length > 0 ? (
                currentUserResult.wrongAnswers.map((wrong, index) => (
                  <div key={index} className="bg-dark-100 rounded-lg p-4">
                    <p className="font-body text-white mb-2">{wrong.question?.question}</p>
                    {wrong.question?.code && (
                      <pre className="bg-dark-200 p-3 rounded text-neon-green font-mono text-sm mb-2">
                        {wrong.question.code}
                      </pre>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span className="text-red-400">Your answer: {wrong.userAnswer}</span>
                      <span className="text-neon-green">Correct: {wrong.correctAnswer}</span>
                    </div>
                    <p className="font-body text-gray-400 text-sm mt-2">{wrong.explanation}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">
                  🎯 Perfect! No wrong answers to review!
                </p>
              )}
            </div>
          )}
        </div>

        {/* XP Earned */}
        {currentUserResult?.xpEarned && (
          <div className="text-center mb-8 p-4 bg-neon-purple/20 rounded-lg border border-neon-purple">
            <p className="font-racing text-2xl text-neon-purple">
              +{currentUserResult.xpEarned} XP Earned!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="primary" size="lg" onClick={handlePlayAgain}>
            🏠 Back to Home
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/stats')}>
            📊 View Stats
          </Button>
        </div>
      </div>
    </div>
  );
}
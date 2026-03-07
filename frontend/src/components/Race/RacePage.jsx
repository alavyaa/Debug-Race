import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import api from "../../services/api.service";
import { PLAYER_COLORS } from '../../utils/constants';
import QuestionPanel from './QuestionPanel';
import SpeedBar from './SpeedBar';
import Leaderboard from './Leaderboard';
import RaceTrack from './RaceTrack';

export default function RacePage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [raceData, setRaceData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [mySpeed, setMySpeed] = useState(0);

  // Initialize race data
  useEffect(() => {
    const fetchRace = async () => {
      try {
        const response = await api.get(`/race/${raceId}`);
        setRaceData(response.data);
        dispatch({ type: 'SET_RACE', payload: response.data });

        if (response.data.questions?.length > 0) {
          setCurrentQuestion(response.data.questions[0].question);
        }

        // Build initial positions from raceData players
        if (response.data.players?.length > 0) {
          const initialPositions = response.data.players.map((p, idx) => ({
            playerId: p.userId || p._id || p.socketId,
            username: p.username || p.name || `Player ${idx + 1}`,
            position: 0,
            lap: 1,
            speed: 0,
            color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
          }));
          setPositions(initialPositions);
        }

      } catch (error) {
        console.error('Failed to fetch race:', error);
        navigate('/home');
      }
    };

    fetchRace();
  }, [raceId, dispatch, navigate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('speedUpdate', ({ playerId, speed, streak }) => {
      if (playerId === socket.id) {
        setMySpeed(speed);
        dispatch({
          type: 'UPDATE_PLAYER_STATS',
          payload: { speed, streak }
        });
      }
    });

    socket.on('positionUpdate', ({ playerId, position, lap, speed }) => {
      setPositions(prev => {
        const existing = prev.find(p => p.playerId === playerId);
        const color = existing?.color || PLAYER_COLORS[prev.length % PLAYER_COLORS.length];
        const username = existing?.username ||
          raceData?.players?.find(p => (p.userId || p._id || p.socketId) === playerId)?.username ||
          `Player ${playerId?.slice(-4)}`;

        const updated = prev.filter(p => p.playerId !== playerId);
        updated.push({ playerId, position, lap, speed, color, username });

        return updated.sort((a, b) => {
          if (a.lap !== b.lap) return b.lap - a.lap;
          return b.position - a.position;
        });
      });
    });

    socket.on('newQuestion', ({ question, questionIndex: idx }) => {
      setCurrentQuestion(question);
      setQuestionIndex(idx);
      setShowQuestion(true);
    });

    socket.on('lapComplete', ({ playerId, lap }) => {
      console.log(`Player ${playerId} completed lap ${lap}`);
    });

    socket.on('playerFinished', ({ playerId, rank }) => {
      console.log(`Player ${playerId} finished in position ${rank}`);
    });

    socket.on('raceFinished', () => {
      navigate(`/results/${raceId}`);
    });

    return () => {
      socket.off('speedUpdate');
      socket.off('positionUpdate');
      socket.off('newQuestion');
      socket.off('lapComplete');
      socket.off('playerFinished');
      socket.off('raceFinished');
    };

  }, [socket, dispatch, navigate, raceId, raceData]);

  // Handle answer submission
  const handleAnswer = useCallback(async (answer, responseTime) => {

    try {

      const response = await api.post(`/race/${raceId}/answer`, {
        questionId: currentQuestion._id,
        answer,
        responseTime
      });

      const { isCorrect, streak } = response.data;

      socket?.emit('answerSubmitted', {
        teamCode: state.team?.code,
        isCorrect,
        responseTime
      });

      dispatch({
        type: 'UPDATE_PLAYER_STATS',
        payload: {
          streak,
          correctAnswers: state.playerStats.correctAnswers + (isCorrect ? 1 : 0),
          totalQuestions: state.playerStats.totalQuestions + 1
        }
      });

      setShowQuestion(false);

      setTimeout(() => {

        const nextIndex = questionIndex + 1;

        if (raceData?.questions?.[nextIndex]) {
          setCurrentQuestion(raceData.questions[nextIndex].question);
          setQuestionIndex(nextIndex);
          setShowQuestion(true);
        }

      }, 2000);

      return response.data;

    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

  }, [raceId, currentQuestion, socket, state, dispatch, questionIndex, raceData]);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>

      {/* Lap counter top-left */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 14px', border: '1px solid rgba(0,170,255,0.4)' }}>
        <span className="font-racing text-white">
          Lap {state.playerStats.lap} / {raceData?.settings?.totalLaps || 3}
        </span>
      </div>

      {/* Main content row */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left: Race Track (65%) */}
        <div style={{ flex: '0 0 65%', display: 'flex', alignItems: 'stretch', minHeight: 500 }}>
          <RaceTrack players={positions} currentUserId={socket?.id} />
        </div>

        {/* Right: Leaderboard + Question Panel (35%) */}
        <div style={{ flex: '0 0 35%', background: '#161b22', borderLeft: '1px solid rgba(0,170,255,0.2)', display: 'flex', flexDirection: 'column' }}>

          {/* Leaderboard */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,170,255,0.15)' }}>
            <Leaderboard positions={positions} currentUserId={socket?.id} />
          </div>

          {/* Question Panel */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {showQuestion && currentQuestion && (
              <QuestionPanel
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                onAnswer={handleAnswer}
              />
            )}
            {!showQuestion && (
              <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                <p className="font-body">Waiting for next question...</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Bottom bar: SpeedBar */}
      <div style={{ background: '#0d1117', borderTop: '1px solid rgba(0,170,255,0.2)' }}>
        <SpeedBar
          speed={mySpeed}
          nitro={state.playerStats.nitro}
          shield={state.playerStats.shield}
        />
      </div>

    </div>
  );
}

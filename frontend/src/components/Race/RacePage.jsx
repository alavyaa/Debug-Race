import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import api from "../../services/api.service";
import { PLAYER_COLORS } from '../../utils/constants';
import QuestionPanel from './QuestionPanel';
import SpeedBar from './SpeedBar';
import Leaderboard from './Leaderboard';
import RaceTrack from './RaceTrack';

// Helper: get the question wrapper for a given lap+index (MCQ first)
function getLapQuestion(data, lap, idx) {
  if (!data?.questions) return null;

  const questionsPerLap = 2;
  const index = (lap - 1) * questionsPerLap + idx;

  return data.questions[index] || null;
}
export default function RacePage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { socket } = useSocket();

  const [currentLap, setCurrentLap] = useState(1);
  const [lapQIdx, setLapQIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [waitingForNextLap, setWaitingForNextLap] = useState(false);
  const [raceData, setRaceData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [mySpeed, setMySpeed] = useState(0);

  // Always-up-to-date refs for use in callbacks/closures
  const raceDataRef = useRef(null);
  const currentLapRef = useRef(1);
  const answeredIds = useRef(new Set());

  // Keep currentLapRef in sync
  useEffect(() => { currentLapRef.current = currentLap; }, [currentLap]);

  // Initialize race data
  useEffect(() => {
    const fetchRace = async () => {
      try {
        const response = await api.get(`/race/${raceId}`);
        const raceResp = response.data;
        raceDataRef.current = raceResp;
        setRaceData(raceResp);
        dispatch({ type: 'SET_RACE', payload: raceResp });

        const firstQ = getLapQuestion(raceResp, 1, 0);
        if (firstQ) {
          setCurrentQuestion(firstQ?.question);
          setShowQuestion(true);
        }


      } catch (error) {
        console.error('Failed to fetch race:', error);
        navigate('/home');
      }
    };

    fetchRace();
  }, [raceId]);

  // Emit joinRace when socket is ready so server can map socket.id -> username
  useEffect(() => {
    if (!socket || !raceId) return;
    socket.emit('joinRace', {
      raceId,
      userId: state.user?._id,
      username: state.user?.username,
    });
  }, [socket, raceId, state.user?._id, state.user?.username]);

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

    socket.on('positionUpdate', ({ playerId, position, lap, speed, username }) => {
  setPositions(prev => {
    const existing = prev.find(p => p.playerId === playerId);

    const color =
      existing?.color || PLAYER_COLORS[prev.length % PLAYER_COLORS.length];

    const displayName =
         existing?.username ||
         username ||
         state.user?.username ||
        `Player ${playerId?.slice(-4)}`;

    const updated = prev.filter(p => p.playerId !== playerId);

    updated.push({
      playerId,
      position,
      lap,
      speed,
      color,
      username: displayName
    });

    return updated;   // ⭐ THIS WAS MISSING
  });
});

    socket.on('lapComplete', ({ lap }) => {
      const nextLap = lap + 1;
      const data = raceDataRef.current;
      const nextQ = getLapQuestion(data, nextLap, 0);
      if (nextQ) {
        setCurrentLap(nextLap);
        currentLapRef.current = nextLap;
        setLapQIdx(0);
        setCurrentQuestion(nextQ.question);
        setWaitingForNextLap(false);
        setShowQuestion(true);
        answeredIds.current.clear();
      }
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
      socket.off('lapComplete');
      socket.off('playerFinished');
      socket.off('raceFinished');
    };

  }, [socket, dispatch, navigate, raceId]);

  // Handle answer submission
  const handleAnswer = useCallback(async (answer, responseTime) => {
    if (!currentQuestion?._id) return;
    if (answeredIds.current.has(currentQuestion._id.toString())) return;
    answeredIds.current.add(currentQuestion._id.toString());

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
        responseTime,
        raceId,
      });

      dispatch({
        type: 'UPDATE_PLAYER_STATS',
        payload: {
          streak,
          correctAnswers: state.playerStats.correctAnswers + (isCorrect ? 1 : 0),
          totalQuestions: state.playerStats.totalQuestions + 1
        }
      });

      // Delay hiding the question panel so the result highlight is visible for 2s
      setTimeout(() => {
        const data = raceDataRef.current;
        const lap = currentLapRef.current;
        setLapQIdx(prev => {
          const nextIdx = prev + 1;
          const nextQ = getLapQuestion(data, lap, nextIdx);
          if (nextQ) {
            setCurrentQuestion(nextQ.question);
            setShowQuestion(true);
            return nextIdx;
          } else {
            setShowQuestion(false);
            setWaitingForNextLap(true);
            return prev;
          }
        });
      }, 2000);

      return response.data;

    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

  }, [raceId, currentQuestion?._id, socket, state.team?.code, state.playerStats.correctAnswers, state.playerStats.totalQuestions, dispatch]);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>

      {/* Lap counter top-left */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 14px', border: '1px solid rgba(0,170,255,0.4)' }}>
        <span className="font-racing text-white">
          Lap {currentLap} / {raceData?.settings?.totalLaps || 3}
        </span>
      </div>

      {/* Main content row */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left: Race Track (65%) */}
        <div style={{ flex: '0 0 65%', display: 'flex', alignItems: 'stretch', minHeight: 500 }}>
          <RaceTrack players={positions} currentUserId={state.user?._id} />
        </div>

        {/* Right: Leaderboard + Question Panel (35%) */}
        <div style={{ flex: '0 0 35%', background: '#161b22', borderLeft: '1px solid rgba(0,170,255,0.2)', display: 'flex', flexDirection: 'column' }}>

          {/* Leaderboard */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,170,255,0.15)' }}>
            <Leaderboard positions={positions} currentUserId={socket?.id} />
          </div>

          {/* Question Panel */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {showQuestion && currentQuestion ? (
              <QuestionPanel
                question={currentQuestion}
                questionNumber={lapQIdx + 1}
                totalQuestions={3}
                onAnswer={handleAnswer}
              />
            ) : waitingForNextLap ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                🏁 Lap complete! Waiting for next lap...
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                <p className="font-body">Loading question...</p>
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

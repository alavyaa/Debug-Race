import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import api from "../../services/api.service";
import Phaser from 'phaser';
import { RaceScene } from '../../game/scenes/RaceScene';
import QuestionPanel from './QuestionPanel';
import SpeedBar from './SpeedBar';
import Leaderboard from './Leaderboard';

export default function RacePage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const gameRef = useRef(null);
  const gameContainerRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [raceData, setRaceData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [gameInstance, setGameInstance] = useState(null);

  // Initialize race data
  useEffect(() => {
    const fetchRace = async () => {
      try {
        const response = await getRace(raceId);
        setRaceData(response.data);
        dispatch({ type: 'SET_RACE', payload: response.data });
        
        // Set first question
        if (response.data.questions?.length > 0) {
          setCurrentQuestion(response.data.questions[0].question);
        }
      } catch (error) {
        console.error('Failed to fetch race:', error);
        navigate('/home');
      }
    };
    fetchRace();
  }, [raceId, dispatch, navigate]);

  // Initialize Phaser game
  useEffect(() => {
    if (!gameContainerRef.current || gameInstance) return;

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainerRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: [RaceScene]
    };

    const game = new Phaser.Game(config);
    setGameInstance(game);

    // Pass socket and dispatch to game
    game.registry.set('socket', socket);
    game.registry.set('dispatch', dispatch);
    game.registry.set('raceId', raceId);
    game.registry.set('userId', state.user?._id);

    return () => {
      game.destroy(true);
    };
  }, [gameContainerRef.current]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('speedUpdate', ({ playerId, speed, streak }) => {
      if (gameInstance?.scene?.scenes[0]) {
        gameInstance.scene.scenes[0].updateCarSpeed(playerId, speed);
      }
      if (playerId === socket.id) {
        dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { speed, streak } });
      }
    });

    socket.on('positionUpdate', ({ playerId, position, lap, speed }) => {
      setPositions(prev => {
        const updated = prev.filter(p => p.playerId !== playerId);
        updated.push({ playerId, position, lap, speed });
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

    socket.on('raceFinished', ({ results }) => {
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
  }, [socket, gameInstance, dispatch, navigate, raceId]);

  // Handle answer submission
  const handleAnswer = useCallback(async (answer, responseTime) => {
    try {
      const response = await submitAnswer(raceId, {
        questionId: currentQuestion._id,
        answer,
        responseTime
      });

      const { isCorrect, streak } = response.data;

      // Notify socket
      socket?.emit('answerSubmitted', {
        teamCode: state.team?.code,
        isCorrect,
        responseTime
      });

      // Update local state
      dispatch({
        type: 'UPDATE_PLAYER_STATS',
        payload: {
          streak,
          correctAnswers: state.playerStats.correctAnswers + (isCorrect ? 1 : 0),
          totalQuestions: state.playerStats.totalQuestions + 1
        }
      });

      // Hide question panel temporarily
      setShowQuestion(false);

      // Show next question after delay
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
    <div className="min-h-screen bg-dark-100 flex">
      {/* Game Canvas */}
      <div className="flex-1 relative">
        <div 
          ref={gameContainerRef} 
          className="w-full h-full"
        />
        
        {/* Speed Bar Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <SpeedBar 
            speed={state.playerStats.speed} 
            nitro={state.playerStats.nitro}
            shield={state.playerStats.shield}
          />
        </div>
        
        {/* Lap Counter */}
        <div className="absolute top-4 left-4 bg-dark-200/80 rounded-lg px-4 py-2">
          <span className="font-racing text-white">
            Lap {state.playerStats.lap} / {raceData?.settings?.totalLaps || 3}
          </span>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-96 bg-dark-200 border-l border-neon-blue/30 flex flex-col">
        {/* Leaderboard */}
        <div className="p-4 border-b border-neon-blue/20">
          <Leaderboard positions={positions} currentUserId={socket?.id} />
        </div>

        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto">
          {showQuestion && currentQuestion && (
            <QuestionPanel
              question={currentQuestion}
              questionNumber={questionIndex + 1}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts and APIs
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { teamAPI, raceAPI } from '../../services/api';
import { AVATAR_OPTIONS, LEVELS, SOCKET_EVENTS } from '../../utils/constants';


const Lobby = () => {
  const navigate = useNavigate();
  const { teamCode } = useParams(); // 'teamCode' from URL, but actually 'lobbyCode'
  const { state, dispatch } = useGame();
  const { socket, isConnected, emit, on, off } = useSocket();

  // Lobby State
  const [lobbyData, setLobbyData] = useState(null); // Backend 'team' object
  const [playersInLobby, setPlayersInLobby] = useState([]); // Dynamic list of players from socket
  const [countdownPhase, setCountdownPhase] = useState('idle'); // idle -> dim -> red1 -> ... -> go -> transition
  const [lobbyError, setLobbyError] = useState(null);
  const [isStartingRace, setIsStartingRace] = useState(false); // Local flag to prevent double click

  // Audio Refs
  const engineBuildAudioRef = useRef(null); // engine-rev-build.mp3
  const launchAudioRef = useRef(null); // race-launch.mp3
  const lightBeepAudioRef = useRef(null); // light-beep.mp3 (for individual light beeps)


  // --- Derived State & UI Logic ---
  // CALCULATE THESE *BEFORE* YOUR USECALLBACKS THAT DEPEND ON THEM
  const isSolo = playersInLobby.length === 1;
  const allPlayersReady = isSolo || (playersInLobby.length > 0 && playersInLobby.every(p => p.isReady));
  const totalPlayers = playersInLobby.length;
  const maxPlayers = lobbyData?.settings?.maxPlayers || 4; // Default max players to 4
  const lobbyLevelInfo = LEVELS[lobbyData?.settings?.level] || LEVELS[1]; // Get detailed level info

  // --- Helper: Find current user's player data in the lobby ---
  const currentUserPlayer = playersInLobby.find(p => p.userId === state.user?._id);
  const isLeader = currentUserPlayer?.isLeader;

  // --- Socket Event Handlers ---
  const handleRoomUpdate = useCallback((room) => {
    console.log("Socket: roomUpdate received:", room);
    setLobbyData(room);
    setPlayersInLobby(room.players);
  }, []);

  const handleCountdown = useCallback((data) => {
    console.log("Socket: countdown received:", data);
    const { count } = data;
    if (count > 0) {
      // F1 lights sequence
      // 5 -> dim
      // 4 -> red1
      // 3 -> red2
      // 2 -> red3
      // 1 -> yellow
      // 0 -> green (handled by raceStarting)
      let phaseName;
      if (count === 5) phaseName = 'dim'; // Initial dimming before first red
      else if (count === 4) phaseName = 'red1';
      else if (count === 3) phaseName = 'red2';
      else if (count === 2) phaseName = 'red3';
      else if (count === 1) phaseName = 'yellow';
      else phaseName = 'dim'; // Should not happen for count > 0

      setCountdownPhase(phaseName);

      if (lightBeepAudioRef.current) {
        lightBeepAudioRef.current.currentTime = 0;
        lightBeepAudioRef.current.play();
      }
      if (engineBuildAudioRef.current) {
        // Build engine volume as countdown progresses
        if (count > 2) engineBuildAudioRef.current.volume = 0.5;
        else if (count === 2) engineBuildAudioRef.current.volume = 0.7;
        else if (count === 1) engineBuildAudioRef.current.volume = 1.0;
      }
    } else { // Count is 0
        // The 'raceStarting' event handles the final 'GO!' and green light
    }
  }, []);

  const handleRaceStarting = useCallback((data) => {
    console.log("Socket: raceStarting received:", data);
    setCountdownPhase('green'); // Final light
    if (launchAudioRef.current) launchAudioRef.current.play(); // Swoosh/Launch sound

    // After "GO!", initiate transition to race page
    setTimeout(() => {
      setCountdownPhase('go'); // Display "GO!" text
      setTimeout(() => {
        setCountdownPhase('transition'); // Trigger zoom-out
        setTimeout(() => navigate(`/race/${data.raceId}`), 1000); // Redirect to game after transition
      }, 500); // Display "GO!" for 0.5s
    }, 200); // Small delay before GO! text shows
  }, [navigate]);

  const handleError = useCallback((data) => {
    console.error("Socket Error:", data);
    setLobbyError(data.message || "An unknown socket error occurred.");
    setTimeout(() => {
        navigate('/home'); // Send user back to home on critical lobby errors
    }, 3000);
  }, [navigate]);

  // --- Effect: Socket Listeners and Initial Lobby Data Fetch ---
  useEffect(() => {
    if (!socket || !state.user || !teamCode) {
      if (!state.user || !teamCode) navigate('/home');
      return;
    }

    // Set up socket listeners
    on(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
    on(SOCKET_EVENTS.COUNTDOWN, handleCountdown);
    on(SOCKET_EVENTS.RACE_STARTING, handleRaceStarting);
    on(SOCKET_EVENTS.ERROR, handleError);

    const fetchLobbyData = async () => {
      try {
        const response = await teamAPI.get(teamCode); // Using teamAPI to get lobby info
        const fetchedLobby = response.data.team;
        setLobbyData(fetchedLobby);
        
        // Ensure backend's in-memory lobby is aware of this player's socket (for reloads/reconnects)
        // Send player details for re-sync
        emit(SOCKET_EVENTS.PLAYER_CONNECTED, {
            teamCode: teamCode,
            userId: state.user._id,
            username: currentUserPlayer?.username || state.user.username, // Use lobby-specific name if available
            avatar: currentUserPlayer?.avatar || state.user.avatar
        });

      } catch (error) {
        console.error("Failed to fetch lobby data:", error.response?.data || error);
        setLobbyError(error.response?.data?.error || "Failed to load lobby.");
        navigate('/home'); // Redirect home if lobby not found/failed to load
      }
    };

    fetchLobbyData();

    return () => {
      // Clean up listeners on unmount
      off(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
      off(SOCKET_EVENTS.COUNTDOWN, handleCountdown);
      off(SOCKET_EVENTS.RACE_STARTING, handleRaceStarting);
      off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, [socket, state.user, teamCode, navigate, emit, on, off, handleRoomUpdate, handleCountdown, handleRaceStarting, handleError, currentUserPlayer]);


  // --- Handlers for UI Interactions ---
  const handleToggleReady = useCallback(() => {
    // Only current user can toggle their own ready state, and only if countdown isn't active
    if (!state.user?._id || countdownPhase !== 'idle') return; 
    
    // Find current user's state in the local playersInLobby array
    const currentPlayerState = playersInLobby.find(p => p.userId === state.user._id);
    if (!currentPlayerState) return; // User not found in lobby list (shouldn't happen)

    const newReadyState = !currentPlayerState.isReady;
    
    // Optimistic update for immediate feedback
    setPlayersInLobby(prev => prev.map(p =>
        p.userId === state.user._id ? { ...p, isReady: newReadyState } : p
    ));
    // Emit to server
    emit(SOCKET_EVENTS.PLAYER_READY, {
        teamCode: teamCode,
        userId: state.user._id,
        isReady: newReadyState
    });
  }, [state.user, countdownPhase, playersInLobby, teamCode, emit]);

  const handleStartRace = useCallback(async () => {
    // Check conditions using derived states
    if (!isLeader || !allPlayersReady || isStartingRace || totalPlayers === 0) {
        console.log("Cannot start race: Conditions not met", {isLeader, allPlayersReady, isStartingRace, totalPlayers});
        return;
    }

    setIsStartingRace(true);
    setLobbyError(null);

    try {
        const response = await raceAPI.start(teamCode); // Call raceAPI to create a race entry on backend
        const raceId = response.data.race._id;
        
        // Emit to server to initiate the actual race countdown sequence
        // Backend will then emit 'countdown' events
        emit(SOCKET_EVENTS.RACE_START_REQUEST, { 
            teamCode: teamCode,
            raceId: raceId
        });

    } catch (error) {
        console.error("Failed to start race:", error.response?.data || error);
        setLobbyError(error.response?.data?.error || "Failed to start race. Try again.");
    } finally {
        setIsStartingRace(false);
    }
  }, [isLeader, allPlayersReady, isStartingRace, totalPlayers, teamCode, emit, raceAPI]); // Dependencies are crucial!


  const handleLeaveLobby = useCallback(() => {
    emit(SOCKET_EVENTS.LEAVE_ROOM, { teamCode, userId: state.user?._id });
    dispatch({ type: 'CLEAR_TEAM' }); // Clear lobby data from global state
    navigate('/home');
  }, [teamCode, state.user, emit, dispatch, navigate]);


  // --- Loading / Error States ---
  if (!lobbyData && !lobbyError) {
    return (
      <div className="lobby-container">
        <p className="loading-text">LOADING LOBBY DATA...</p>
      </div>
    );
  }

  if (lobbyError) {
    return (
      <div className="lobby-container error-state">
        <p className="error-text">{lobbyError}</p>
        <button onClick={() => navigate('/home')}>RETURN HOME</button>
      </div>
    );
  }

  return (
    <div className={`lobby-container ${countdownPhase === 'transition' ? 'zoom-out' : ''}`}>
      
      {/* Audio Files */}
      <audio ref={engineBuildAudioRef} src="/audio/engine-rev-build.mp3" preload="auto" />
      <audio ref={launchAudioRef} src="/audio/race-launch.mp3" preload="auto" />
      <audio ref={lightBeepAudioRef} src="/audio/light-beep.mp3" preload="auto" /> {/* For F1 lights beep */}


      {/* Subtle Background Grid */}
      <div className="bg-grid"></div>

      {/* Main Three-Column Layout */}
      <div className="layout-grid">
        
        {/* ================= LEFT COLUMN: LOBBY INFO ================= */}
        <div className="column left-col">
          <div className="panel info-panel slant-tr">
            <h2 className="panel-title">LOBBY INTEL</h2>
            
            <div className="info-block">
              <span className="info-label">LOBBY ALIAS</span>
              <span className="info-value highlight-orange">{lobbyData?.name || "N/A"}</span>
            </div>
            
            <div className="info-row">
              <div className="info-block">
                <span className="info-label">ENGINE</span>
                <span className="info-value">{lobbyData?.settings?.language || "N/A"}</span>
              </div>
              <div className="info-block">
                <span className="info-label">LAPS</span>
                <span className="info-value">{lobbyLevelInfo.laps}</span> {/* Use laps from LEVELS constant */}
              </div>
            </div>

            <div className="info-block">
              <span className="info-label">DIFFICULTY</span>
              <span className="info-value text-muted">{lobbyLevelInfo.name}</span>
              <div className="stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`star ${i < lobbyLevelInfo.difficulty ? 'star-active' : 'star-dim'}`}>★</span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel map-panel slant-bl mt-4">
            <h3 className="panel-subtitle">CIRCUIT PREVIEW</h3>
            <div className="map-window">
              <svg viewBox="0 0 200 120" className="preview-svg">
                <defs>
                  <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FEEA00" />
                    <stop offset="100%" stopColor="#FF6E00" />
                  </linearGradient>
                  <filter id="glow-filter">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Circuit Path Base (example, replace with actual track designs) */}
                <path d="M 20 60 C 20 20, 60 20, 100 20 C 140 20, 180 40, 180 60 C 180 100, 140 100, 100 100 C 50 100, 20 80, 20 60 Z" fill="none" stroke="#222" strokeWidth="6" />
                {/* Glowing Animated Path */}
                <path className="animated-circuit" d="M 20 60 C 20 20, 60 20, 100 20 C 140 20, 180 40, 180 60 C 180 100, 140 100, 100 100 C 50 100, 20 80, 20 60 Z" fill="none" stroke="url(#neonGlow)" strokeWidth="2" filter="url(#glow-filter)" strokeDasharray="300" strokeDashoffset="300" />
              </svg>
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: PLAYERS ================= */}
        <div className="column center-col">
          <div className="center-header">
            <h1 className="lobby-title">GRID ALIGNMENT</h1>
            <p className="ready-status">
              {playersInLobby.filter(p => p.isReady).length} / {totalPlayers} DRIVERS READY ({maxPlayers} Max)
            </p>
          </div>

          <div className="players-grid">
            {Array.from({ length: maxPlayers }).map((_, index) => {
              const player = playersInLobby[index];
              const isCurrentUser = player?.userId === state.user?._id;
              
              const avatarObj = AVATAR_OPTIONS.find(a => a.id === player?.avatar) || AVATAR_OPTIONS[0]; // Get avatar icon
              const avatarEmoji = avatarObj.icon;

              return (
                <div 
                  key={player?.userId || `empty-${index}`} // Use unique ID or empty key
                  className={`player-card ${player ? (player.isReady ? 'is-ready' : 'not-ready') : 'empty-slot'}`}
                  // Only current user can toggle their own ready state, not others'
                  onClick={() => isCurrentUser && handleToggleReady()} 
                  style={{cursor: isCurrentUser ? 'pointer' : 'default'}}
                >
                  <div className="card-bg"></div>
                  {player?.isLeader && <div className="leader-badge">LEADER</div>}
                  
                  <div className="avatar-wrapper">
                    <span className="avatar-emoji">{avatarEmoji}</span> 
                    <div className="streak-badge">
                      ⚡{player?.streak || 0}
                    </div>
                  </div>

                  <h3 className="player-name">{player?.username || "EMPTY SLOT"}</h3>

                  {player ? (
                    <div className="ready-indicator">
                      <div className={`status-dot ${player.isReady ? 'dot-green' : 'dot-red'}`}></div>
                      <span className="status-text">{player.isReady ? "READY" : "STANDBY"}</span>
                    </div>
                  ) : (
                    <div className="ready-indicator empty">
                        <span className="status-text">AWAITING DRIVER</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: SETTINGS ================= */}
        <div className="column right-col">
          <div className="panel settings-panel slant-tl">
            <h2 className="panel-title">RACE PARAMETERS</h2>
            
            <div className="settings-form">
              <div className="input-group">
                <label>LANGUAGE ENGINE</label>
                <select disabled={!isLeader || isStartingRace} value={lobbyData?.settings?.language}>
                  {/* Options will be dynamic if leader can change, for now display current */}
                  <option>{lobbyData?.settings?.language || "N/A"}</option>
                  {/* Leader could have options to change: */}
                  {/* <option value="JavaScript">JavaScript</option> */}
                </select>
              </div>

              <div className="input-group">
                <label>DIFFICULTY LEVEL</label>
                <select disabled={!isLeader || isStartingRace} value={lobbyLevelInfo.difficulty}>
                   {/* Options will be dynamic if leader can change, for now display current */}
                   <option value={lobbyLevelInfo.difficulty}>{lobbyLevelInfo.name}</option>
                </select>
              </div>
              
              {!isLeader && (
                <div className="warning-text">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  ONLY LEADER CAN MODIFY LOBBY RULES
                </div>
              )}
            </div>
          </div>

          <div className="launch-container mt-4">
            <button 
              className={`start-btn ${allPlayersReady && isLeader && totalPlayers > 0 ? 'btn-ready' : 'btn-locked'}`} 
              disabled={!isLeader || isStartingRace || totalPlayers === 0 || (!isSolo && !allPlayersReady)} 
              onClick={handleStartRace}
            >
              <div className="btn-content">
                <span className="btn-icon">{allPlayersReady && isLeader && totalPlayers > 0 ? '🏁' : '🔒'}</span>
                <span className="btn-text">
                    {isLeader ? (
                        isSolo ? 'START SOLO RACE 🏎️' : (allPlayersReady && totalPlayers > 0 ? 'START RACE' : `WAITING... (${playersInLobby.filter(p => p.isReady).length}/${totalPlayers})`)
                    ) : 'WAITING FOR LEADER...'}
                </span>
              </div>
              {allPlayersReady && isLeader && totalPlayers > 0 && <div className="btn-glow"></div>}
            </button>
            <p className="waiting-text">LOBBY CODE: <span className="highlight-orange">{teamCode}</span></p> {/* Show lobby code */}
            <button className="leave-btn" onClick={handleLeaveLobby}>LEAVE LOBBY</button> {/* New: Leave Lobby Button */}
          </div>
        </div>
      </div>

      {/* ================= FULL SCREEN COUNTDOWN OVERLAY ================= */}
      {countdownPhase !== 'idle' && (
        <div className={`countdown-overlay ${countdownPhase === 'transition' ? 'fade-out' : ''}`}>
          
          <div className="lights-rig">
            {/* These light classes are mapped to countdownPhase state */}
            <div className="light-housing"><div className={`light bulb-1 ${countdownPhase === 'dim' || countdownPhase === 'red1' || countdownPhase === 'red2' || countdownPhase === 'red3' || countdownPhase === 'yellow' || countdownPhase === 'green' || countdownPhase === 'go' ? 'on-red' : ''}`}></div></div>
            <div className="light-housing"><div className={`light bulb-2 ${countdownPhase === 'red1' || countdownPhase === 'red2' || countdownPhase === 'red3' || countdownPhase === 'yellow' || countdownPhase === 'green' || countdownPhase === 'go' ? 'on-red' : ''}`}></div></div>
            <div className="light-housing"><div className={`light bulb-3 ${countdownPhase === 'red2' || countdownPhase === 'red3' || countdownPhase === 'yellow' || countdownPhase === 'green' || countdownPhase === 'go' ? 'on-red' : ''}`}></div></div>
            <div className="light-housing"><div className={`light bulb-4 ${countdownPhase === 'red3' || countdownPhase === 'yellow' || countdownPhase === 'green' || countdownPhase === 'go' ? 'on-red' : ''}`}></div></div>
            <div className="light-housing"><div className={`light bulb-5 ${countdownPhase === 'yellow' || countdownPhase === 'green' || countdownPhase === 'go' ? 'on-yellow' : ''}`}></div></div>
            <div className="light-housing"><div className={`light bulb-6 ${countdownPhase === 'green' || countdownPhase === 'go' ? 'on-green' : ''}`}></div></div>
          </div>

          {countdownPhase === 'go' && (
            <h1 className="go-text scale-in">GOOOO 🚀</h1>
          )}
        </div>
      )}

      {/* ================= STYLES ================= */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Orbitron:wght@500;700;900&display=swap');

        :root {
          --bg-dark: #070707;
          --panel-bg: rgba(15, 15, 15, 0.8);
          --neon-orange: #FF6E00;
          --neon-yellow: #FEEA00;
          --cyber-green: #00FF2A;
          --cyber-red: #FF003C;
          --text-main: #FFFFFF;
          --text-muted: #888888;
        }

        * { box-sizing: border-box; }

        .lobby-container {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          background-color: var(--bg-dark);
          color: var(--text-main);
          font-family: 'Montserrat', sans-serif;
          overflow: hidden;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 1s cubic-bezier(0.8, 0, 0.2, 1), opacity 0.5s ease-in;
        }

        .zoom-out {
          transform: scale(4);
          opacity: 0;
          pointer-events: none;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 30px 30px;
          z-index: 0;
        }

        .layout-grid {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 320px 1fr 320px;
          gap: 2.5rem;
          width: 100%;
          max-width: 1400px;
          height: 85vh;
        }

        .column { display: flex; flex-direction: column; }
        .mt-4 { margin-top: 1.5rem; }

        /* Panels Shared */
        .panel {
          background: var(--panel-bg);
          border: 1px solid #222;
          padding: 2rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 1.5rem 0;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          letter-spacing: 2px;
        }

        /* Clip Path Slants */
        .slant-tr { clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%); }
        .slant-tl { clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px); }
        .slant-bl { clip-path: polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }

        /* Left Column Specifics */
        .info-block { margin-bottom: 1.2rem; display: flex; flex-direction: column; }
        .info-row { display: flex; gap: 2rem; }
        .info-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 4px; }
        .info-value { font-family: 'Orbitron', sans-serif; font-size: 1.1rem; font-weight: 700; color: #ddd; }
        .highlight-orange { color: var(--neon-orange); text-shadow: 0 0 10px rgba(255, 110, 0, 0.3); }
        
        .stars { display: flex; gap: 4px; margin-top: 5px; }
        .star { font-size: 1.2rem; }
        .star-active { color: var(--neon-yellow); text-shadow: 0 0 8px rgba(254, 234, 0, 0.5); }
        .star-dim { color: #333; }

        .map-panel { flex-grow: 1; display: flex; flex-direction: column; }
        .panel-subtitle { font-family: 'Orbitron', sans-serif; font-size: 0.9rem; color: var(--text-muted); margin: 0 0 1rem 0; }
        .map-window { flex-grow: 1; background: #050505; border: 1px solid #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .preview-svg { width: 90%; height: 90%; }
        
        .animated-circuit {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: draw-circuit 3s linear forwards; /* Use 'forwards' to keep the final state */
        }
        @keyframes draw-circuit {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }

        /* Center Column Specifics */
        .center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .center-header { text-align: center; margin-bottom: 2rem; }
        .lobby-title { font-family: 'Orbitron', sans-serif; font-size: 3rem; font-weight: 900; margin: 0; letter-spacing: 4px; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2)); }
        .ready-status { font-family: 'Orbitron', sans-serif; font-size: 1rem; color: var(--neon-orange); letter-spacing: 3px; margin-top: 5px; }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          flex-grow: 1;
          width: 100%;
          max-width: 600px;
        }

        .player-card {
          position: relative;
          background: rgba(20, 20, 20, 0.8);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          min-height: 200px;
        }

        .player-card:hover { transform: translateY(-3px); }

        .card-bg { position: absolute; inset: 0; opacity: 0.1; background: radial-gradient(circle at top, transparent 20%, #000 80%); z-index: 0; }
        
        .is-ready {
          border-color: var(--cyber-green);
          box-shadow: 0 0 20px rgba(0, 255, 42, 0.15), inset 0 0 20px rgba(0, 255, 42, 0.05);
        }
        
        .not-ready {
          border-color: #333;
          opacity: 0.8;
        }

        .empty-slot {
          background: rgba(10, 10, 10, 0.5);
          border-color: #1a1a1a;
          color: var(--text-muted);
          cursor: default;
        }
        .empty-slot:hover { transform: none; }

        .leader-badge {
          position: absolute; top: 10px; left: 10px;
          background: var(--neon-orange); color: #000;
          font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px;
        }

        .avatar-wrapper { position: relative; margin-bottom: 1rem; z-index: 2; }
        .avatar-img { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #444; background: #111; display: none; } /* Hide dicebear img */
        .avatar-emoji { font-size: 3rem; line-height: 1; } /* Style for emoji avatar */
        .is-ready .avatar-emoji { filter: drop-shadow(0 0 8px var(--cyber-green)); } /* Glow for ready emoji */
        .empty-slot .avatar-emoji { filter: grayscale(1); opacity: 0.5; } /* Dim empty emoji */

        .streak-badge {
          position: absolute; bottom: -5px; right: -10px;
          background: #111; border: 1px solid var(--neon-yellow); color: var(--neon-yellow);
          font-size: 0.8rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; box-shadow: 0 0 10px rgba(254,234,0,0.3);
        }

        .player-name { font-size: 1.1rem; font-weight: 700; margin: 0 0 10px 0; z-index: 2; letter-spacing: 1px; }

        .ready-indicator { display: flex; align-items: center; gap: 8px; z-index: 2; background: rgba(0,0,0,0.5); padding: 5px 12px; border-radius: 15px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-green { background: var(--cyber-green); box-shadow: 0 0 10px var(--cyber-green); }
        .dot-red { background: var(--cyber-red); box-shadow: 0 0 10px var(--cyber-red); }
        .status-text { font-family: 'Orbitron', sans-serif; font-size: 0.8rem; font-weight: 700; }
        .is-ready .status-text { color: var(--cyber-green); }
        .not-ready .status-text { color: var(--cyber-red); }

        /* Right Column Specifics */
        .settings-form { display: flex; flex-direction: column; gap: 1.2rem; }
        .input-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 5px; display: block; }
        .input-group select {
          width: 100%; background: #0A0A0A; border: 1px solid #333; color: #888;
          padding: 12px; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; cursor: not-allowed;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
        }

        .warning-text { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--neon-orange); font-weight: 600; margin-top: 10px; }

        .launch-container { flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-end; }
        
        .start-btn {
          width: 100%; padding: 1.5rem; border: none; font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 900; letter-spacing: 3px;
          cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s;
          clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
        }

        .btn-content { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; gap: 15px; }
        
        .btn-locked { background: #1a1a1a; color: #555; border: 1px solid #333; cursor: not-allowed; }
        .waiting-text { text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 10px; font-weight: 600; letter-spacing: 1px; }

        .btn-ready {
          background: var(--neon-orange); color: #000; text-shadow: none;
          box-shadow: 0 0 20px rgba(255, 110, 0, 0.4);
          animation: pulse-ready 2s infinite alternate;
        }

        .btn-ready:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(255, 110, 0, 0.6); background: #ff8522; }

        .btn-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); z-index: 1; transform: skewX(-20deg) translateX(-150%); animation: sweep 3s infinite; }

        @keyframes pulse-ready { from { box-shadow: 0 0 15px rgba(255, 110, 0, 0.3); } to { box-shadow: 0 0 35px rgba(255, 110, 0, 0.7); } }
        @keyframes sweep { 0%, 50% { transform: skewX(-20deg) translateX(-150%); } 100% { transform: skewX(-20deg) translateX(150%); } }

        /* Leave Lobby Button */
        .leave-btn {
          background: #222;
          color: var(--text-main);
          padding: 0.8rem 1.5rem;
          margin-top: 1rem;
          border: 1px solid #444;
          border-radius: 4px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .leave-btn:hover {
          background: var(--cyber-red);
          border-color: var(--cyber-red);
          box-shadow: 0 0 15px rgba(255, 0, 60, 0.4);
        }

        /* ================= COUNTDOWN OVERLAY ================= */
        .countdown-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: dim-in 0.5s forwards;
        }

        @keyframes dim-in { from { opacity: 0; } to { opacity: 1; } }
        .fade-out { opacity: 0; transition: opacity 0.5s ease-out; }

        .lights-rig { display: flex; gap: 30px; margin-bottom: 40px; }
        
                .light-housing {
          width: 100px; height: 100px; background: #111; border-radius: 50%; border: 4px solid #333;
          display: flex; align-items: center; justify-content: center; box-shadow: inset 0 10px 20px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.8);
        }

        .light { width: 70px; height: 70px; border-radius: 50%; background: #222; transition: all 0.1s; }

        /* F1 Lights Sequence CSS (matched to countdownPhase) */
        /* These classes map to the countdownPhase state: dim, red1, red2, red3, yellow, green, go */
        
        /* Individual Red Lights */
        .lights-rig .light-housing:nth-child(1) .light.on-red,
        .lights-rig .light-housing:nth-child(2) .light.on-red,
        .lights-rig .light-housing:nth-child(3) .light.on-red,
        .lights-rig .light-housing:nth-child(4) .light.on-red {
            background: #ff1100;
            box-shadow: 0 0 60px #ff1100, inset 0 0 20px #fff;
        }
        /* Yellow Light */
        .lights-rig .light-housing:nth-child(5) .light.on-yellow {
            background: #FEEA00; /* Neon Yellow */
            box-shadow: 0 0 60px #FEEA00, inset 0 0 20px #fff;
        }
        /* Green Light (GO!) */
        .lights-rig .light-housing:nth-child(6) .light.on-green { /* This is the 'GO!' green light */
            background: #00FF2A; /* Cyber Green */
            box-shadow: 0 0 80px #00FF2A, inset 0 0 30px #fff;
        }
        
        .go-text {
          position: absolute; font-family: 'Orbitron', sans-serif; font-size: 8rem; font-weight: 900;
          color: #fff; text-shadow: 0 0 30px #00FF2A, 0 0 60px #00FF2A; letter-spacing: 5px;
        }

        .scale-in { animation: scale-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes scale-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Responsive */
        @media (max-width: 1200px) {
          .layout-grid { grid-template-columns: 1fr 2fr 1fr; gap: 1.5rem; }
          .lobby-title { font-size: 2.5rem; }
          .panel { padding: 1.5rem; }
          .panel-title { font-size: 1rem; }
          .info-value { font-size: 0.9rem; }
          .player-card { padding: 1rem; min-height: 180px; }
          .avatar-emoji { font-size: 2.5rem; }
          .player-name { font-size: 1rem; }
          .streak-badge { font-size: 0.7rem; padding: 1px 6px; }
          .ready-indicator { padding: 3px 8px; gap: 5px; }
          .status-dot { width: 8px; height: 8px; }
          .status-text { font-size: 0.7rem; }
          .start-btn { font-size: 1.2rem; }
        }

        @media (max-width: 900px) {
          .layout-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; height: auto; gap: 1.5rem; }
          .left-col { order: 2; }
          .center-col { order: 1; }
          .right-col { order: 3; }
          .center-header { margin-bottom: 1rem; }
          .players-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); max-width: none; }
          .lobby-container { padding: 1rem; }
          .lobby-title { font-size: 2rem; }
          .ready-status { font-size: 0.8rem; }
          .f1-lights-rig { gap: 10px; padding: 10px 15px; }
          .light-housing { width: 60px; height: 60px; }
          .light { width: 40px; height: 40px; }
          .go-text { font-size: 6rem; }
        }

        @media (max-width: 600px) {
          .lobby-container { padding: 0.5rem; }
          .panel { padding: 1rem; }
          .panel-title { font-size: 1rem; margin-bottom: 0.8rem; padding-bottom: 8px; }
          .info-value { font-size: 0.9rem; }
          .info-label { font-size: 0.6rem; }
          .players-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; }
          .player-card { padding: 0.8rem; min-height: 150px; }
          .avatar-emoji { font-size: 2rem; }
          .player-name { font-size: 0.9rem; }
          .streak-badge { font-size: 0.7rem; padding: 1px 6px; }
          .ready-indicator { padding: 3px 8px; gap: 5px; }
          .status-dot { width: 8px; height: 8px; }
          .status-text { font-size: 0.7rem; }
          .start-btn { font-size: 1rem; padding: 1rem; }
          .btn-content { gap: 10px; }
          .waiting-text { font-size: 0.7rem; }
          .launch-container { margin-top: 1rem; }
        }
      `}} />
    </div>
  );
};

export default Lobby;

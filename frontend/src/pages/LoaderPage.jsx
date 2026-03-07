import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- F1 Car SVG Component for the track (Scaled for the path) ---
const F1CarOnTrack = ({ className = '', color1 = '#FEEA00', color2 = '#FF6E00' }) => (
  <svg viewBox="0 0 60 30" className={className}>
    <defs>
      <linearGradient id="f1CarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color1} />
        <stop offset="100%" stopColor={color2} />
      </linearGradient>
      <filter id="f1CarGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#f1CarGlow)">
      {/* Main body */}
      <path d="M5 15 L10 10 L45 10 L55 15 L55 20 L5 20 Z" fill="url(#f1CarGradient)" stroke={color1} strokeWidth="0.5"/>
      {/* Front wing */}
      <rect x="50" y="12" width="8" height="2" fill={color2} />
      {/* Rear wing */}
      <rect x="2" y="12" width="5" height="2" fill={color2} />
      {/* Cockpit */}
      <path d="M30 11 L35 14 L40 14 L45 11 Z" fill="#0B0B0B" opacity="0.8"/>
      {/* Wheels */}
      <circle cx="15" cy="20" r="4" fill="#1a1a1a" />
      <circle cx="45" cy="20" r="4" fill="#1a1a1a" />
      {/* Small exhaust flame */}
      <motion.ellipse
        cx="4" cy="17" rx="2" ry="1.5"
        fill="#FF6E00"
        opacity="0.8"
        animate={{ 
          rx: [2, 3, 2],
          opacity: [0.6, 0.9, 0.6]
        }}
        transition={{ duration: 0.2, repeat: Infinity }}
      />
    </g>
  </svg>
);


const Loader = ({ /* onLoadingComplete */ }) => { // Removed onLoadingComplete as it's not being passed
  const navigate = useNavigate(); // Use useNavigate from react-router-dom
  
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading -> ready -> countdown -> transition
  const [lights, setLights] = useState(0); // 0-5 red, 6 green
  const [carPos, setCarPos] = useState({ x: 0, y: 0, angle: 0 }); // Car position on SVG path
  const [pathLength, setPathLength] = useState(0); // To store total path length

  const pathRef = useRef(null);
  const engineAudioRef = useRef(null);
  const swooshAudioRef = useRef(null);
  const beepAudioRef = useRef(null); // For F1 lights beep

  const tagline = "WHERE CODING MEETS SPEED";

  // --- Audio Handlers ---
  const playEngineRev = useCallback(() => {
    if (engineAudioRef.current) {
      engineAudioRef.current.currentTime = 0;
      engineAudioRef.current.play().catch(e => console.error("Engine audio playback failed:", e));
    }
  }, []);

  const playSwoosh = useCallback(() => {
    if (swooshAudioRef.current) {
      swooshAudioRef.current.currentTime = 0;
      swooshAudioRef.current.volume = 0.8; // Adjust volume as needed
      swooshAudioRef.current.play().catch(e => console.error("Swoosh audio playback failed:", e));
    }
  }, []);
  
  const playLightBeep = useCallback(() => {
    if (beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.volume = 0.4; // Adjust volume as needed
      beepAudioRef.current.play().catch(e => console.error("Beep audio playback failed:", e));
    }
  }, []);

  // --- Track Path Data ---
  // A completely custom path designed to look like a realistic technical Grand Prix circuit
  const trackPathData = 
    "M 150 320 " +
    "L 750 320 " + // Main straight
    "C 820 320, 820 220, 750 220 " + // Tight right hairpin
    "L 600 220 " + // Short straight
    "C 550 220, 550 120, 500 120 " + // Left-right chicane
    "L 300 120 " + // Back straight
    "C 230 120, 230 220, 300 220 " + // Inner hairpin
    "L 400 220 " + // Mini straight
    "C 460 220, 460 280, 400 280 " + // Technical kink
    "L 150 280 " + // Final straight
    "C 80 280, 80 320, 150 320 Z"; // Final hairpin back to start

  // 1. Initialize Track Length
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // 2. Simulate Loading Progression
  useEffect(() => {
    if (phase !== 'loading') return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 2) + 1; // Smooth, realistic loading speed
        if (next >= 100) {
          clearInterval(interval);
          setPhase('ready');
          return 100;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [phase]);

  // 3. Telemetry Car Movement Calculation
  useEffect(() => {
    if (pathRef.current && pathLength > 0) {
      const distance = (progress / 100) * pathLength;
      const point = pathRef.current.getPointAtLength(distance);
      
      // Calculate angle by looking 3 pixels ahead on the curve
      const nextDistance = Math.min(distance + 3, pathLength);
      const nextPoint = pathRef.current.getPointAtLength(nextDistance);
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      
      // Offset car position to visually center F1CarOnTrack icon (approx half its viewBox)
      setCarPos({ 
  x: point.x, 
  y: point.y, 
  angle 
});
    }
  }, [progress, pathLength]);

  // 4. Handle Ignition (for both Enter key and button click)
  const handleIgnite = useCallback(() => {
    if (phase === 'ready') {
      setPhase('countdown');
      playEngineRev();
    }
  }, [phase, playEngineRev]);

  // 5. Keyboard Ignition (ENTER) Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && phase === 'ready') {
        handleIgnite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleIgnite]);

    // 6. F1 Lights Sequence -> Redirect
  useEffect(() => {
    if (phase === 'countdown') {
      let currentLight = 0;
      const lightInterval = setInterval(() => {
        currentLight++;
        setLights(currentLight);
        playLightBeep(); // Play beep for each light
        
        if (currentLight === 6) { // GREEN LIGHT!
          clearInterval(lightInterval);
          playSwoosh(); // Play swoosh sound
          
          // Small delay before transition starts
          setTimeout(() => {
            setPhase('transition'); // Trigger the CSS zoom-out animation

            // After zoom-out animation finishes (1500ms total transition from initial setPhase('transition'))
            setTimeout(() => {
              navigate('/lobby'); // Navigate to Home Page
            }, 1000); // This matches the `transition` class's CSS duration (1s) plus some buffer.
                      // Adjust as needed, but 1s for scale + opacity should be enough.

          }, 200); // Delay after last light before transition
        }
      }, 700); // F1 lights change every 0.7 seconds
      return () => clearInterval(lightInterval);
    }
  }, [phase, navigate, playLightBeep, playSwoosh]);


  return (
    <div className={`loader-container ${phase === 'transition' ? 'zoom-out' : ''}`}>
      {/* Hidden Audio Elements */}
      <audio ref={engineAudioRef} src="/audio/engine-sound.mp3" preload="auto" />
      <audio ref={swooshAudioRef} src="/audio/wind-swoosh.mp3" preload="auto" />
      <audio ref={beepAudioRef} src="/audio/light-beep.mp3" preload="auto" /> {/* Add a light beep sound */}

      {/* Background Video with blur and opacity */}
      <video 
        className="bg-video" 
        src="/assets/video/race-track.mp4"
        autoPlay 
        loop 
        muted 
        playsInline
      />

      {/* Vignette Overlay (over video, under UI) */}
      <div className="vignette-overlay"></div>

      {/* Engineering Blueprint Background Overlay (over video, under UI) */}
      <div className="telemetry-grid"></div>

      {/* UI Top Bar */}
      <div className="ui-header">
        <div className="brand-section">
          <div className="logo-box">
            <h1 className="logo">DEBUG RACE</h1>
            <p className="tagline">Decode-Optimize-Accelerate</p>
          </div>
        </div>

        <div className="status-section">
          <div className="loading-data">
            <span className="data-label">TELEMETRY SYNC</span>
            <span className="data-value">{progress.toString().padStart(3, '0')}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* The Central Track Dashboard */}
      <div className="dashboard-center">
        <svg viewBox="0 0 900 450" className="track-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="neonTrail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEEA00" />
              <stop offset="100%" stopColor="#FF6E00" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Start/Finish Checker Pattern */}
            <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#fff" />
              <rect x="5" width="5" height="5" fill="#333" />
              <rect y="5" width="5" height="5" fill="#333" />
              <rect x="5" y="5" width="5" height="5" fill="#fff" />
            </pattern>
          </defs>

          {/* 1. Base Dark Track */}
          <path 
            d={trackPathData}
            fill="none" stroke="#1A1A1A" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round"
          />

          {/* 2. Track Borders / Curbs (Subtle) */}
          <path 
            d={trackPathData}
            fill="none" stroke="#333" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0.5 }}
          />

          {/* 3. Start/Finish Line */}
          <rect x="145" y="307" width="10" height="26" fill="url(#checker)" transform="rotate(0, 150, 320)" />

          {/* 4. Invisible Path for exact Math tracking */}
          <path 
            ref={pathRef}
            d={trackPathData}
            fill="none" stroke="transparent"
          />

          {/* 5. Telemetry Glowing Racing Line (Fills up as loading) */}
          <motion.path 
            d={trackPathData}
            fill="none" 
            stroke="url(#neonTrail)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            filter="url(#glow)"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength - (pathLength * (progress / 100))}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />

          {/* 6. The Tiny High-Detail F1 Car */}
          <g transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle}) scale(1.0)`}>
            {/* Engine Exhaust Flame (Only shows while loading/moving) */}
            {progress > 0 && progress < 100 && (
              <polygon points="-16,-2 -24,0 -16,2" fill="#FF6E00" filter="url(#glow)" className="exhaust-flame" />
            )}

            {/* Rear Tires */}
            <rect x="-12" y="-12" width="7" height="6" rx="1" fill="#0B0B0B" stroke="#333" strokeWidth="0.5" />
            <rect x="-12" y="6" width="7" height="6" rx="1" fill="#0B0B0B" stroke="#333" strokeWidth="0.5" />
            
            {/* Front Tires */}
            <rect x="9" y="-11" width="6" height="5" rx="1" fill="#0B0B0B" stroke="#333" strokeWidth="0.5" />
            <rect x="9" y="6" width="6" height="5" rx="1" fill="#0B0B0B" stroke="#333" strokeWidth="0.5" />

            {/* Rear Wing & Mounts */}
            <rect x="-15" y="-8" width="4" height="16" fill="#FF6E00" />
            <path d="M -13 -4 L -7 0 L -13 4 Z" fill="#222" />

            {/* Main Chassis & Sidepods */}
            <path d="M -8 -6 L 4 -7 L 8 -4 L 8 4 L 4 7 L -8 6 Z" fill="#FEEA00" />
            
            {/* Carbon Underbody Floor */}
            <path d="M -6 -9 L 6 -9 L 6 9 L -6 9 Z" fill="#111" style={{mixBlendMode: 'overlay'}} />

            {/* Nose Cone */}
            <path d="M 4 -3 L 14 -1 L 14 1 L 4 3 Z" fill="#1A1A1A" stroke="#444" strokeWidth="0.5" />
            
            {/* Front Wing */}
            <rect x="12" y="-9" width="3" height="18" fill="#FF6E00" />
            
            {/* Cockpit / Driver Helmet */}
            <circle cx="0" cy="0" r="2.5" fill="#fff" />
            <path d="M -1 -3 L 3 0 L -1 3 Z" fill="none" stroke="#000" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* UI Bottom Bar - Action Center */}
      <div className="ui-footer">
        
        {/* State 1: Loading Details */}
        {phase === 'loading' && (
          <div className="system-status">
            <div className="status-dot blink"></div>
            <span>ESTABLISHING CONNECTION TO SERVER...</span>
          </div>
        )}

        {/* State 2: Ready Prompt */}
        {phase === 'ready' && (
          <button className="ignite-btn" onClick={handleIgnite}> {/* Direct call to handleIgnite */}
            <span className="btn-text">PRESS [ENTER] TO IGNITE</span>
          </button>
        )}

        {/* State 3: F1 Lights Countdown */}
        {(phase === 'countdown' || phase === 'transition') && (
          <div className="f1-lights-rig">
            {[1, 2, 3, 4, 5].map((light) => (
              <div key={light} className="f1-light-housing">
                <div className={`light-bulb ${lights >= light && lights < 6 ? 'red-on' : lights === 6 ? 'green-on' : ''}`}></div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* SCOPED CSS STYLES FOR UI/UX */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Orbitron:wght@500;700;900&display=swap');

        :root {
          --dark: #0B0B0B;
          --yellow: #FEEA00;
          --orange: #FF6E00;
        }

        .loader-container {
          position: fixed;
          inset: 0;
          background-color: var(--dark);
          font-family: 'Montserrat', sans-serif;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem 4rem;
          overflow: hidden;
          transition: transform 0.8s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.6s ease-in;
          /* Add this to smoothly handle the initial load fade-in */
          opacity: 1; 
        }

        .bg-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0; /* Behind everything else */
          filter: brightness(0.4) contrast(1.2); /* Optional: darken video */
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0) 80%, rgba(0,0,0,0.6) 100%);
  z-index: 1; /* On top of video, behind car/track */
  pointer-events: none;
}

        /* The Final Zoom Transition */
        .zoom-out {
          transform: scale(3.5); /* Scale factor from 4 to 3.5 for smoother look */
          opacity: 0;
          pointer-events: none;
        }

        /* Engineering Grid Background */
        .telemetry-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0; /* Behind the track and UI layers */
          opacity: 0.1; /* Make it subtle */
          /* Add a subtle animation to the grid for more motion */
          animation: grid-move 20s infinite linear;
        }

        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        /* Ambient Center Glow (over grid) */
        .telemetry-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 110, 0, 0.08) 0%, var(--dark) 60%);
          z-index: 1;
        }

        /* ---------------- HEADER UI ---------------- */
        .ui-header {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .brand-section {
          display: flex;
          align-items: center;
        }

        .logo-box {
          border-left: 3px solid var(--accent-orange);
          padding-left: 1rem;
          /* Add a subtle animation for the border glow */
          animation: border-glow 3s infinite alternate;
        }

        @keyframes border-glow {
          0% { border-color: rgba(255, 110, 0, 0.5); }
          100% { border-color: rgba(254, 234, 0, 0.8); }
        }
        @font-face {
        font-family: 'Rush Driver';
        src: local('Rush Driver'),
             url('/assets/fonts/RushDriver-Italic.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
        }

        .logo {
          font-family: 'Rush Driver', 'Orbitron', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: 3px;
          color: #d7d1d1;
          text-shadow: 0 0 10px rgba(255, 110, 0, 0.5);
        }

        .tagline {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 4px;
          color: var(--accent-yellow);
          margin: 4px 0 0 0;
          display: flex; /* For letter-by-letter */
          justify-content: flex-start; /* Align left with logo */
        }

        .flicker-char {
          opacity: 0; /* Hidden initially */
          animation: neon-flicker 2s infinite forwards;
          animation-fill-mode: both; /* Keep last state */
          text-shadow: 0 0 10px var(--yellow), 0 0 20px var(--orange); /* Default shadow */
        }

        @keyframes neon-flicker {
          0%, 10%, 12%, 18%, 20%, 100% { opacity: 1; text-shadow: 0 0 10px var(--yellow), 0 0 20px var(--orange); }
          11%, 19% { opacity: 0.3; text-shadow: none; }
        }

        .status-section {
          text-align: right;
          background: var(--panel-bg);
          border: 1px solid var(--glass-border);
          padding: 1rem 1.5rem;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 10px rgba(255, 110, 0, 0.1);
        }

        .loading-data {
          display: flex;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 8px;
        }

        .data-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          font-weight: 600;
          padding-bottom: 4px;
        }

        .data-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-yellow);
          line-height: 1;
          text-shadow: 0 0 15px rgba(254, 234, 0, 0.3);
        }

        .progress-bar-container {
          width: 100%;
          height: 3px;
          background: #222;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-yellow), var(--accent-orange));
          box-shadow: 0 0 10px var(--accent-orange);
          transition: width 0.1s linear;
        }

        /* ---------------- CENTER TRACK ---------------- */
        .dashboard-center {
          position: relative;
          z-index: 5;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .track-svg {
          width: 100%;
          max-width: 1000px; /* Constrain width to avoid stretching */
          height: auto;
          filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8));
          overflow: visible; /* Ensure car and sparks are not clipped */
        }

        .exhaust-flame {
          animation: flicker 0.1s infinite alternate;
        }

        @keyframes flicker {
          0% { transform: scaleX(1); opacity: 0.8; }
          100% { transform: scaleX(1.3); opacity: 1; }
        }

        /* Sparks */
        .sparks {
          transform-origin: center;
        }
        .spark {
          animation: fly-spark linear infinite;
          transform-origin: center;
          position: absolute; /* Sparks are SVG circles, so they are not affected by this */
        }
        
        @keyframes fly-spark { /* Re-defined to be more generic */
            0% { transform: scale(1); opacity: 1; }
            100% { transform: translate(-40px, 15px) scale(0); opacity: 0; }
        }


        /* ---------------- FOOTER UI ---------------- */
        .ui-footer {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 80px;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-orange);
          box-shadow: 0 0 8px var(--accent-orange);
          animation: pulse-dot 1.5s infinite alternate;
        }

        @keyframes pulse-dot {
          0% { box-shadow: 0 0 8px var(--accent-orange); }
          100% { box-shadow: 0 0 15px var(--accent-yellow), 0 0 25px var(--accent-orange); }
        }

        /* Sleek Button */
        .ignite-btn {
          background: rgba(255, 110, 0, 0.05);
          border: 1px solid var(--accent-orange);
          padding: 1rem 3rem;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(255, 110, 0, 0.1);
          transition: all 0.3s ease;
          animation: pulse-btn 2s infinite;
        }

        .ignite-btn:hover {
          background: rgba(255, 110, 0, 0.15);
          box-shadow: 0 0 30px rgba(255, 110, 0, 0.4);
          transform: translateY(-2px);
        }

        .btn-text {
          font-family: 'Orbitron', sans-serif; /* Changed to Orbitron for consistency */
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--accent-yellow);
          letter-spacing: 3px;
          position: relative;
          z-index: 2;
          text-shadow: 0 0 5px rgba(254, 234, 0, 0.5);
        }

        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 0 15px rgba(255, 110, 0, 0.1); }
          50% { box-shadow: 0 0 30px rgba(255, 110, 0, 0.3); }
        }

        /* ---------------- F1 LIGHTS ---------------- */
        .f1-lights-rig {
          display: flex;
          gap: 15px;
          background: #111;
          padding: 15px 25px;
          border-radius: 8px;
          border: 1px solid #333;
          box-shadow: 0 10px 30px rgba(0,0,0,0.9);
        }

        .f1-light-housing {
          width: 35px;
          height: 35px;
          background: #000;
          border-radius: 50%;
          border: 2px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .light-bulb {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #1a1a1a;
          transition: background 0.05s, box-shadow 0.05s;
        }

        .light-bulb.red-on {
          background: #ff1100;
          box-shadow: 0 0 25px #ff1100, inset 0 0 10px #ffaaaa;
        }

        .light-bulb.green-on {
          background: #00ff2a;
          box-shadow: 0 0 30px #00ff2a, inset 0 0 10px #fff;
        }

        /* Responsive Adjustments */
        @media (max-width: 1024px) {
          .loader-container { padding: 1.5rem 2rem; }
          .logo { font-size: 1.8rem; }
          .tagline { font-size: 0.65rem; letter-spacing: 3px; }
          .data-value { font-size: 2rem; }
          .data-label { font-size: 0.7rem; }
          .ignite-btn { padding: 0.8rem 2rem; }
          .btn-text { font-size: 0.9rem; }
          .f1-lights-rig { gap: 10px; padding: 10px 15px; }
          .f1-light-housing { width: 30px; height: 30px; }
          .light-bulb { width: 20px; height: 20px; }
        }

        @media (max-width: 768px) {
          .loader-container { padding: 1rem; }
          .ui-header { flex-direction: column; align-items: center; gap: 1rem; }
          .logo-box { padding-left: 0; border-left: none; text-align: center; }
          .logo { font-size: 1.5rem; }
          .tagline { font-size: 0.6rem; letter-spacing: 2px; }
          .status-section { padding: 0.5rem 1rem; }
          .data-value { font-size: 1.5rem; }
          .data-label { font-size: 0.6rem; }
          .ignite-btn { padding: 0.6rem 1.5rem; }
          .btn-text { font-size: 0.8rem; letter-spacing: 1px; }
          .f1-lights-rig { gap: 8px; padding: 8px 12px; }
          .f1-light-housing { width: 25px; height: 25px; }
          .light-bulb { width: 15px; height: 15px; }
          .track-svg { width: 100%; height: auto; }
        }
      `}} />
    </div>
  );
};

export default Loader;
import { useAuth } from "../features/auth/features.authContext";
import { useNavigate } from "react-router-dom";
import "../styles/lobby.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="home-container">

      {/* Top Bar */}
      <div className="top-bar">
        <div 
          className="logo"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/lobby")}
        >
          DEBUG RACE
        </div>

        
      </div>

      {/* Center Section */}
      <div className="hero-section">

        <h1 className="main-title">PROFILE</h1>

        <p className="subtitle">
          RACER TELEMETRY DATA
        </p>

        {/* Profile Card */}
        <div
          style={{
            width: "420px",
            border: "2px solid #ff6a00",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "25px",
            background: "rgba(0,0,0,0.6)"
          }}
        >

        import React, { useMemo } from 'react';

interface AvatarProps {
  userId: string;
  username: string;
  lobbyPosition?: number; // 0-3 for 4 players in lobby
  size?: 'small' | 'medium' | 'large';
}

// F1 Driver helmet colors for lobby players
const HELMET_COLORS = [
  '#FF0000', // Red for Player 1
  '#0066FF', // Blue for Player 2
  '#FFB800', // Orange for Player 3
  '#00AA00', // Green for Player 4
];

// Generate SVG F1 Driver Avatar
const generateF1Avatar = (userId: string, helmetColor: string): string => {
  const svgString = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Head -->
      <circle cx="100" cy="70" r="35" fill="#F4A460"/>
      
      <!-- Neck -->
      <rect x="85" y="100" width="30" height="15" fill="#F4A460"/>
      
      <!-- F1 Suit Body -->
      <ellipse cx="100" cy="140" rx="45" ry="50" fill="#1A1A1A"/>
      
      <!-- Suit Racing Stripes/Details -->
      <rect x="85" y="110" width="30" height="60" fill="${helmetColor}" opacity="0.9"/>
      
      <!-- Suit Branding Panels -->
      <rect x="60" y="130" width="15" height="35" fill="#FFD700" opacity="0.8"/>
      <rect x="125" y="130" width="15" height="35" fill="#FFD700" opacity="0.8"/>
      
      <!-- Helmet -->
      <ellipse cx="100" cy="70" rx="38" ry="42" fill="${helmetColor}" opacity="0.95"/>
      
      <!-- Helmet Visor -->
      <ellipse cx="100" cy="65" rx="32" ry="28" fill="#1a1a2e" opacity="0.7"/>
      <ellipse cx="100" cy="63" rx="28" ry="24" fill="#00FFFF" opacity="0.3"/>
      
      <!-- Helmet Stripe (User Initial) -->
      <text x="100" y="85" font-size="24" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">
        ${userId.charAt(0).toUpperCase()}
      </text>
      
      <!-- Arms -->
      <rect x="50" y="120" width="12" height="45" fill="#F4A460" rx="6"/>
      <rect x="138" y="120" width="12" height="45" fill="#F4A460" rx="6"/>
      
      <!-- Gloves -->
      <circle cx="56" cy="168" r="8" fill="#000000"/>
      <circle cx="144" cy="168" r="8" fill="#000000"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

export const F1Avatar: React.FC<AvatarProps> = ({
  userId,
  username,
  lobbyPosition = 0,
  size = 'medium',
}) => {
  // Determine helmet color based on lobby position or user ID
  const helmetColor = useMemo(() => {
    if (lobbyPosition !== undefined && lobbyPosition >= 0 && lobbyPosition < 4) {
      return HELMET_COLORS[lobbyPosition];
    }
    // Fallback: generate color from userId hash
    const hash = userId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return HELMET_COLORS[Math.abs(hash) % 4];
  }, [userId, lobbyPosition]);

  const avatarSrc = useMemo(() => {
    return generateF1Avatar(userId, helmetColor);
  }, [userId, helmetColor]);

  const sizeConfig = {
    small: { width: '60px', height: '60px' },
    medium: { width: '100px', height: '100px' },
    large: { width: '140px', height: '140px' },
  };

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <img
        src={avatarSrc}
        alt={`${username}'s F1 Avatar`}
        onError={(e) => {
          console.error('Avatar failed to load:', e);
          // Fallback solid color with initials
          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(helmetColor)}'/%3E%3Ctext x='50' y='60' font-size='40' fill='white' text-anchor='middle' font-weight='bold'%3E${username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
        }}
        style={{
          ...sizeConfig[size],
          borderRadius: '50%',
          border: `3px solid ${helmetColor}`,
          boxShadow: `0 0 10px ${helmetColor}80`,
          objectFit: 'cover',
          backgroundColor: helmetColor,
        }}
      />
      <span style={{ fontSize: '12px', fontWeight: 'bold', color: helmetColor }}>
        {username}
      </span>
    </div>
  );
};

          {/* Name */}
          <div>
            <p style={{ color: "#ffd700", letterSpacing: "2px" }}>NAME</p>
            <h3 style={{ marginTop: "5px" }}>
              {user?.username || "UNKNOWN RACER"}
            </h3>
          </div>

          {/* Email */}
          <div>
            <p style={{ color: "#ffd700", letterSpacing: "2px" }}>EMAIL</p>
            <h3 style={{ marginTop: "5px" }}>
              {user?.email || "NOT AVAILABLE"}
            </h3>
          </div>

          {/* Logout Button */}
          <button className="primary-action" onClick={handleLogout}>
              LOG OUT
          </button>

        </div>

      </div>
    </div>
  );
};

export default Profile;

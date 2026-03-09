import { useAuth } from "../features/auth/features.authContext";
import { useNavigate } from "react-router-dom";
import { F1Avatar } from "../components/AvatarComponent"; // Import the avatar component
import "../styles/lobby.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  
  // Avatar images array
  const avatars = [
    '/assets/images/avatar1.png',
    '/assets/images/avatar2.png',
    '/assets/images/avatar3.png',
    '/assets/images/avatar4.png'
  ];

  // Get user data from localStorage (same as existing auth system)
  const user = JSON.parse(localStorage.getItem('user')) || {
    username: 'Guest',
    email: 'guest@example.com'
  };

  // State for current avatar index being viewed
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  
  // State for selected avatar (persisted)
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  
  // State to track if current displayed avatar is the selected one
  const [isCurrentSelected, setIsCurrentSelected] = useState(false);

  // Load selected avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar);
      // Find the index of the saved avatar
      const savedIndex = avatars.findIndex(avatar => avatar === savedAvatar);
      if (savedIndex !== -1) {
        setCurrentAvatarIndex(savedIndex);
      }
    }
  }, []);

  // Check if current displayed avatar is the selected one
  useEffect(() => {
    setIsCurrentSelected(avatars[currentAvatarIndex] === selectedAvatar);
  }, [currentAvatarIndex, selectedAvatar]);

  // Navigate to previous avatar (cycles infinitely)
  const handlePrevAvatar = () => {
    setCurrentAvatarIndex((prevIndex) => 
      prevIndex === 0 ? avatars.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next avatar (cycles infinitely)
  const handleNextAvatar = () => {
    setCurrentAvatarIndex((prevIndex) => 
      prevIndex === avatars.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Select current avatar and save to localStorage
  const handleSelectAvatar = () => {
    const avatarPath = avatars[currentAvatarIndex];
    setSelectedAvatar(avatarPath);
    localStorage.setItem('selectedAvatar', avatarPath);
  };

  // Handle logout - clear auth and redirect
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Navigate to Lobby
  const handleDebugRace = () => {
    navigate('/lobby');
  };

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <button className="debug-race-btn" onClick={handleDebugRace}>
          DEBUG RACE
        </button>
        <div className="header-titles">
          <h1 className="profile-title">PROFILE</h1>
          <p className="profile-subtitle">RACER TELEMETRY DATA</p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="profile-main">
        {/* Left Side - Avatar Selector */}
        <div className="profile-left">
          <div className="avatar-panel">
            <h2 className="panel-title">SELECT AVATAR</h2>
            
            <div className="avatar-selector">
              {/* Left Arrow */}
              <button 
                className="avatar-arrow arrow-left" 
                onClick={handlePrevAvatar}
                aria-label="Previous avatar"
              >
                <img 
                  src="/assets/images/left-arrow.png" 
                  alt="Previous" 
                  className="arrow-img"
                />
              </button>

              {/* Avatar Display */}
              <div className={`avatar-display ${isCurrentSelected ? 'avatar-selected' : ''}`}>
                <div className="avatar-frame">
                  <img 
                    src={avatars[currentAvatarIndex]} 
                    alt={`Avatar ${currentAvatarIndex + 1}`}
                    className="avatar-image"
                  />
                </div>
                <div className="avatar-indicator">
                  {avatars.map((_, index) => (
                    <span 
                      key={index} 
                      className={`indicator-dot ${index === currentAvatarIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button 
                className="avatar-arrow arrow-right" 
                onClick={handleNextAvatar}
                aria-label="Next avatar"
              >
                <img 
                  src="/assets/images/right-arrow.png" 
                  alt="Next" 
                  className="arrow-img"
                />
              </button>
            </div>

            {/* Select Button */}
            <button 
              className={`select-avatar-btn ${isCurrentSelected ? 'selected' : ''}`}
              onClick={handleSelectAvatar}
              disabled={isCurrentSelected}
            >
              {isCurrentSelected ? 'SELECTED' : 'SELECT'}
            </button>
          </div>
        </div>

        {/* Right Side - Profile Info */}
        <div className="profile-right">
          <div className="info-panel">
            <h2 className="panel-title">RACER TELEMETRY INFO</h2>
            
            <div className="profile-info">
              <div className="info-group">
                <label className="info-label">NAME</label>
                <p className="info-value">{user.username}</p>
              </div>
              
              <div className="info-group">
                <label className="info-label">EMAIL</label>
                <p className="info-value">{user.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button className="logout-btn" onClick={handleLogout}>
              LOG OUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
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
            background: "rgba(0,0,0,0.6)",
          }}
        >
          {/* Avatar Section */}
          <div style={{ textAlign: "center" }}>
            <F1Avatar
              userId={user?.id || "UNKNOWN"}
              username={user?.username || "RACER"}
              size="large"
            />
          </div>

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

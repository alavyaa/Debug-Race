import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();

  // Avatar images
  const avatars = [
    "frontend/src/assets/images/avatar1.png",
    "frontend/src/assets/images/avatar2.png",
    "frontend/src/assets/images/avatar3.png",
    "frontend/src/assets/images/avatar4.png",
  ];

  // User data from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {
    username: "Guest",
    email: "guest@example.com",
  };

  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isCurrentSelected, setIsCurrentSelected] = useState(false);

  // Load saved avatar
  useEffect(() => {
    const savedAvatar = localStorage.getItem("selectedAvatar");
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar);

      const savedIndex = avatars.findIndex(
        (avatar) => avatar === savedAvatar
      );

      if (savedIndex !== -1) {
        setCurrentAvatarIndex(savedIndex);
      }
    }
  }, []);

  // Check selected state
  useEffect(() => {
    setIsCurrentSelected(
      avatars[currentAvatarIndex] === selectedAvatar
    );
  }, [currentAvatarIndex, selectedAvatar]);

  // Previous avatar
  const handlePrevAvatar = () => {
    setCurrentAvatarIndex((prev) =>
      prev === 0 ? avatars.length - 1 : prev - 1
    );
  };

  // Next avatar
  const handleNextAvatar = () => {
    setCurrentAvatarIndex((prev) =>
      prev === avatars.length - 1 ? 0 : prev + 1
    );
  };

  // Select avatar
  const handleSelectAvatar = () => {
    const avatarPath = avatars[currentAvatarIndex];
    setSelectedAvatar(avatarPath);
    localStorage.setItem("selectedAvatar", avatarPath);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Go to lobby
  const handleDebugRace = () => {
    navigate("/lobby");
  };

  return (
    <div className="profile-container">

      {/* Header */}
      <div className="profile-header">
        <button className="debug-race-btn" onClick={handleDebugRace}>
          DEBUG RACE
        </button>

        <div className="header-titles">
          <h1 className="profile-title">PROFILE</h1>
          <p className="profile-subtitle">
            RACER TELEMETRY DATA
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="profile-main">

        {/* Avatar Section */}
        <div className="profile-left">

          <div className="avatar-selector">

            <button
              className="avatar-arrow"
              onClick={handlePrevAvatar}
            >
              ◀
            </button>

            <img
              src={avatars[currentAvatarIndex]}
              className="avatar-image"
              alt="avatar"
            />

            <button
              className="avatar-arrow"
              onClick={handleNextAvatar}
            >
              ▶
            </button>

          </div>

          <button
            className={`select-avatar-btn ${
              isCurrentSelected ? "selected" : ""
            }`}
            onClick={handleSelectAvatar}
            disabled={isCurrentSelected}
          >
            {isCurrentSelected ? "SELECTED" : "SELECT"}
          </button>

        </div>

        {/* User Info */}
        <div className="profile-right">

          <div className="info-group">
            <p className="info-label">NAME</p>
            <h3>{user.username}</h3>
          </div>

          <div className="info-group">
            <p className="info-label">EMAIL</p>
            <h3>{user.email}</h3>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            LOG OUT
          </button>

        </div>

      </div>
    </div>
  );
};

export default Profile;

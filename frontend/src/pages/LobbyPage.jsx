import { useAuth } from "../features/auth/features.authContext";
import api from "../services/api.service";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import "../styles/lobby.css";

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const f1CarRef = useRef(null); // Ref for F1 animation overlay

  const handleCreate = async () => {
  // Get the button element and add animating class
  const button = document.querySelector('.primary-action');
  if (button) {
    button.classList.add('animating');
  }

  // Wait for animation to finish (1.5s)
  setTimeout(async () => {
    // Remove animation class
    if (button) {
      button.classList.remove('animating');
    }

    try {
      const res = await api.post("/lobby", {
        name: "Debug Race"
      });

      const code = res.data.lobby.code;
      navigate(`/room/${code}`);
    } catch (error) {
      console.error("Failed to create lobby", error);
    }
  }, 1500);
};

  const handleJoin = async () => {
    const code = prompt("Enter Room Code");
    if (!code) return;

    try {
      await api.post("/lobby/join", { code });
      navigate(`/room/${code.toUpperCase()}`);
    } catch (err) {
      alert("Lobby not found");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      {/* Top Navigation */}
      <div className="top-bar">
        <div className="logo">DEBUG RACE</div>
        <div className="top-icons">
          <button className="icon-btn" onClick={() => navigate("/profile")}>
            <i className="fa-regular fa-user"></i>
          </button>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="hero-section">
        <h1 className="main-title">DEBUG RACE</h1>
        <p className="subtitle">MULTIPLAYER COMPETITIVE DEBUGGING ARENA</p>

        <div className="button-group">
          <button className="primary-action" onClick={handleCreate}>
  CREATE LOBBY
  <div className="f1-car"></div> {/* F1 car element */}
</button>

          <button className="secondary-action" onClick={handleJoin}>
            JOIN LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

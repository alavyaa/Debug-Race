import { useAuth } from "../features/auth/features.authContext";
import api from "../services/api.service";
import { useNavigate } from "react-router-dom";
import "../styles/lobby.css";


const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
  try {
    const res = await api.post("/lobby", {
      name: "Debug Race"
    });

    const code = res.data.lobby.code;

    navigate(`/room/${code}`);

  } catch (error) {
    console.error("Failed to create lobby", error);
  }
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
          {/* <button className="icon-btn" onClick={handleLogout}>
            <i className="fa-solid fa-gear"></i>
          </button> */}
        </div>
      </div>

      {/* Main Center Content */}
      <div className="hero-section">
        <h1 className="main-title">DEBUG RACE</h1>

        <p className="subtitle">MULTIPLAYER COMPETITIVE DEBUGGING ARENA</p>

        <div className="button-group">
          <button className="primary-action" onClick={handleCreate}>
            🚀 CREATE LOBBY
          </button>

          <button className="secondary-action" onClick={handleJoin}>
            🔑 JOIN LOBBY
          </button>

        </div>
      </div>
    </div>
  );
};

export default Lobby;

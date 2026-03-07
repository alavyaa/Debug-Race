import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.service";
import "../styles/room.css";   // 🔥 ADD THIS

const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch lobby data
  const fetchLobby = useCallback(async () => {
    try {
      if (!code) return;

      const res = await api.get(`/lobby/${code}`);

      setLobby(res.data);
      setError(null);

      // 🔥 If race started → redirect
      if (res.data.status === "racing" && res.data.currentRace) {
        navigate(`/race/${res.data.currentRace}`);
        return;
      }

    } catch (err) {
      setError("Lobby not found or server error.");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  // Poll lobby every 3 seconds
  useEffect(() => {
    if (!code) return;

    fetchLobby();

    const interval = setInterval(() => {
      fetchLobby();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchLobby, code]);

  // Toggle ready
  const toggleReady = async () => {
    try {
      setUpdating(true);
      await api.patch(`/lobby/${code}/ready`);
      await fetchLobby();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Start race
  const startRace = async () => {
    try {
      setUpdating(true);

      const res = await api.post(`/lobby/${code}/start`);

      if (res.data?.race?._id) {
        navigate(`/race/${res.data.race._id}`);
      }

    } catch (err) {
      console.error(err);
      alert("Cannot start race.");
    } finally {
      setUpdating(false);
    }
  };

  // Leave lobby
  const leaveLobby = async () => {
    try {
      await api.delete(`/lobby/${code}`);
      navigate("/lobby");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="room-container">
        <div className="hero-section">
          <p>Loading Lobby...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-container">
        <div className="hero-section">
          <p>{error}</p>
          <button
            onClick={() => navigate("/lobby")}
            className="primary-action"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">

      {/* Header */}
      <div className="room-header">
        <h1 className="room-title">
          LOBBY CODE: <span>{lobby.code}</span>
        </h1>

        <button
          onClick={leaveLobby}
          className="leave-btn"
        >
          LEAVE LOBBY
        </button>
      </div>

      {/* Status */}
      <div className="room-status">
        <p>
          STATUS: <span className="status">{lobby.status}</span>
        </p>

        <p>
          LEADER: <span className="leader">{lobby.leader.username}</span>
        </p>
      </div>

      {/* Players */}
      <div className="players-grid">

        {lobby.members.map((member) => (
          <div
            key={member.user._id}
            className="player-card"
          >
            <div className="flex justify-between items-center">

              <div>
                <p className="player-name">{member.username}</p>
                <p className="player-status">
                  {member.isReady ? "Ready" : "Not Ready"}
                </p>
              </div>

              <div
                className={`ready-indicator ${
                  member.isReady ? "ready" : "not-ready"
                }`}
              />

            </div>
          </div>
        ))}

      </div>

      {/* Controls */}
      <div className="room-controls">

        <button
          onClick={toggleReady}
          disabled={updating}
          className="room-btn ready-btn"
        >
          TOGGLE READY
        </button>

        {lobby.status === "ready" && (
          <button
            onClick={startRace}
            disabled={updating}
            className="room-btn start-btn"
          >
            START RACE
          </button>
        )}

      </div>

    </div>
  );
};

export default RoomPage;

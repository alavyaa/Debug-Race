import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.service";
import { useAuth } from "../features/auth/features.authContext";
import "../styles/room.css";

const LEVEL_INFO = [
  { level: 1, laps: 1, focus: "Syntax Basics", track: "Beginner Track" },
  { level: 2, laps: 2, focus: "Logic Errors", track: "Rookie Track" },
  { level: 3, laps: 3, focus: "Algorithm Bugs", track: "Pro Track" },
  { level: 4, laps: 4, focus: "Complex Logic", track: "Expert Track" },
  { level: 5, laps: 5, focus: "Advanced Algorithms", track: "Champion Track" },
];

const LANGUAGES = ["C", "Java", "Python", "JavaScript"];

const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettings] = useState({ language: "JavaScript", level: 1 });

  // Leader detection — handles both populated and raw ObjectId forms
  const userId = user?._id || user?.id;
  const isLeader =
    lobby &&
    userId &&
    (lobby.leader?._id
      ? lobby.leader._id.toString() === userId.toString()
      : lobby.leader?.toString() === userId.toString());

  // Fetch lobby data
  const fetchLobby = useCallback(async () => {
    try {
      if (!code) return;

      const res = await api.get(`/lobby/${code}`);

      setLobby(res.data);
      setSettings({
        language: res.data.settings?.language || "JavaScript",
        level: res.data.settings?.level || 1,
      });
      setError(null);

      // If race started → redirect
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

    const interval = setInterval(fetchLobby, 3000);

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

  // Update settings (leader only)
  const updateSettings = async (newSettings) => {
    try {
      setUpdating(true);
      await api.patch(`/lobby/${code}/settings`, newSettings);
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
      await api.post(`/lobby/${code}/leave`);
    } catch (err) {
      console.error(err);
    } finally {
      navigate("/lobby");
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
          LOBBY CODE: <span>{lobby?.code}</span>
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
          STATUS: <span className="status">{lobby?.status}</span>
        </p>

        <p>
          LEADER:{" "}
          <span className="leader">
            {lobby?.leader?.username || "Unknown"}
          </span>
        </p>
      </div>

      {/* Race Settings */}
      <div className="settings-panel">
        <h2 className="settings-title">RACE SETTINGS</h2>

        {!isLeader && (
          <p className="settings-note">Only the leader can change settings.</p>
        )}

        {/* Language Selector */}
        <div className="settings-row">
          <label className="settings-label">LANGUAGE</label>
          <div className="language-options">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`lang-btn${settings.language === lang ? " active" : ""}${!isLeader ? " disabled-btn" : ""}`}
                onClick={() => isLeader && updateSettings({ language: lang, level: settings.level })}
                disabled={!isLeader || updating}
                title={!isLeader ? "Only the leader can change settings" : ""}
                style={{ cursor: !isLeader ? "not-allowed" : "pointer" }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="settings-row">
          <label className="settings-label">DIFFICULTY</label>
          <div className="level-options">
            {LEVEL_INFO.map((info) => (
              <div
                key={info.level}
                className={`level-card${settings.level === info.level ? " active" : ""}${!isLeader ? " disabled-card" : ""}`}
                onClick={() => isLeader && !updating && updateSettings({ language: settings.language, level: info.level })}
                title={!isLeader ? "Only the leader can change settings" : ""}
                style={{ cursor: isLeader ? "pointer" : "not-allowed" }}
              >
                <p className="level-num">LVL {info.level}</p>
                <p className="level-laps">{info.laps} Lap{info.laps > 1 ? "s" : ""}</p>
                <p className="level-focus">{info.focus}</p>
                <p className="level-track">{info.track}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="players-grid">

        {lobby?.members?.map((member) => (
          <div
            key={member?.user?._id || member?.username}
            className="player-card"
          >
            <div className="flex justify-between items-center">

              <div>
                <p className="player-name">
                  {member?.user?.username || member?.username || "Player"}
                </p>

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

        {lobby?.status === "ready" && isLeader && (
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

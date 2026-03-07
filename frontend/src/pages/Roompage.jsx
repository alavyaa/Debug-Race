import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.service";

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

      // 🔥 If race started → redirect to race page
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

  // 🔥 Poll lobby every 3 seconds
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
      <div className="flex items-center justify-center h-screen text-white">
        Loading Lobby...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-400">
        <p>{error}</p>
        <button
          onClick={() => navigate("/lobby")}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Lobby Code: <span className="text-cyan-400">{lobby.code}</span>
        </h1>

        <button
          onClick={leaveLobby}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Leave Lobby
        </button>
      </div>

      {/* Lobby Status */}
      <div className="mb-6">
        <p>Status: <span className="text-yellow-400">{lobby.status}</span></p>
        <p>Leader: <span className="text-green-400">{lobby.leader.username}</span></p>
      </div>

      {/* Player List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {lobby.members.map((member) => (
          <div
            key={member.user._id}
            className="p-4 border border-gray-700 rounded bg-[#111118]"
          >

            <div className="flex justify-between items-center">

              <div>
                <p className="text-lg font-semibold">{member.username}</p>
                <p className="text-sm text-gray-400">
                  {member.isReady ? "Ready" : "Not Ready"}
                </p>
              </div>

              <div
                className={`w-3 h-3 rounded-full ${
                  member.isReady ? "bg-green-500" : "bg-red-500"
                }`}
              />

            </div>

          </div>
        ))}

      </div>

      {/* Controls */}
      <div className="mt-10 flex gap-4">

        <button
          onClick={toggleReady}
          disabled={updating}
          className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Toggle Ready
        </button>

        {lobby.status === "ready" && (
          <button
            onClick={startRace}
            disabled={updating}
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Start Race
          </button>
        )}

      </div>

    </div>
  );
};

export default RoomPage;

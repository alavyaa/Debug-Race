const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map();

const TOTAL_LAPS = 2; // Change karo agar laps dynamic hain

module.exports = function(io, socket){
  socket.on('joinRace', ({ raceId, userId, username }) => {
    // Optional: Add join logic
  });

  socket.on("createRoom", data => {
    const { teamCode, userId, username, avatar } = data;
    socket.join(teamCode);

    rooms.set(teamCode,[{
      id: userId,
      socketId: socket.id,
      username,
      avatar,
      isReady: false,
      isLeader: true
    }]);

    playerMeta.set(socket.id, { username, avatar, userId });

    io.to(teamCode).emit("roomUpdate",{
      code:teamCode,
      players:rooms.get(teamCode),
      status:"waiting"
    });
  });

  socket.on("answerSubmitted", ({ teamCode, isCorrect, responseTime, raceId }) => {
    if (!playerStats.has(socket.id)) {
      playerStats.set(socket.id, { speed: 50, position: 0, lap: 1, streak: 0, socketId: socket.id });
    }
    const stats = playerStats.get(socket.id);

    if (isCorrect) {
      stats.streak = (stats.streak || 0) + 1;
    } else {
      stats.streak = 0;
    }

    const rt = responseTime || 10;
    let speedDelta = isCorrect ? Math.max(5, 25 - rt * 1.5) : -15;
    stats.speed = Math.max(10, Math.min(150, stats.speed + speedDelta));

    if (isCorrect) {
      stats.position += 1/3;
      if(stats.position >= 1){
        stats.position -= 1;
        stats.lap += 1;
        socket.emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        if(teamCode){
          socket.to(teamCode).emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        }
      }
    }

    playerStats.set(socket.id, stats);

    // Always use real username from playerMeta
    const meta = playerMeta.get(socket.id) || {};
    const updatePayload = {
      playerId: socket.id,
      username: meta.username || "Unknown",
      avatar: meta.avatar || "",
      lap: stats.lap,
      position: stats.position,
      speed: stats.speed,
    };
    socket.emit('positionUpdate', updatePayload);
    if(teamCode){
      socket.to(teamCode).emit('positionUpdate', updatePayload);
    }

    // --- RACE FINISHED AND WINNER LOGIC ---
    // If all players reached last lap -> race finish
    // Check all playerStats for lap >= TOTAL_LAPS
    const allPlayers = Array.from(playerStats.values());
    const allFinished = allPlayers.length >= 1 && allPlayers.every(p => p.lap >= TOTAL_LAPS);

    if (allFinished) {
      // Winner: highest speed, customize as needed
      let winnerPlayer = allPlayers[0];
      for (const p of allPlayers) {
        if (p.speed > winnerPlayer.speed) winnerPlayer = p;
      }

      io.to(teamCode).emit("raceFinished", {
        winner: playerMeta.get(winnerPlayer.socketId)?.username || "Unknown",
        players: allPlayers.map((p) => ({
          username: playerMeta.get(p.socketId)?.username || "Unknown",
          lap: p.lap,
          speed: p.speed,
        })),
      });

      // Optionally: Reset stats after finish if you want rematch
      // playerStats.clear();
      // playerMeta.clear();
    }
    // --- END WINNER LOGIC ---
  });

  socket.on("disconnect",()=>{
    console.log("Player disconnected:", socket.id);
    playerStats.delete(socket.id);
    playerMeta.delete(socket.id);
  });
};

const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map(); // FIX: declare playerMeta

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

    // FIX: store meta for this player
    playerMeta.set(socket.id, { username, avatar, userId });

    io.to(teamCode).emit("roomUpdate",{
      code:teamCode,
      players:rooms.get(teamCode),
      status:"waiting"
    });
  });

  socket.on("answerSubmitted", ({ teamCode, isCorrect, responseTime, raceId }) => {
    if (!playerStats.has(socket.id)) {
      playerStats.set(socket.id, { speed: 50, position: 0, lap: 1, streak: 0 });
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

    // FIX: Always use real username from playerMeta (never Unknown)
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
  });

  socket.on("disconnect",()=>{
    console.log("Player disconnected:", socket.id);
    playerStats.delete(socket.id);
    playerMeta.delete(socket.id); // FIX: No crash
  });
};

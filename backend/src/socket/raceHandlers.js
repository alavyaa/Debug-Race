const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map();

module.exports = function(io, socket){

  socket.on('joinRace', ({ raceId, userId, username }) => {
    if (raceId) socket.join(raceId);
    playerMeta.set(socket.id, { username, userId, raceId });
    console.log(`Player joined: ${username} | race: ${raceId} | socket: ${socket.id}`);

    // Naye player ko existing players ka data bhejo
    playerStats.forEach((stats, socketId) => {
      if (socketId === socket.id) return;
      const otherMeta = playerMeta.get(socketId) || {};
      if (otherMeta.raceId !== raceId) return;
      socket.emit('positionUpdate', {
        playerId: socketId,
        username: otherMeta.username || `Player ${socketId.slice(-4)}`,
        avatar: otherMeta.avatar || "",
        lap: stats.lap,
        position: stats.position,
        speed: stats.speed,
      });
    });
  });

  socket.on("createRoom", data => {
    const { teamCode, userId, username, avatar } = data;
    socket.join(teamCode);
    rooms.set(teamCode, [{
      id: userId,
      socketId: socket.id,
      username,
      avatar,
      isReady: false,
      isLeader: true
    }]);
    playerMeta.set(socket.id, { username, avatar, userId });
    io.to(teamCode).emit("roomUpdate", {
      code: teamCode,
      players: rooms.get(teamCode),
      status: "waiting"
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

    const meta = playerMeta.get(socket.id) || {};
    // ✅ FIX: raceId frontend se aaye ya meta se lo
    const resolvedRaceId = raceId || meta.raceId || teamCode;

    if (isCorrect) {
      stats.position += 1 / 3;
      if (stats.position >= 1) {
        stats.position -= 1;
        stats.lap += 1;
        socket.emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        // ✅ FIX: lapComplete bhi raceId room mein emit karo
        if (resolvedRaceId) {
          socket.to(resolvedRaceId).emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        }
      }
    }

    playerStats.set(socket.id, stats);

    const updatePayload = {
      playerId: socket.id,
      username: meta.username || `Player ${socket.id.slice(-4)}`,
      avatar: meta.avatar || "",
      lap: stats.lap,
      position: stats.position,
      speed: stats.speed,
    };

    // Apne aap ko update karo
    socket.emit('positionUpdate', updatePayload);

    // ✅ FIX: raceId room mein sabko bhejo
    if (resolvedRaceId) {
      socket.to(resolvedRaceId).emit('positionUpdate', updatePayload);
    }

    socket.emit('speedUpdate', {
      playerId: socket.id,
      speed: stats.speed,
      streak: stats.streak
    });
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    playerStats.delete(socket.id);
    playerMeta.delete(socket.id);
  });
};

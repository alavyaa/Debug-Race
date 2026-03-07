const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map();

module.exports = function(io, socket){

  socket.on('joinRace', ({ raceId, userId, username }) => {
    if (raceId) socket.join(raceId);
    const resolvedUsername = username || socket.handshake.auth?.username || `Player ${socket.id.slice(-4)}`;
    const resolvedUserId = userId || socket.handshake.auth?.userId;
    playerMeta.set(socket.id, { username: resolvedUsername, userId: resolvedUserId, raceId });
    console.log(`Player joined: ${resolvedUsername} | race: ${raceId} | socket: ${socket.id}`);

    // ✅ FIX: playerMeta se dhundho (playerStats empty ho sakta hai naye player ka)
    playerMeta.forEach((otherMeta, socketId) => {
      if (socketId === socket.id) return;
      if (otherMeta.raceId !== raceId) return;
      const stats = playerStats.get(socketId) || { lap: 1, position: 0, speed: 50 };
      socket.emit('positionUpdate', {
        playerId: socketId,
        username: otherMeta.username,
        avatar: otherMeta.avatar || "",
        lap: stats.lap,
        position: stats.position,
        speed: stats.speed,
      });
    });

    // ✅ FIX: doosre players ko bhi bata do naya player join hua
    socket.to(raceId).emit('positionUpdate', {
      playerId: socket.id,
      username: resolvedUsername,
      avatar: "",
      lap: 1,
      position: 0,
      speed: 50,
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
    const resolvedRaceId = raceId || meta.raceId || teamCode;

    if (isCorrect) {
      stats.position += 1 / 3;
      if (stats.position >= 1) {
        stats.position -= 1;
        stats.lap += 1;
        socket.emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        if (resolvedRaceId) {
          socket.to(resolvedRaceId).emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        }
      }
    }

    playerStats.set(socket.id, stats);

    const updatePayload = {
      playerId: socket.id,
      username: meta.username || socket.handshake.auth?.username || `Player ${socket.id.slice(-4)}`,
      avatar: meta.avatar || "",
      lap: stats.lap,
      position: stats.position,
      speed: stats.speed,
    };

    socket.emit('positionUpdate', updatePayload);

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

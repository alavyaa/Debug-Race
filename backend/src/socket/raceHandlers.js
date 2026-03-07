const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map();

module.exports = function(io, socket){

  // ✅ FIX 1: joinRace mein username aur raceId store karo
  socket.on('joinRace', ({ raceId, userId, username }) => {
    if (raceId) socket.join(raceId); // player ko raceId room mein daalo
    playerMeta.set(socket.id, { username, userId, raceId });
    console.log(`Player joined: ${username} | race: ${raceId} | socket: ${socket.id}`);
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

    if (isCorrect) {
      stats.position += 1 / 3;
      if (stats.position >= 1) {
        stats.position -= 1;
        stats.lap += 1;
        socket.emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        if (teamCode) {
          socket.to(teamCode).emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        }
      }
    }

    playerStats.set(socket.id, stats);

    // ✅ FIX 2: meta se username lo (joinRace mein store hua)
    const meta = playerMeta.get(socket.id) || {};
    const resolvedRaceId = raceId || meta.raceId;

    const updatePayload = {
      playerId: socket.id,
      username: meta.username || `Player ${socket.id.slice(-4)}`, // "Unknown" hata diya
      avatar: meta.avatar || "",
      lap: stats.lap,
      position: stats.position,
      speed: stats.speed,
    };

    // Apne aap ko bhi update karo
    socket.emit('positionUpdate', updatePayload);

    // ✅ FIX 3: raceId room mein emit karo - sabko milega update
    if (resolvedRaceId) {
      socket.to(resolvedRaceId).emit('positionUpdate', updatePayload);
    }

    // Purana teamCode wala bhi rakha (backward compat)
    if (teamCode) {
      socket.to(teamCode).emit('positionUpdate', updatePayload);
    }

    // Speed update bhi emit karo
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

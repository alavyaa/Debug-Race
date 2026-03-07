const rooms = new Map();
const playerStats = new Map();
const playerMeta = new Map();
const raceFinishOrder = new Map(); // raceId -> [socketId, ...]

module.exports = function(io, socket){

  socket.on('joinRace', ({ raceId, userId, username, totalLaps }) => {
    if (raceId) socket.join(raceId);

    const resolvedUsername = username || socket.handshake.auth?.username || `Player ${socket.id.slice(-4)}`;
    const resolvedUserId = userId || socket.handshake.auth?.userId;

    // totalLaps bhi store karo
    playerMeta.set(socket.id, {
      username: resolvedUsername,
      userId: resolvedUserId,
      raceId,
      totalLaps: totalLaps || 2
    });

    console.log(`Player joined: ${resolvedUsername} | race: ${raceId} | socket: ${socket.id}`);

    // Naye player ko existing players ka data bhejo
    playerStats.forEach((stats, socketId) => {
      if (socketId === socket.id) return;
      const otherMeta = playerMeta.get(socketId) || {};
      if (otherMeta.raceId !== raceId) return;
      socket.emit('positionUpdate', {
        playerId: socketId,
        username: otherMeta.username,
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
      playerStats.set(socket.id, { speed: 50, position: 0, lap: 1, streak: 0, finished: false });
    }

    const stats = playerStats.get(socket.id);

    // Agar player already finish kar chuka hai toh ignore karo
    if (stats.finished) return;

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
    const totalLaps = meta.totalLaps || 2; // ✅ meta se totalLaps lo

    if (isCorrect) {
      stats.position += 1 / 3;

      if (stats.position >= 1) {
        stats.position -= 1;
        stats.lap += 1;

        // ✅ FIX: Last lap complete hone ke baad raceFinished emit karo
        if (stats.lap > totalLaps) {
          stats.finished = true;
          playerStats.set(socket.id, stats);

          // Finish order track karo
          if (!raceFinishOrder.has(resolvedRaceId)) {
            raceFinishOrder.set(resolvedRaceId, []);
          }
          const finishList = raceFinishOrder.get(resolvedRaceId);
          finishList.push(socket.id);
          const rank = finishList.length;

          console.log(`Player finished: ${meta.username} | rank: ${rank} | race: ${resolvedRaceId}`);

          // Is player ko bata do wo finish ho gaya
          socket.emit('playerFinished', { playerId: socket.id, rank });

          // Sabko bata do ye player finish hua
          if (resolvedRaceId) {
            socket.to(resolvedRaceId).emit('playerFinished', { playerId: socket.id, rank });
          }

          // ✅ Sabko raceFinished emit karo - results page pe jaayenge
          if (resolvedRaceId) {
            io.to(resolvedRaceId).emit('raceFinished', {
              winnerId: socket.id,
              winnerName: meta.username,
              finishOrder: finishList
            });
          }

          // Cleanup
          raceFinishOrder.delete(resolvedRaceId);
          return;
        }

        // Normal lap complete
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

const rooms = new Map();
const playerStats = new Map(); // socket.id -> { speed, position, lap, streak }
const playerMeta = new Map();  // socket.id -> { userId, username, raceId }

module.exports = function(io, socket){

  socket.on('joinRace', ({ raceId, userId, username }) => {
    if (!raceId) {
      console.error('joinRace: missing raceId for socket', socket.id);
      return;
    }
    playerMeta.set(socket.id, { userId, username, raceId });
    socket.join(raceId);
  });

  socket.on("createRoom", data => {
    const { teamCode, userId, username, avatar } = data;

    socket.join(teamCode);

    rooms.set(teamCode,[{
      id:userId,
      socketId:socket.id,
      username,
      avatar,
      isReady:false,
      isLeader:true
    }]);

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

    // Update streak
    if (isCorrect) {
      stats.streak = (stats.streak || 0) + 1;
    } else {
      stats.streak = 0;
    }

    // Calculate new speed:
    //   correct: gain between 5 and 25 pts, scaled down by response time (1.5 pts/sec penalty)
    //   wrong:   lose 15 pts regardless of speed
    const rt = responseTime || 10;
    let speedDelta = 0;
    if (isCorrect) {
      speedDelta = Math.max(5, 25 - rt * 1.5);
    } else {
      speedDelta = -15;
    }
    stats.speed = Math.max(10, Math.min(150, stats.speed + speedDelta));

    // Advance position: each correct answer advances 1/3 of a lap fraction
    // (3 questions per lap, each correct = 1/3 lap progress)
    if (isCorrect) {
      stats.position = stats.position + (1 / 3);
      if (stats.position >= 1) {
        stats.position = stats.position - 1;
        stats.lap = stats.lap + 1;
        // Emit lapComplete to this player and teammates
        socket.emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        if (teamCode) {
          socket.to(teamCode).emit('lapComplete', { playerId: socket.id, lap: stats.lap - 1 });
        }
      }
    }

    playerStats.set(socket.id, stats);

    // Emit speedUpdate to the player
    socket.emit('speedUpdate', {
      playerId: socket.id,
      speed: stats.speed,
      streak: stats.streak,
    });

    // Emit positionUpdate to everyone in the room
    const meta = playerMeta.get(socket.id) || {};
    const updatePayload = {
      playerId: socket.id,
      username: meta.username || 'Unknown',
      position: stats.position,
      lap: stats.lap,
      speed: stats.speed,
    };
    socket.emit('positionUpdate', updatePayload);
    if (teamCode) {
      socket.to(teamCode).emit('positionUpdate', updatePayload);
    }
  });

  socket.on("disconnect",()=>{
    console.log("Player disconnected:", socket.id);
    playerStats.delete(socket.id);
    playerMeta.delete(socket.id);
  });

};
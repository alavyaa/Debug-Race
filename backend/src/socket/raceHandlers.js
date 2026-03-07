const rooms = new Map();
// Track per-socket accumulated position: { socketId: { position, lap } }
const playerProgress = new Map();

module.exports = function(io, socket){

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

  // When a player submits an answer, compute speed and position updates
  socket.on("answerSubmitted", ({ teamCode, isCorrect, responseTime }) => {
    const baseSpeed = 50;
    const speedBoost = isCorrect ? Math.max(10, 30 - (responseTime || 0) * 2) : 0;
    const speedPenalty = isCorrect ? 0 : 15;
    const newSpeed = Math.max(10, Math.min(150, baseSpeed + speedBoost - speedPenalty));

    // Emit speed update back to the answering player
    socket.emit("speedUpdate", {
      playerId: socket.id,
      speed: newSpeed,
      streak: 0
    });

    // Advance position only on correct answers
    if (isCorrect) {
      if (!playerProgress.has(socket.id)) {
        playerProgress.set(socket.id, { position: 0, lap: 1 });
      }
      const progress = playerProgress.get(socket.id);
      // Each correct answer advances ~1/9 of a lap (3 questions × 3 laps)
      const positionAdvance = 1 / 9;
      progress.position = (progress.position + positionAdvance) % 1;

      const positionPayload = {
        playerId: socket.id,
        position: positionAdvance,
        lap: progress.lap,
        speed: newSpeed
      };

      // Send to the player themselves
      socket.emit("positionUpdate", positionPayload);

      // Broadcast to the rest of the room
      if (teamCode) {
        socket.to(teamCode).emit("positionUpdate", positionPayload);
      }
    }
  });

  socket.on("disconnect",()=>{
    console.log("Player disconnected:", socket.id);
    playerProgress.delete(socket.id);
  });

};
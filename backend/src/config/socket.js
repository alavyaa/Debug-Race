const { Server } = require("socket.io");
const registerRaceHandlers = require("../socket/raceHandlers");

let io;

function initSocket(server){
  io = new Server(server,{
    cors:{
      origin:[
        "https://debug-race-ztam.onrender.com",
        "https://thriller-gpl-busy-masters.trycloudflare.com",
        "http://localhost:5173"
      ],
      methods:["GET","POST"],
      credentials:true
    }
  });

  io.on("connection",(socket)=>{
    console.log("Player connected:", socket.id);
    registerRaceHandlers(io, socket);
  });
}

function getIO(){
  if(!io) throw new Error("Socket not initialized");
  return io;
}

module.exports = { initSocket, getIO };

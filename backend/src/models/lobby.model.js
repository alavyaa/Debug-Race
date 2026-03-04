const mongoose = require('mongoose');

const lobbySchema = new mongoose.Schema({
    name : {
        type:String,
        required : true,
        trim : true,
        maxlength : 30
    },
    code : {
        type : String,
        required :true,
        unique : true,
        maxlength : 6
    },
    leader :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        avatar: {
          type: String,
          default: "",
        },
        isReady: {
          type: Boolean,
          default: false,
        },
        socketId: {
          type: String,
          default: null,
        },
      },
    ],
    settings :{
        language :{
            type : String,
            enum : ["C", "Python", "Java", "JavaScript"],
            default : "JavaScript"
        },
        level :{
            type : Number,
            min : 1,
            max : 5,
            default : 1
        },
        maxPlayers :{
            type : Number,
            max : 4,
            default: 4,
        }
    },
    status: {
      type: String,
      enum: ["waiting", "ready", "racing", "finished"],
      default: "waiting",
    },
    currentRace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Race",
      default: null,
    },
},{timestamps:true});

//Generate code for join lobby:-

lobbySchema.statics.generateCode = async function(){
    let code;
    let exists = true;
    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const lobby = await this.findOne({ code });
        if (!lobby) exists = false;
    }
    return code;
}

//Check lobby is full:

lobbySchema.methods.isFull = function () {
  return this.members.length >= this.settings.maxPlayers;
};

const lobbyModel = mongoose.model("Lobby", lobbySchema);
module.exports = lobbyModel;
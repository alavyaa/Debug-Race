const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema(
  {
    lobby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby",
      required: true,
    },

    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        completed: {
          type: Boolean,
          default: false,
        },

        finishTime: {
          type: Date,
          default: null,
        },

        submissions: {
          type: Number,
          default: 0,
        },
      },
    ],

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem", // If you create Problem model later
      default: null,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      default: null,
    },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["ongoing", "finished", "cancelled"],
      default: "ongoing",
    },
  },
  { timestamps: true }
);

const raceModel = mongoose.model("Race", raceSchema);

module.exports = raceModel;
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

        score: {
          type: Number,
          default: 0,
        },
      },
    ],

    questions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        lap: {
          type: Number,
        },
        type: {
          type: String,
          enum: ["MCQ", "DEBUG"],
        },
      },
    ],

    settings: {
      language: {
        type: String,
        default: "JavaScript",
      },
      level: {
        type: Number,
        default: 1,
      },
      totalLaps: {
        type: Number,
        default: 2,
      },
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
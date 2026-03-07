const lobbyModel = require("../models/lobby.model");
const raceModel = require("../models/race.model");
const { generateQuestionsForRace } = require("../services/questionService");

async function createLobbyController(req, res) {
  try {
    const { name, settings = {} } = req.body;
    const user = req.user;

    const lobby = await lobbyModel.create({
      name: name || "Debug Race Lobby",
      leader: user._id,
      code: await lobbyModel.generateCode(),

      settings: {
        language: settings.language || "JavaScript",
        level: settings.level || 1,
        maxPlayers: settings.maxPlayers || 4,
      },

      members: [
        {
          user: user._id,
          username: user.username,
          avatar: user.avatar,
          isReady: false,
        },
      ],

      status: "waiting",
      currentRace: null,
    });

    res.status(201).json({
      message: "Lobby Created successfully!",
      lobby,
    });

  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
}

async function joinLobbyController(req, res) {
  try {
    const { code } = req.body;
    const lobby = await lobbyModel.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby does not exist!" });
    }
    if (lobby.status !== "waiting") {
      return res.status(400).json({ message: "Race already in progress" });
    }
    if (lobby.isFull()) {
      return res.status(400).json({ message: "Lobby is full!" });
    }
    // Prevent duplicate join
    const alreadyMember = lobby.members.find(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "You are already in this lobby" });
    }
    lobby.members.push({
      user: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      isReady: false,
    });
    await lobby.save();
    res.status(200).json({
      message: "Joined lobby successfully!",
      lobby,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!" });
  }
}

async function exitLobbyController(req, res) {
  try {
    const { code } = req.params;
    const lobby = await lobbyModel.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby does not exist!" });
    }
    // Check if user is part of lobby
    const memberIndex = lobby.members.findIndex(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (memberIndex === -1) {
      return res.status(400).json({ message: "You are not in this lobby" });
    }
    const isLeaderLeaving = lobby.leader.toString() === req.user._id.toString();
    // Remove member
    lobby.members.splice(memberIndex, 1);
    // If no members left → delete lobby
    if (lobby.members.length === 0) {
      await lobby.deleteOne();
      return res.status(200).json({
        message: "Lobby deleted (empty)",
      });
    }
    //If leader leaves → transfer leadership
    if (isLeaderLeaving) {
      lobby.leader = lobby.members[0].user;
    }
    await lobby.save();
    res.status(200).json({
      message: "Left lobby successfully",
      lobby,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong!",
    });
  }
}

async function getPlayers(req, res) {
  try {
    const lobby = await lobbyModel
      .findOne({ code: req.params.code })
      .populate("members.user", "username avatar")
      .populate("leader", "username");

    if (!lobby) {
      return res.status(404).json({ error: "Lobby not found" });
    }

    res.json({
      code: lobby.code,
      leader: lobby.leader,
      members: lobby.members,
      status: lobby.status,
      settings: lobby.settings,
      levelInfo: lobby.settings.level,
      currentRace: lobby.currentRace,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function toggleReadyController(req, res) {
  try {
    const { code } = req.params;
    const lobby = await lobbyModel.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }
    if (lobby.status !== "waiting" && lobby.status !== "ready") {
      return res.status(400).json({
        message: "Cannot change ready status after race has started",
      });
    }
    const member = lobby.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member) {
      return res.status(400).json({
        message: "You are not part of this lobby",
      });
    }
    // Toggle ready
    member.isReady = !member.isReady;
    // Check if all members ready
    const allReady = lobby.members.every((m) => m.isReady === true);
    if (allReady && lobby.members.length >= 2) {
      lobby.status = "ready";
    } else {
      lobby.status = "waiting";
    }

    await lobby.save();

    res.status(200).json({
      message: "Ready status updated",
      lobby,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
}

async function startRaceController(req, res) {
  try {
    const { code } = req.params;
    const lobby = await lobbyModel.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }
    // Only leader can start
    if (lobby.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only leader can start the race",
      });
    }
    const allReady = lobby.members.length > 0 && lobby.members.every(m => m.isReady);
    if (!allReady) {
      return res.status(400).json({
        message: "All players must be ready",
      });
    }
    if (lobby.members.length < 1) {
      return res.status(400).json({
        message: "At least 1 player required",
      });
    }
    // Generate questions for the race
    const totalLaps = 2;
    const generatedQuestions = await generateQuestionsForRace(
      lobby.settings.language,
      lobby.settings.level,
      totalLaps
    );
    // Create Race
    const race = await raceModel.create({
      lobby: lobby._id,
      players: lobby.members.map((m) => ({
        user: m.user,
        completed: false,
        finishTime: null,
        submissions: 0,
        score: 0,
      })),
      questions: generatedQuestions,
      settings: { language: lobby.settings.language, level: lobby.settings.level, totalLaps },
      startTime: new Date(),
      status: "ongoing",
    });
    // Update lobby
    lobby.status = "racing";
    lobby.currentRace = race._id;
    await lobby.save();

    res.status(200).json({
      message: "Race started successfully",
      race,
    });

  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
}

async function updateSettingsController(req, res) {
  try {
    const { code } = req.params;
    const { language, level } = req.body;
    const lobby = await lobbyModel.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }
    // Only leader can update settings
    if (lobby.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the leader can change settings" });
    }
    // Validate language
    const validLanguages = ["C", "Python", "Java", "JavaScript"];
    if (language !== undefined && !validLanguages.includes(language)) {
      return res.status(400).json({ message: "Invalid language" });
    }
    // Validate level
    if (level !== undefined && (level < 1 || level > 5)) {
      return res.status(400).json({ message: "Level must be between 1 and 5" });
    }
    if (language !== undefined) lobby.settings.language = language;
    if (level !== undefined) lobby.settings.level = level;
    await lobby.save();
    res.status(200).json({
      message: "Settings updated successfully",
      settings: {
        language: lobby.settings.language,
        level: lobby.settings.level,
        maxPlayers: lobby.settings.maxPlayers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
}
module.exports = {
  createLobbyController,
  joinLobbyController,
  exitLobbyController,
  getPlayers,
  toggleReadyController,
  startRaceController,
  updateSettingsController
};

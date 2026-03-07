const Race = require('../models/race.model');
const User = require('../models/User.model');
const { generateQuestionsForRace } = require('../services/questionService');

// @desc    Get race status
// @route   GET /api/race/:raceId
exports.getRace = async (req, res) => {
  try {
    const race = await Race.findById(req.params.raceId)
      .populate('questions.question')
      .populate('players.user', 'username avatar');
    
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    res.json(race);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Submit answer
// @route   POST /api/race/:raceId/answer
exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer, responseTime } = req.body;
    const race = await Race.findById(req.params.raceId)
      .populate('questions.question');
    
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    const question = race.questions.find(
      q => q.question._id.toString() === questionId
    );
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = question.question.correctAnswer === answer;
    
    // Update player stats in race
    const playerIndex = race.players.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (playerIndex !== -1) {
      race.players[playerIndex].submissions += 1;
      if (isCorrect) {
        race.players[playerIndex].score += 1;
      }
    }
    
    await race.save();
    
    res.json({
      isCorrect,
      correctAnswer: question.question.correctAnswer,
      explanation: question.question.explanation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Finish race for player
// @route   POST /api/race/:raceId/finish
exports.finishRace = async (req, res) => {
  try {
    const race = await Race.findById(req.params.raceId);
    
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    const playerIndex = race.players.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (playerIndex !== -1 && !race.players[playerIndex].completed) {
      race.players[playerIndex].completed = true;
      race.players[playerIndex].finishTime = new Date();

      // Set winner if first to finish
      if (!race.winner) {
        race.winner = req.user._id;
      }

      // Check if all players finished
      const allFinished = race.players.every(p => p.completed);
      if (allFinished) {
        race.status = 'finished';
        race.endTime = new Date();
      }

      await race.save();
    }

    res.json({ race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get race results
// @route   GET /api/race/:raceId/results
exports.getRaceResults = async (req, res) => {
  try {
    const race = await Race.findById(req.params.raceId)
      .populate('players.user', 'username avatar')
      .populate('winner', 'username avatar');

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const results = [...race.players].sort((a, b) => {
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      if (a.completed && b.completed) {
        return new Date(a.finishTime) - new Date(b.finishTime);
      }
      return b.score - a.score;
    }).map((player, idx) => ({
      rank: idx + 1,
      user: player.user,
      score: player.score,
      submissions: player.submissions,
      completed: player.completed,
      finishTime: player.finishTime,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
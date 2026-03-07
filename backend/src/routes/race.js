const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser.middleware');
const raceController = require('../controllers/raceController');

// Test route (no auth required)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Race route working!', 
    timestamp: new Date() 
  });
});

// Get race by ID
router.get('/:raceId', authenticateUser, raceController.getRace);

// Submit answer
router.post('/:raceId/answer', authenticateUser, raceController.submitAnswer);

// Finish race
router.post('/:raceId/finish', authenticateUser, raceController.finishRace);

// Get race results
router.get('/:raceId/results', authenticateUser, raceController.getRaceResults);

module.exports = router;
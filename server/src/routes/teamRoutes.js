const express = require('express');
const router = express.Router();
const {
  getMyTeam,
  getTeamsByRoom,
  getTeamById,
  updateTeam,
  swapPlayer,
  configureSquadLimits,
  getTeamTactics,
  updateTeamTactics
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// Get current user's team (supports ?room=CRIC-XXXX)
router.get('/my', protect, getMyTeam);

// Get all franchise teams in a room (accessible to spectators & players)
router.get('/room/:roomCode', getTeamsByRoom);

// Host configures squad limits
router.put('/room/:roomCode/squad-limits', protect, configureSquadLimits);

// Specific team routes
router.get('/:id', getTeamById);
router.put('/:id', protect, updateTeam);
router.post('/:id/swap', protect, swapPlayer);

// Team Tactics routes
router.get('/:id/tactics', getTeamTactics);
router.put('/:id/tactics', protect, updateTeamTactics);

module.exports = router;

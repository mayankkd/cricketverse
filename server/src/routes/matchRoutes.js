const express = require('express');
const router = express.Router();
const {
  getMatches,
  getMatchById,
  getMatchTactics,
  updateMatchTactics,
  simulateBall
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/tactics', getMatchTactics);
router.put('/:id/tactics', protect, updateMatchTactics);
router.post('/:id/simulate-ball', simulateBall);

module.exports = router;


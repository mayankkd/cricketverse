const express = require('express');
const router = express.Router();
const {
  getMatches,
  getMatchById,
  getMatchTactics,
  updateMatchTactics,
  simulateBall,
  playDelivery,
  joinMatch,
  getMatchSnapshot,
  syncMatch,
  submitBowlingDecision,
  submitBattingDecision
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/snapshot', getMatchSnapshot);
router.get('/:id/sync', syncMatch);
router.get('/:id/tactics', getMatchTactics);
router.put('/:id/tactics', protect, updateMatchTactics);
router.post('/:id/join', joinMatch);
router.post('/:id/bowling-decision', submitBowlingDecision);
router.post('/:id/batting-decision', submitBattingDecision);
router.post('/:id/simulate-ball', simulateBall);
router.post('/:id/play-delivery', playDelivery);

module.exports = router;


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
  submitBattingDecision,
  declareInnings,
  enforceFollowOn,
  callTacticalTimeout,
  resumeTacticalTimeout,
  applyDLSRevision,
  setStadiumAndConditions,
  getMatchAnalytics,
  setCommentaryPersonality,
  comparePlayers
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/snapshot', getMatchSnapshot);
router.get('/:id/sync', syncMatch);
router.get('/:id/analytics', getMatchAnalytics);
router.get('/:id/compare-players', comparePlayers);
router.post('/:id/personality', setCommentaryPersonality);
router.get('/:id/tactics', getMatchTactics);
router.put('/:id/tactics', protect, updateMatchTactics);
router.post('/:id/join', joinMatch);
router.post('/:id/bowling-decision', submitBowlingDecision);
router.post('/:id/batting-decision', submitBattingDecision);
router.post('/:id/simulate-ball', simulateBall);
router.post('/:id/play-delivery', playDelivery);
router.post('/:id/declare', declareInnings);
router.post('/:id/follow-on', enforceFollowOn);
router.post('/:id/timeout', callTacticalTimeout);
router.post('/:id/timeout/resume', resumeTacticalTimeout);
router.post('/:id/dls', applyDLSRevision);
router.post('/:id/conditions', setStadiumAndConditions);

module.exports = router;


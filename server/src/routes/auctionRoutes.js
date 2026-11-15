const express = require('express');
const router = express.Router();
const {
  getAuctionState,
  initAuction,
  nominatePlayer,
  nominateRandom,
  placeBid,
  useT2Veto,
  hammerLot,
  startUnsoldRound,
  updateSettings
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

// Live auction state (accessible to participants and spectators)
router.get('/:roomCode/state', getAuctionState);

// Host operations
router.post('/:roomCode/init', protect, initAuction);
router.post('/:roomCode/hammer', protect, hammerLot);
router.post('/:roomCode/unsold-round', protect, startUnsoldRound);
router.put('/:roomCode/settings', protect, updateSettings);

// Player franchise manager operations (strictly blocked for spectators)
router.post('/:roomCode/nominate', protect, nominatePlayer);
router.post('/:roomCode/nominate-random', protect, nominateRandom);
router.post('/:roomCode/bid', protect, placeBid);
router.post('/:roomCode/veto', protect, useT2Veto);

module.exports = router;

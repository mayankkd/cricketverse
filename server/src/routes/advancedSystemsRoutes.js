const express = require('express');
const router = express.Router();
const {
  trainPlayerController,
  recoverPlayerController,
  getPlayerDevelopment,
  getTeamChemistry,
  getOpponentScouting,
  getMatchDocumentary,
  getDrsReview,
  getAuctionAwards,
  getVoiceChatToken
} = require('../controllers/advancedSystemsController');

// Player Development & Training
router.post('/players/:id/train', trainPlayerController);
router.post('/players/:id/recover', recoverPlayerController);
router.get('/players/:id/development', getPlayerDevelopment);

// Team Chemistry & Partnerships
router.get('/teams/:id/chemistry', getTeamChemistry);

// Scouting & Opponent Analysis
router.get('/teams/:id/scouting/:opponentId', getOpponentScouting);

// Match Documentary Generator
router.get('/matches/:id/documentary', getMatchDocumentary);

// DRS / UltraEdge Snickometer Simulation
router.get('/matches/:id/drs-review', getDrsReview);

// Auction Awards
router.get('/auction/:roomCode/awards', getAuctionAwards);

// WebRTC Voice Chat Token
router.post('/matches/:id/voice/token', getVoiceChatToken);

module.exports = router;

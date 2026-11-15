const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  previewInvitation,
  joinByInvite,
  generateInvitation,
  revokeInvitation,
  updateRoomSettings,
  kickParticipant,
  startRoomGame,
  toggleReady,
  sendChatMessage,
  placeBidAction,
  nominateAction,
  lineupAction
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { validateCreateRoom } = require('../middleware/validationMiddleware');

// Public room listings & invitation preview
router.get('/', getRooms);
router.get('/invitation/:token', previewInvitation);
router.post('/join-invite/:token', protect, joinByInvite);

// Room details & creation
router.get('/:roomCode', getRoom);
router.post('/', protect, validateCreateRoom, createRoom);

// Join room as Player or Spectator
router.post('/:roomCode/join', protect, joinRoom);

// Host controls & invitation management
router.post('/:roomCode/invitations', protect, generateInvitation);
router.post('/:roomCode/invitations/revoke', protect, revokeInvitation);
router.put('/:roomCode/settings', protect, updateRoomSettings);
router.delete('/:roomCode/participants/:userId', protect, kickParticipant);
router.post('/:roomCode/start', protect, startRoomGame);

// Participant interactions
router.put('/:roomCode/ready', protect, toggleReady);
router.post('/:roomCode/chat', protect, sendChatMessage);

// Player-only actions (strictly blocked for spectators)
router.post('/:roomCode/bid', protect, placeBidAction);
router.post('/:roomCode/nominate', protect, nominateAction);
router.put('/:roomCode/lineup', protect, lineupAction);

module.exports = router;

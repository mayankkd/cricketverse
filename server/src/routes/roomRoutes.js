const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  sendChatMessage,
  toggleReady
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { validateCreateRoom } = require('../middleware/validationMiddleware');

router.get('/', getRooms);
router.get('/:roomCode', getRoom);
router.post('/', protect, validateCreateRoom, createRoom);
router.post('/:roomCode/join', protect, joinRoom);
router.post('/:roomCode/chat', protect, sendChatMessage);
router.put('/:roomCode/ready', protect, toggleReady);

module.exports = router;


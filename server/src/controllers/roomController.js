const storeService = require('../services/storeService');

// @desc    Get all public rooms
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res, next) => {
  try {
    const rooms = await storeService.getAllRooms();
    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get room by code
// @route   GET /api/rooms/:roomCode
// @access  Public
const getRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await storeService.getRoomByCode(roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with code '${roomCode}' not found.`
      });
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new multiplayer room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name, format, maxTeams, budgetPerTeam, isPrivate, password, teamName } = req.body;
    const user = req.user;

    const roomCode = `CRIC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRoom = await storeService.createRoom({
      roomCode,
      name,
      hostId: user._id,
      hostUsername: user.username,
      status: 'waiting',
      format: format || 'T20',
      maxTeams: maxTeams || 8,
      budgetPerTeam: budgetPerTeam || 1000000000,
      isPrivate: Boolean(isPrivate),
      password: password || '',
      participants: [
        {
          userId: user._id,
          username: user.username,
          teamName: teamName || `${user.username}'s XI`,
          isReady: true,
          isHost: true,
          budgetRemaining: budgetPerTeam || 1000000000,
          squad: []
        }
      ],
      chatMessages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'System',
          text: `Room created by ${user.username}. Waiting for managers to join.`,
          timestamp: new Date()
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Multiplayer room established.',
      room: newRoom
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Join existing room
// @route   POST /api/rooms/:roomCode/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { password, teamName } = req.body;
    const user = req.user;

    const room = await storeService.getRoomByCode(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.'
      });
    }

    if (room.isPrivate && room.password && room.password !== password) {
      return res.status(403).json({
        success: false,
        message: 'Incorrect room password.'
      });
    }

    const existingParticipant = room.participants.find(p => p.userId === user._id);
    if (existingParticipant) {
      return res.status(200).json({
        success: true,
        message: 'Already joined this room.',
        room
      });
    }

    if (room.participants.length >= room.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'This room is currently full.'
      });
    }

    const newParticipant = {
      userId: user._id,
      username: user.username,
      teamName: teamName || `${user.username}'s XI`,
      isReady: false,
      isHost: false,
      budgetRemaining: room.budgetPerTeam,
      squad: []
    };

    const updatedParticipants = [...room.participants, newParticipant];
    const updatedMessages = [
      ...(room.chatMessages || []),
      {
        id: `msg_${Date.now()}`,
        sender: 'System',
        text: `${user.username} entered the dugout.`,
        timestamp: new Date()
      }
    ];

    const updated = await storeService.updateRoom(roomCode, {
      participants: updatedParticipants,
      chatMessages: updatedMessages
    });

    res.status(200).json({
      success: true,
      message: 'Successfully entered room.',
      room: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send chat message in room
// @route   POST /api/rooms/:roomCode/chat
// @access  Private
const sendChatMessage = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    const updatedRoom = await storeService.addRoomChatMessage(roomCode, {
      sender: req.user.username,
      text: text.trim()
    });

    res.status(200).json({
      success: true,
      room: updatedRoom
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle participant ready status
// @route   PUT /api/rooms/:roomCode/ready
// @access  Private
const toggleReady = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const user = req.user;

    const room = await storeService.getRoomByCode(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const participants = room.participants.map(p => {
      if (p.userId === user._id) {
        return { ...p, isReady: !p.isReady };
      }
      return p;
    });

    const updated = await storeService.updateRoom(roomCode, { participants });

    res.status(200).json({
      success: true,
      room: updated
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  sendChatMessage,
  toggleReady
};


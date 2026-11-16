const storeService = require('../services/storeService');
const { getStadiumById } = require('../data/stadiumsData');

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
    const {
      name,
      format,
      budgetPerTeam,
      isPrivate,
      password,
      teamName,
      stadiumId,
      stadium,
      allowSpectators,
      allowPlayerJoining,
      spectatorChatEnabled
    } = req.body;
    const user = req.user;

    const roomCode = `CRIC-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomFormat = format || 'T20';
    const purse = budgetPerTeam !== undefined ? Number(budgetPerTeam) : storeService.getFormatPurse(roomFormat);
    const selectedStadiumId = stadiumId || 'lords';
    const selectedStadium = stadium || getStadiumById(selectedStadiumId);

    const newRoom = await storeService.createRoom({
      roomCode,
      name,
      hostId: user._id,
      hostUsername: user.username,
      status: 'waiting',
      format: roomFormat,
      minPlayers: 2,
      maxPlayers: 6,
      maxTeams: 6,
      budgetPerTeam: purse,
      stadiumId: selectedStadiumId,
      stadium: selectedStadium,
      isPrivate: Boolean(isPrivate),
      password: password || '',
      allowSpectators: allowSpectators !== undefined ? Boolean(allowSpectators) : true,
      allowPlayerJoining: allowPlayerJoining !== undefined ? Boolean(allowPlayerJoining) : true,
      spectatorChatEnabled: spectatorChatEnabled !== undefined ? Boolean(spectatorChatEnabled) : true,
      participants: [
        {
          userId: user._id,
          username: user.username,
          role: 'player',
          teamName: teamName || `${user.username}'s XI`,
          isReady: true,
          isHost: true,
          isConnected: true,
          t2VetoTokens: 2,
          vetoedPlayers: [],
          budgetRemaining: purse,
          squad: []
        }
      ],
      chatMessages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'System',
          senderRole: 'system',
          text: `Arena created by ${user.username}. Waiting for franchise managers to assemble (Min 2, Max 6).`,
          timestamp: new Date()
        }
      ]
    });

    const roomPayload = {
      ...newRoom,
      _id: String(newRoom._id || newRoom.id),
      roomCode: newRoom.roomCode,
      name: newRoom.name,
      format: newRoom.format,
      auctionPurse: newRoom.auctionPurse || newRoom.budgetPerTeam || purse,
      budgetPerTeam: newRoom.budgetPerTeam || purse,
      stadium: newRoom.stadium,
      stadiumId: newRoom.stadiumId,
      minPlayers: newRoom.minPlayers || 2,
      maxPlayers: newRoom.maxPlayers || 6
    };

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: roomPayload
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Join existing room as Player or Spectator
// @route   POST /api/rooms/:roomCode/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { role = 'player', teamName, password, inviteToken } = req.body;
    const user = req.user;

    const result = await storeService.joinRoomWithRole({
      roomCode,
      user,
      role,
      teamName,
      password,
      inviteToken
    });

    const io = req.app.get('io');
    if (io) {
      const code = (result.room?.roomCode || preview?.roomCode || '').toUpperCase();
      io.to(code).emit('room_state', result.room);
      io.to(code).emit('room_notification', {
        type: 'USER_JOINED',
        text: `${user.username} entered the arena as ${role.toUpperCase()}.`
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      room: result.room,
      participant: result.participant,
      reconnected: result.reconnected
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'JOIN_ERROR',
        message: err.message,
        canJoinAsSpectator: err.canJoinAsSpectator !== undefined ? err.canJoinAsSpectator : true
      });
    }
    next(err);
  }
};

// @desc    Preview room via Invitation Token
// @route   GET /api/rooms/invitation/:token
// @access  Public
const previewInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const preview = await storeService.getRoomByInviteToken(token);
    res.status(200).json({
      success: true,
      room: preview
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'INVITE_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Join room via Invitation Token
// @route   POST /api/rooms/join-invite/:token
// @access  Private
const joinByInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { role = 'player', teamName, password } = req.body;
    const user = req.user;

    const preview = await storeService.getRoomByInviteToken(token);
    const result = await storeService.joinRoomWithRole({
      roomCode: preview.roomCode,
      user,
      role,
      teamName,
      password,
      inviteToken: token
    });

    const io = req.app.get('io');
    if (io) {
      const code = (result.room?.roomCode || preview?.roomCode || '').toUpperCase();
      io.to(code).emit('room_state', result.room);
      io.to(code).emit('room_notification', {
        type: 'USER_JOINED',
        text: `${user.username} entered the arena as ${role.toUpperCase()}.`
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      room: result.room,
      participant: result.participant,
      reconnected: result.reconnected
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'JOIN_ERROR',
        message: err.message,
        canJoinAsSpectator: err.canJoinAsSpectator !== undefined ? err.canJoinAsSpectator : true
      });
    }
    next(err);
  }
};

// @desc    Generate / Regenerate invitation link
// @route   POST /api/rooms/:roomCode/invitations
// @access  Private (Host only)
const generateInvitation = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { expiresInHours, password } = req.body;
    const result = await storeService.generateInvitation(roomCode, req.user._id, {
      expiresInHours: expiresInHours ? Number(expiresInHours) : null,
      password: password || ''
    });

    res.status(200).json({
      success: true,
      message: 'Invitation generated successfully.',
      invitation: result.invitation,
      room: result.room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// @desc    Revoke active invitation link
// @route   POST /api/rooms/:roomCode/invitations/revoke
// @access  Private (Host only)
const revokeInvitation = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const result = await storeService.revokeInvitation(roomCode, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
      room: result.room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// @desc    Update host room settings
// @route   PUT /api/rooms/:roomCode/settings
// @access  Private (Host only)
const updateRoomSettings = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const updated = await storeService.updateRoomSettings(roomCode, req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Room settings updated.',
      room: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// @desc    Kick / Remove participant
// @route   DELETE /api/rooms/:roomCode/participants/:userId
// @access  Private (Host only)
const kickParticipant = async (req, res, next) => {
  try {
    const { roomCode, userId } = req.params;
    const updated = await storeService.kickParticipant(roomCode, req.user._id, userId);

    res.status(200).json({
      success: true,
      message: 'Participant removed from arena.',
      room: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// @desc    Start auction or match (strictly validates minimum 2 active players)
// @route   POST /api/rooms/:roomCode/start
// @access  Private (Host only)
const startRoomGame = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const updated = await storeService.startRoomGame(roomCode, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Arena game launched successfully!',
      room: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'START_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Toggle participant ready status (players only)
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

    const participant = (room.participants || []).find(p => p.userId === user._id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'You are not in this room.' });
    }

    if (participant.role === 'spectator') {
      return res.status(403).json({
        success: false,
        code: 'SPECTATOR_ACTION_FORBIDDEN',
        message: 'Spectators do not have ready status.'
      });
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

    const room = await storeService.getRoomByCode(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const participant = (room.participants || []).find(p => p.userId === req.user._id);
    if (participant?.role === 'spectator' && room.spectatorChatEnabled === false) {
      return res.status(403).json({
        success: false,
        code: 'SPECTATOR_CHAT_DISABLED',
        message: 'Spectator chat has been disabled by the host.'
      });
    }

    const senderRole = participant ? participant.role : 'spectator';

    const updatedRoom = await storeService.addRoomChatMessage(roomCode, {
      sender: req.user.username,
      senderRole,
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

// @desc    Place Bid (Player role only)
// @route   POST /api/rooms/:roomCode/bid
// @access  Private
const placeBidAction = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { amount } = req.body;

    // SPECTATOR PERMISSION ENFORCEMENT:
    await storeService.verifyPlayerActionPermission(roomCode, req.user._id, 'place bid');

    const updatedRoom = await storeService.placeAuctionBid(roomCode, req.user._id, { amount });

    res.status(200).json({
      success: true,
      message: 'Bid placed successfully.',
      currentLot: updatedRoom.auctionState?.currentLot,
      bidHistory: updatedRoom.auctionState?.bidHistory,
      room: updatedRoom
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'ACTION_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Nominate Player (Player role only)
// @route   POST /api/rooms/:roomCode/nominate
// @access  Private
const nominateAction = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { cardId, playerId } = req.body;

    // SPECTATOR PERMISSION ENFORCEMENT:
    await storeService.verifyPlayerActionPermission(roomCode, req.user._id, 'nominate player');

    const updatedRoom = await storeService.nominatePlayerForAuction(roomCode, req.user._id, {
      cardId,
      playerId
    });

    res.status(200).json({
      success: true,
      message: 'Player nominated for auction.',
      currentLot: updatedRoom.auctionState?.currentLot,
      room: updatedRoom
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'ACTION_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Update Lineup / Tactics (Player role only)
// @route   PUT /api/rooms/:roomCode/lineup
// @access  Private
const lineupAction = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { playingXI, captainId } = req.body;

    // SPECTATOR PERMISSION ENFORCEMENT:
    await storeService.verifyPlayerActionPermission(roomCode, req.user._id, 'modify lineup or tactics');

    res.status(200).json({
      success: true,
      message: 'Lineup updated successfully.',
      playingXI,
      captainId
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'ACTION_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

module.exports = {
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
};

const { isMongoConnected } = require('../config/db');
const User = require('../models/User');
const Player = require('../models/Player');
const Room = require('../models/Room');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const {
  initialUsers,
  initialPlayers,
  initialRooms,
  initialTeams,
  initialMatches,
  initialTournaments
} = require('../data/seedData');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Room concurrency locks to prevent race conditions during joins
const roomLocks = new Map();
const withRoomLock = async (roomCode, fn) => {
  const key = (roomCode || '').toUpperCase();
  while (roomLocks.get(key)) {
    try {
      await roomLocks.get(key);
    } catch {
      // Ignore previous errors
    }
  }
  let resolveLock;
  const promise = new Promise((resolve) => { resolveLock = resolve; });
  roomLocks.set(key, promise);
  try {
    return await fn();
  } finally {
    roomLocks.delete(key);
    resolveLock();
  }
};

// Compute dynamic metrics: capacity, spectator counts, canStart flag
const computeRoomMetrics = (room) => {
  if (!room) return null;
  const doc = (typeof room.toObject === 'function') ? room.toObject() : { ...room };
  const participants = doc.participants || [];
  const activePlayers = participants.filter(p => p.role === 'player');
  const spectators = participants.filter(p => p.role === 'spectator');

  doc.minPlayers = 2; // Fixed minimum: at least 2 active players to start
  doc.maxPlayers = 6; // Fixed capacity: never allow more than 6 active players
  doc.maxTeams = 6;
  doc.activePlayersCount = activePlayers.length;
  doc.spectatorsCount = spectators.length;
  doc.availablePlayerSlots = Math.max(0, 6 - activePlayers.length);
  doc.canStart = activePlayers.length >= 2;
  doc.canJoinAsPlayer = activePlayers.length < 6 && doc.allowPlayerJoining !== false;
  doc.canJoinAsSpectator = doc.allowSpectators !== false;
  return doc;
};

// Memory store fallback
const memoryStore = {
  users: [...initialUsers.map(u => ({ ...u }))],
  players: [...initialPlayers.map(p => ({ ...p }))],
  rooms: [...initialRooms.map(r => ({ ...r, participants: [...r.participants], chatMessages: [...r.chatMessages] }))],
  teams: [...initialTeams.map(t => ({ ...t }))],
  matches: [...initialMatches.map(m => ({ ...m }))],
  tournaments: [...initialTournaments.map(t => ({ ...t }))]
};

// Seed Mongo when connected
const seedMongoIfEmpty = async () => {
  if (!isMongoConnected()) return;
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[CricketVerse Seed] Seeding MongoDB with initial data...');
      await User.insertMany(initialUsers);
      await Player.insertMany(initialPlayers);
      await Room.insertMany(initialRooms);
      await Team.insertMany(initialTeams);
      await Match.insertMany(initialMatches);
      await Tournament.insertMany(initialTournaments);
      console.log('[CricketVerse Seed] Seeding completed successfully.');
    }
  } catch (err) {
    console.error('[CricketVerse Seed] Error seeding MongoDB:', err.message);
  }
};

// User operations
const findUserByEmail = async (email, includePassword = false) => {
  if (isMongoConnected()) {
    const q = User.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+password');
    return await q.exec();
  }
  const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (!includePassword) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
  return user;
};

const findUserById = async (id) => {
  if (isMongoConnected()) {
    return await User.findById(id).exec();
  }
  const user = memoryStore.users.find(u => u._id === id);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const findUserByUsername = async (username) => {
  if (isMongoConnected()) {
    return await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).exec();
  }
  return memoryStore.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
};

const createUser = async (userData) => {
  if (isMongoConnected()) {
    const newUser = new User(userData);
    return await newUser.save();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const newUser = {
    _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: userData.username,
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    role: 'user',
    avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    favoriteTeam: userData.favoriteTeam || 'Royal Challengers Bengaluru',
    budget: 1000000000,
    tier: 'Rookie',
    level: 1,
    xp: 100,
    rating: 1200,
    stats: {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      winRate: 0,
      tournamentsWon: 0,
      highestScore: 0,
      totalRuns: 0,
      totalWickets: 0,
      auctionsWon: 0
    },
    preferences: {
      soundEnabled: true,
      commentaryLanguage: 'English (Harsha & Ravi)',
      graphicsQuality: 'Ultra HDR',
      simulationSpeed: 'Normal (1x)',
      pushNotifications: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.users.push(newUser);
  const { password, ...safeUser } = newUser;
  return safeUser;
};

const updateUser = async (id, updateFields) => {
  if (isMongoConnected()) {
    return await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const idx = memoryStore.users.findIndex(u => u._id === id);
  if (idx === -1) return null;
  memoryStore.users[idx] = {
    ...memoryStore.users[idx],
    ...updateFields,
    updatedAt: new Date()
  };
  const { password, ...safeUser } = memoryStore.users[idx];
  return safeUser;
};

// Player operations
const getAllPlayers = async (filters = {}) => {
  if (isMongoConnected()) {
    const query = {};
    if (filters.role && filters.role !== 'All') query.role = filters.role;
    if (filters.cardTier && filters.cardTier !== 'All') query.cardTier = filters.cardTier;
    if (filters.cardVariant && filters.cardVariant !== 'All') query.cardVariant = filters.cardVariant;
    if (filters.country && filters.country !== 'All') query.country = filters.country;
    
    // Strict format eligibility filter
    if (filters.format && filters.format !== 'All') {
      const fmtKey = filters.format.toLowerCase();
      if (['test', 'odi', 't20'].includes(fmtKey)) {
        query[`formatEligibility.${fmtKey}`] = true;
      }
    }

    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      query.$or = [{ name: regex }, { shortName: regex }, { country: regex }];
    }

    let sortOptions = { overallRating: -1 };
    if (filters.sortBy === 'test') sortOptions = { 'ovr.test': -1, overallRating: -1 };
    else if (filters.sortBy === 'odi') sortOptions = { 'ovr.odi': -1, overallRating: -1 };
    else if (filters.sortBy === 't20') sortOptions = { 'ovr.t20': -1, overallRating: -1 };
    else if (filters.sortBy === 'bat') sortOptions = { 'attributes.batting': -1 };
    else if (filters.sortBy === 'bwl') sortOptions = { 'attributes.bowling': -1 };
    else if (filters.sortBy === 'name') sortOptions = { name: 1 };

    return await Player.find(query).sort(sortOptions);
  }

  let players = [...memoryStore.players];
  if (filters.role && filters.role !== 'All') {
    players = players.filter(p => p.role.toLowerCase() === filters.role.toLowerCase());
  }
  if (filters.cardTier && filters.cardTier !== 'All') {
    players = players.filter(p => p.cardTier.toLowerCase() === filters.cardTier.toLowerCase());
  }
  if (filters.cardVariant && filters.cardVariant !== 'All') {
    players = players.filter(p => p.cardVariant?.toLowerCase() === filters.cardVariant.toLowerCase());
  }
  if (filters.country && filters.country !== 'All') {
    players = players.filter(p => p.country.toLowerCase() === filters.country.toLowerCase());
  }
  if (filters.format && filters.format !== 'All') {
    const fmtKey = filters.format.toLowerCase();
    if (['test', 'odi', 't20'].includes(fmtKey)) {
      players = players.filter(p => p.formatEligibility && p.formatEligibility[fmtKey] === true);
    }
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    players = players.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.shortName.toLowerCase().includes(term) ||
      p.country.toLowerCase().includes(term)
    );
  }

  // Format and attribute sorting
  if (filters.sortBy === 'test') {
    players.sort((a, b) => (b.ovr?.test || 0) - (a.ovr?.test || 0));
  } else if (filters.sortBy === 'odi') {
    players.sort((a, b) => (b.ovr?.odi || 0) - (a.ovr?.odi || 0));
  } else if (filters.sortBy === 't20') {
    players.sort((a, b) => (b.ovr?.t20 || 0) - (a.ovr?.t20 || 0));
  } else if (filters.sortBy === 'bat') {
    players.sort((a, b) => (b.attributes?.batting || b.stats?.bat || 0) - (a.attributes?.batting || a.stats?.bat || 0));
  } else if (filters.sortBy === 'bwl') {
    players.sort((a, b) => (b.attributes?.bowling || b.stats?.bwl || 0) - (a.attributes?.bowling || a.stats?.bwl || 0));
  } else if (filters.sortBy === 'name') {
    players.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    players.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));
  }

  return players;
};

const getPlayerById = async (id) => {
  if (isMongoConnected()) {
    return await Player.findById(id);
  }
  return memoryStore.players.find(p => p._id === id || p.slug === id) || null;
};

const comparePlayers = async (id1, id2) => {
  const [player1, player2] = await Promise.all([
    getPlayerById(id1),
    getPlayerById(id2)
  ]);
  return { player1, player2 };
};

const getPlayerFilterMetadata = async () => {
  const players = isMongoConnected() ? await Player.find() : memoryStore.players;
  const countries = Array.from(new Set(players.map(p => p.country))).sort();
  const roles = ['Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'];
  const formats = ['Test', 'ODI', 'T20'];
  const variants = [
    'Peak',
    'Best',
    'Average',
    'Icon',
    'Legends',
    'World Cup',
    'All-Time Great',
    'Captain',
    'Clutch',
    'Anniversary'
  ];
  const tiers = ['ICON', 'DIAMOND', 'GOLD', 'SILVER', 'EMERGING'];

  return { countries, roles, formats, variants, tiers, totalPlayers: players.length };
};

// Room operations
const getAllRooms = async () => {
  if (isMongoConnected()) {
    const rooms = await Room.find().sort({ createdAt: -1 });
    return rooms.map(computeRoomMetrics);
  }
  return memoryStore.rooms.map(computeRoomMetrics);
};

const getRoomByCode = async (roomCode) => {
  if (!roomCode) return null;
  const code = roomCode.toUpperCase();
  if (isMongoConnected()) {
    const room = await Room.findOne({ roomCode: code });
    return room ? computeRoomMetrics(room) : null;
  }
  const room = memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);
  return room ? computeRoomMetrics(room) : null;
};

const getRoomByInviteToken = async (token) => {
  if (!token) return null;
  let room = null;
  if (isMongoConnected()) {
    room = await Room.findOne({ 'invitation.token': token });
  } else {
    room = memoryStore.rooms.find(r => r.invitation?.token === token);
  }

  if (!room) {
    const err = new Error('Invalid or non-existent invitation link.');
    err.status = 404;
    err.code = 'INVITE_NOT_FOUND';
    throw err;
  }

  if (room.invitation?.isRevoked) {
    const err = new Error('This invitation link has been revoked by the host.');
    err.status = 410;
    err.code = 'INVITE_REVOKED';
    throw err;
  }

  if (room.invitation?.expiresAt && new Date() > new Date(room.invitation.expiresAt)) {
    const err = new Error('This invitation link has expired.');
    err.status = 410;
    err.code = 'INVITE_EXPIRED';
    throw err;
  }

  const metrics = computeRoomMetrics(room);
  return {
    ...metrics,
    invitation: room.invitation,
    requiresPassword: Boolean(room.invitation?.password || room.password)
  };
};

const createRoom = async (roomData) => {
  const token = `inv_${crypto.randomBytes(8).toString('hex')}`;
  const completeRoomData = {
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: 1000000000,
    allowSpectators: true,
    allowPlayerJoining: true,
    spectatorChatEnabled: true,
    ...roomData,
    roomCode: (roomData.roomCode || `CRIC-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
    invitation: roomData.invitation || {
      token,
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: roomData.password || ''
    }
  };

  if (isMongoConnected()) {
    const newRoom = new Room(completeRoomData);
    const saved = await newRoom.save();
    return computeRoomMetrics(saved);
  }

  const newRoom = {
    _id: `room_${Date.now()}`,
    ...completeRoomData,
    participants: completeRoomData.participants || [],
    chatMessages: completeRoomData.chatMessages || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.rooms.unshift(newRoom);
  return computeRoomMetrics(newRoom);
};

const updateRoom = async (roomCode, updateFields) => {
  const code = roomCode.toUpperCase();
  if (isMongoConnected()) {
    const updated = await Room.findOneAndUpdate({ roomCode: code }, { $set: updateFields }, { new: true });
    return updated ? computeRoomMetrics(updated) : null;
  }
  const idx = memoryStore.rooms.findIndex(r => r.roomCode.toUpperCase() === code);
  if (idx === -1) return null;
  memoryStore.rooms[idx] = {
    ...memoryStore.rooms[idx],
    ...updateFields,
    updatedAt: new Date()
  };
  return computeRoomMetrics(memoryStore.rooms[idx]);
};

// ATOMIC JOIN WITH ROLE: Fixed 6-Player Capacity, 7th Person Rule, Reconnection & Password Validation
const joinRoomWithRole = async ({ roomCode, user, role = 'player', teamName = '', password = '', inviteToken = '' }) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    let rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room with code '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    // Invitation validation if token supplied
    if (inviteToken) {
      if (!rawRoom.invitation || rawRoom.invitation.token !== inviteToken) {
        const err = new Error('Invalid invitation link for this room.');
        err.status = 400;
        err.code = 'INVALID_INVITE';
        throw err;
      }
      if (rawRoom.invitation.isRevoked) {
        const err = new Error('This invitation link has been revoked by the host.');
        err.status = 410;
        err.code = 'INVITE_REVOKED';
        throw err;
      }
      if (rawRoom.invitation.expiresAt && new Date() > new Date(rawRoom.invitation.expiresAt)) {
        const err = new Error('This invitation link has expired.');
        err.status = 410;
        err.code = 'INVITE_EXPIRED';
        throw err;
      }
      if (rawRoom.invitation.password && rawRoom.invitation.password !== password) {
        const err = new Error('Incorrect invitation password.');
        err.status = 403;
        err.code = 'INVALID_PASSWORD';
        throw err;
      }
    } else if (rawRoom.isPrivate && rawRoom.password && rawRoom.password !== password) {
      const err = new Error('Incorrect room password.');
      err.status = 403;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const participants = rawRoom.participants ? [...rawRoom.participants] : [];
    const activePlayersCount = participants.filter(p => p.role === 'player').length;
    const requestedRole = (role || 'player').toLowerCase();

    // Check existing participant for reconnection
    const existingIndex = participants.findIndex(p => p.userId === user._id);
    if (existingIndex !== -1) {
      const existing = participants[existingIndex];

      // Reconnecting user retains their role
      let finalRole = existing.role;

      // If user was spectator and specifically wants to upgrade to player:
      if (existing.role === 'spectator' && requestedRole === 'player') {
        if (activePlayersCount >= 6) {
          const err = new Error('All 6 player slots are occupied. You remain a spectator.');
          err.status = 400;
          err.code = 'PLAYER_SLOTS_FULL';
          err.canJoinAsSpectator = true;
          throw err;
        }
        finalRole = 'player';
      }

      participants[existingIndex] = {
        ...existing,
        role: finalRole,
        isConnected: true,
        teamName: finalRole === 'player'
          ? (teamName || existing.teamName || `${user.username}'s XI`)
          : (existing.teamName || 'Spectator Dugout')
      };

      const updated = await updateRoom(code, { participants });
      return {
        room: updated,
        participant: participants[existingIndex],
        reconnected: true,
        message: `Welcome back to the room as a ${finalRole}.`
      };
    }

    // Handling new participant joining:
    let newParticipantRole = requestedRole;

    if (requestedRole === 'player') {
      if (rawRoom.allowPlayerJoining === false) {
        const err = new Error('The host has closed new player registrations for this room.');
        err.status = 403;
        err.code = 'PLAYER_JOINING_DISABLED';
        throw err;
      }

      // FIXED CAPACITY & SEVENTH PERSON RULE:
      // If 6 active players exist, reject join as player and offer spectator mode
      if (activePlayersCount >= 6) {
        const err = new Error('All 6 player slots are occupied. You can join as a spectator.');
        err.status = 400;
        err.code = 'PLAYER_SLOTS_FULL';
        err.canJoinAsSpectator = rawRoom.allowSpectators !== false;
        throw err;
      }
    } else if (requestedRole === 'spectator') {
      if (rawRoom.allowSpectators === false) {
        const err = new Error('Spectator mode has been disabled for this room.');
        err.status = 403;
        err.code = 'SPECTATORS_DISABLED';
        throw err;
      }
      newParticipantRole = 'spectator';
    } else {
      const err = new Error(`Invalid role '${role}'. You must select JOIN AS PLAYER or JOIN AS SPECTATOR.`);
      err.status = 400;
      throw err;
    }

    const newParticipant = {
      userId: user._id,
      username: user.username,
      role: newParticipantRole,
      teamName: newParticipantRole === 'player'
        ? (teamName || `${user.username}'s XI`)
        : 'Spectator Dugout',
      isReady: false,
      isHost: false,
      isConnected: true,
      budgetRemaining: newParticipantRole === 'player' ? (rawRoom.budgetPerTeam || 1000000000) : 0,
      squad: [],
      joinedAt: new Date()
    };

    const updatedParticipants = [...participants, newParticipant];
    const systemMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'System',
      senderRole: 'system',
      text: `${user.username} entered the room as a ${newParticipantRole.toUpperCase()}.`,
      timestamp: new Date()
    };

    const updatedMessages = [...(rawRoom.chatMessages || []), systemMessage];

    const updatedRoom = await updateRoom(code, {
      participants: updatedParticipants,
      chatMessages: updatedMessages
    });

    return {
      room: updatedRoom,
      participant: newParticipant,
      reconnected: false,
      message: `Successfully joined as ${newParticipantRole}.`
    };
  });
};

// MINIMUM PLAYER REQUIREMENT VALIDATION & STARTING
const startRoomGame = async (roomCode, hostId) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error(`Room '${roomCode}' not found.`);
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can launch the arena.');
    err.status = 403;
    throw err;
  }

  const activePlayers = (room.participants || []).filter(p => p.role === 'player');

  // Must have at least 2 active players. Spectators never count toward minimum!
  if (activePlayers.length < 2) {
    const err = new Error(`Cannot start: Minimum 2 active players required (${activePlayers.length}/2). Spectators do not count toward player minimum.`);
    err.status = 400;
    err.code = 'INSUFFICIENT_PLAYERS';
    throw err;
  }

  const updatedMessages = [
    ...(room.chatMessages || []),
    {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: `Host ${room.hostUsername} launched the arena! Auction live now.`,
      timestamp: new Date()
    }
  ];

  return await updateRoom(code, {
    status: 'auction',
    chatMessages: updatedMessages
  });
};

// INVITATION MANAGEMENT: Generate, Regenerate, Revoke
const generateInvitation = async (roomCode, hostId, options = {}) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can manage invitations.');
    err.status = 403;
    throw err;
  }

  const token = `inv_${crypto.randomBytes(8).toString('hex')}`;
  const { expiresInHours, password } = options;

  const invitation = {
    token,
    createdAt: new Date(),
    expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : null,
    isRevoked: false,
    password: password || ''
  };

  const updated = await updateRoom(code, { invitation });
  return {
    invitation: updated.invitation,
    room: updated
  };
};

const revokeInvitation = async (roomCode, hostId) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can revoke invitations.');
    err.status = 403;
    throw err;
  }

  const invitation = {
    ...(room.invitation || {}),
    isRevoked: true
  };

  const updated = await updateRoom(code, { invitation });
  return {
    success: true,
    message: 'Active invitation link successfully revoked.',
    room: updated
  };
};

// HOST CONTROLS: Settings & Participant Removal
const updateRoomSettings = async (roomCode, hostId, settings) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can modify room settings.');
    err.status = 403;
    throw err;
  }

  const allowedFields = [
    'allowSpectators',
    'allowPlayerJoining',
    'spectatorChatEnabled',
    'isPrivate',
    'password',
    'format',
    'name'
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (settings[key] !== undefined) {
      updates[key] = settings[key];
    }
  }

  return await updateRoom(code, updates);
};

const kickParticipant = async (roomCode, hostId, targetUserId) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can remove participants.');
    err.status = 403;
    throw err;
  }

  if (targetUserId === hostId) {
    const err = new Error('Host cannot remove themselves from the room.');
    err.status = 400;
    throw err;
  }

  const target = (room.participants || []).find(p => p.userId === targetUserId);
  const updatedParticipants = (room.participants || []).filter(p => p.userId !== targetUserId);

  const updatedMessages = [
    ...(room.chatMessages || []),
    {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: `${target?.username || 'A participant'} was removed from the room by the host.`,
      timestamp: new Date()
    }
  ];

  return await updateRoom(code, {
    participants: updatedParticipants,
    chatMessages: updatedMessages
  });
};

// SPECTATOR PERMISSION ENFORCEMENT
const verifyPlayerActionPermission = async (roomCode, userId, actionName = 'player action') => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  const participant = (room.participants || []).find(p => p.userId === userId);
  if (!participant) {
    const err = new Error('User is not a participant in this room.');
    err.status = 403;
    throw err;
  }

  if (participant.role === 'spectator') {
    const err = new Error(`Forbidden: Spectators cannot perform player actions (${actionName}). Spectator mode is view-only.`);
    err.status = 403;
    err.code = 'SPECTATOR_ACTION_FORBIDDEN';
    throw err;
  }

  return { participant, room };
};

const addRoomChatMessage = async (roomCode, message) => {
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    ...message,
    timestamp: new Date()
  };
  if (isMongoConnected()) {
    return await Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { $push: { chatMessages: msg } },
      { new: true }
    );
  }
  const room = memoryStore.rooms.find(r => r.roomCode.toUpperCase() === roomCode.toUpperCase());
  if (!room) return null;
  if (!room.chatMessages) room.chatMessages = [];
  room.chatMessages.push(msg);
  return room;
};

// Team operations
const getTeams = async (ownerId) => {
  if (isMongoConnected()) {
    return ownerId ? await Team.find({ ownerId }) : await Team.find();
  }
  return ownerId ? memoryStore.teams.filter(t => t.ownerId === ownerId) : memoryStore.teams;
};

const getTeamById = async (id) => {
  if (isMongoConnected()) {
    return await Team.findById(id);
  }
  return memoryStore.teams.find(t => t._id === id) || null;
};

const updateTeam = async (id, updateFields) => {
  if (isMongoConnected()) {
    return await Team.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const idx = memoryStore.teams.findIndex(t => t._id === id);
  if (idx === -1) return null;
  memoryStore.teams[idx] = { ...memoryStore.teams[idx], ...updateFields, updatedAt: new Date() };
  return memoryStore.teams[idx];
};

// Match operations
const getMatches = async () => {
  if (isMongoConnected()) {
    return await Match.find().sort({ createdAt: -1 });
  }
  return memoryStore.matches;
};

const getMatchById = async (id) => {
  if (isMongoConnected()) {
    return await Match.findOne({ matchId: id });
  }
  return memoryStore.matches.find(m => m.matchId === id || m._id === id) || null;
};

// Tournament operations
const getTournaments = async () => {
  if (isMongoConnected()) {
    return await Tournament.find();
  }
  return memoryStore.tournaments;
};

const getTournamentById = async (id) => {
  if (isMongoConnected()) {
    return await Tournament.findOne({ tournamentId: id });
  }
  return memoryStore.tournaments.find(t => t.tournamentId === id || t._id === id) || null;
};

module.exports = {
  seedMongoIfEmpty,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  createUser,
  updateUser,
  getAllPlayers,
  getPlayerById,
  comparePlayers,
  getPlayerFilterMetadata,
  getAllRooms,
  getRoomByCode,
  createRoom,
  updateRoom,
  addRoomChatMessage,
  joinRoomWithRole,
  startRoomGame,
  generateInvitation,
  regenerateInvitation: generateInvitation,
  revokeInvitation,
  getRoomByInviteToken,
  updateRoomSettings,
  kickParticipant,
  verifyPlayerActionPermission,
  computeRoomMetrics,
  getTeams,
  getTeamById,
  updateTeam,
  getMatches,
  getMatchById,
  getTournaments,
  getTournamentById
};


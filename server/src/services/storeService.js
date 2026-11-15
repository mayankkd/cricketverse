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
const { getStadiumById } = require('../data/stadiumsData');

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
  doc.auctionPurse = doc.budgetPerTeam !== undefined ? doc.budgetPerTeam : getFormatPurse(doc.format);
  if (!doc._id && doc.id) doc._id = doc.id;
  doc.activePlayersCount = activePlayers.length;
  doc.activePlayerCount = activePlayers.length;
  doc.spectatorsCount = spectators.length;
  doc.spectatorCount = spectators.length;
  doc.availablePlayerSlots = Math.max(0, 6 - activePlayers.length);
  doc.canStart = activePlayers.length >= 2;
  doc.canJoinAsPlayer = activePlayers.length < 6 && doc.allowPlayerJoining !== false;
  doc.canJoinAsSpectator = doc.allowSpectators !== false;
  return doc;
};

// FIXED AUCTION PURSE: Test: 50 points, ODI: 40 points, T20: 30 points
const getFormatPurse = (format = 'T20') => {
  const fmt = (format || '').trim().toUpperCase();
  if (fmt === 'TEST') return 50;
  if (fmt === 'ODI') return 40;
  if (fmt === 'T20') return 30;
  return 30; // Default for 'The Hundred', 'Super Over', etc.
};

// Default Squad Limits: Test: 15, ODI: 15, T20: 13, Playing XI: 11
const getDefaultSquadLimits = (format = 'T20') => {
  const fmt = (format || '').toUpperCase();
  if (fmt === 'TEST') return { test: 15, odi: 15, t20: 13, maxSquadSize: 15, playingXISize: 11 };
  if (fmt === 'ODI') return { test: 15, odi: 15, t20: 13, maxSquadSize: 15, playingXISize: 11 };
  return { test: 15, odi: 15, t20: 13, maxSquadSize: 13, playingXISize: 11 };
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

const updatePlayer = async (id, updateFields) => {
  if (isMongoConnected()) {
    return await Player.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const idx = memoryStore.players.findIndex(p => p._id === id || p.slug === id);
  if (idx === -1) return null;
  memoryStore.players[idx] = {
    ...memoryStore.players[idx],
    ...updateFields
  };
  return memoryStore.players[idx];
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
  const format = roomData.format || 'T20';
  const purse = getFormatPurse(format);
  const squadLimits = roomData.squadLimits || getDefaultSquadLimits(format);
  const stadiumId = roomData.stadiumId || 'lords';
  const stadiumData = roomData.stadium || getStadiumById(stadiumId);
  const completeRoomData = {
    ...roomData,
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: roomData.budgetPerTeam !== undefined ? roomData.budgetPerTeam : purse,
    squadLimits,
    allowSpectators: roomData.allowSpectators !== undefined ? Boolean(roomData.allowSpectators) : true,
    allowPlayerJoining: roomData.allowPlayerJoining !== undefined ? Boolean(roomData.allowPlayerJoining) : true,
    spectatorChatEnabled: roomData.spectatorChatEnabled !== undefined ? Boolean(roomData.spectatorChatEnabled) : true,
    format,
    stadiumId,
    stadium: stadiumData,
    roomCode: (roomData.roomCode || `CRIC-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
    invitation: roomData.invitation || {
      token,
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: roomData.password || ''
    },
    auctionState: {
      status: 'idle',
      format,
      initialPurse: purse,
      bidIncrement: roomData.bidIncrement || 1,
      currentLot: null,
      nominatedPlayerIds: [],
      soldLots: [],
      unsoldLots: [],
      vetoedLots: [],
      unsoldRoundActive: false,
      bidHistory: [],
      spendingHistory: [],
      vetoHistory: [],
      replayLogs: [],
      turnOrder: [],
      currentTurnIndex: 0,
      nominationMode: 'rotating',
      ...(roomData.auctionState || {})
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

    const purse = rawRoom.budgetPerTeam !== undefined ? rawRoom.budgetPerTeam : getFormatPurse(rawRoom.format);
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
      t2VetoTokens: newParticipantRole === 'player' ? 2 : 0,
      vetoedPlayers: [],
      budgetRemaining: newParticipantRole === 'player' ? purse : 0,
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
const startRoomGame = async (roomCode, hostId, options = {}) => {
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

  const purse = room.budgetPerTeam !== undefined ? room.budgetPerTeam : getFormatPurse(room.format);

  const updatedParticipants = (room.participants || []).map(p => {
    if (p.role === 'player') {
      return {
        ...p,
        t2VetoTokens: p.t2VetoTokens !== undefined ? p.t2VetoTokens : 2,
        vetoedPlayers: p.vetoedPlayers || [],
        budgetRemaining: p.budgetRemaining !== undefined ? p.budgetRemaining : purse,
        squad: p.squad || []
      };
    }
    return p;
  });

  const turnOrder = activePlayers.map(p => p.userId);

  const updatedAuctionState = {
    ...(room.auctionState || {}),
    status: 'active',
    format: room.format,
    initialPurse: purse,
    bidIncrement: options.bidIncrement || room.auctionState?.bidIncrement || 1,
    currentLot: null,
    nominatedPlayerIds: room.auctionState?.nominatedPlayerIds || [],
    soldLots: room.auctionState?.soldLots || [],
    unsoldLots: room.auctionState?.unsoldLots || [],
    vetoedLots: room.auctionState?.vetoedLots || [],
    unsoldRoundActive: false,
    bidHistory: room.auctionState?.bidHistory || [],
    spendingHistory: room.auctionState?.spendingHistory || [],
    vetoHistory: room.auctionState?.vetoHistory || [],
    replayLogs: [
      ...(room.auctionState?.replayLogs || []),
      { event: 'AUCTION_STARTED', data: { format: room.format, purse }, timestamp: new Date() }
    ],
    turnOrder,
    currentTurnIndex: 0,
    nominationMode: options.nominationMode || room.auctionState?.nominationMode || 'rotating'
  };

  const updatedMessages = [
    ...(room.chatMessages || []),
    {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: `Host ${room.hostUsername} launched the arena! Live Auction has begun (${room.format}: ${purse} points purse).`,
      timestamp: new Date()
    }
  ];

  return await updateRoom(code, {
    status: 'auction',
    participants: updatedParticipants,
    auctionState: updatedAuctionState,
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
    'name',
    'stadiumId',
    'stadium',
    'stadiumName'
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

// ==========================================
// PHASE 4: LIVE AUCTION ENGINE
// ==========================================

// Initialize auction for room
const initAuctionForRoom = async (roomCode, hostId, options = {}) => {
  return await startRoomGame(roomCode, hostId, options);
};

// Get current live auction state
const getAuctionState = async (roomCode) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }
  return {
    roomCode: room.roomCode,
    status: room.auctionState?.status || room.status,
    format: room.format,
    initialPurse: room.auctionState?.initialPurse || getFormatPurse(room.format),
    bidIncrement: room.auctionState?.bidIncrement || 1,
    currentLot: room.auctionState?.currentLot || null,
    nominatedPlayerIds: room.auctionState?.nominatedPlayerIds || [],
    soldLots: room.auctionState?.soldLots || [],
    unsoldLots: room.auctionState?.unsoldLots || [],
    vetoedLots: room.auctionState?.vetoedLots || [],
    unsoldRoundActive: room.auctionState?.unsoldRoundActive || false,
    bidHistory: room.auctionState?.bidHistory || [],
    spendingHistory: room.auctionState?.spendingHistory || [],
    vetoHistory: room.auctionState?.vetoHistory || [],
    replayLogs: room.auctionState?.replayLogs || [],
    turnOrder: room.auctionState?.turnOrder || [],
    currentTurnIndex: room.auctionState?.currentTurnIndex || 0,
    nominationMode: room.auctionState?.nominationMode || 'rotating',
    participants: room.participants || []
  };
};

// Nominate player card for auction
// Enforces:
// 1. Fixed starting price = 1 point
// 2. ONE CRICKETER ONLY ONCE PER AUCTION across all card variants, OVRs, and formats
// 3. Permanent barring of vetoed cricketers
const nominatePlayerForAuction = async (roomCode, userId, { cardId, playerId }) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    const rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    // Spectator check (strictly barred)
    await verifyPlayerActionPermission(code, userId, 'nominate player');

    const auctionState = rawRoom.auctionState || {};

    // Check if a lot is currently active and nominated
    if (auctionState.currentLot && auctionState.currentLot.status === 'nominated') {
      const err = new Error(`Lot in progress: ${auctionState.currentLot.playerName} is currently active on the gavel block.`);
      err.status = 400;
      err.code = 'LOT_IN_PROGRESS';
      throw err;
    }

    // Rotating turn order check (host can also intervene if needed)
    if (auctionState.nominationMode === 'rotating' && auctionState.turnOrder && auctionState.turnOrder.length > 0) {
      const activeNomUser = auctionState.turnOrder[auctionState.currentTurnIndex % auctionState.turnOrder.length];
      if (userId !== activeNomUser && userId !== rawRoom.hostId) {
        const turnParticipant = (rawRoom.participants || []).find(p => p.userId === activeNomUser);
        const err = new Error(`Not your turn to nominate. Current turn belongs to ${turnParticipant?.username || 'another manager'}.`);
        err.status = 403;
        err.code = 'NOT_YOUR_TURN';
        throw err;
      }
    }

    // Fetch player card
    let card = null;
    if (cardId) {
      card = await getPlayerById(cardId);
    } else if (playerId) {
      if (isMongoConnected()) {
        card = await Player.findOne({ $or: [{ _id: playerId }, { playerId: playerId }] });
      } else {
        card = memoryStore.players.find(p => p._id === playerId || p.playerId === playerId);
      }
    }

    if (!card) {
      const err = new Error('Player card not found in database.');
      err.status = 404;
      err.code = 'PLAYER_NOT_FOUND';
      throw err;
    }

    // Real-world cricketer ID
    const realPlayerId = card.playerId || card._id;

    // RULE: ONE CRICKETER ONLY ONCE PER AUCTION
    // If Virat Kohli is nominated with Peak 120 OVR, then Best 105, Average 92, etc. all become unavailable.
    // This rule applies whether the nominated player is Sold, Unsold, or Vetoed.
    const nominatedPlayerIds = auctionState.nominatedPlayerIds || [];
    if (nominatedPlayerIds.includes(realPlayerId)) {
      const err = new Error(`Cricketer '${card.name}' (ID: ${realPlayerId}) has already been nominated in this auction. Each cricketer can appear only once per auction across all card variants, OVRs, and formats.`);
      err.status = 400;
      err.code = 'CRICKETER_ALREADY_NOMINATED';
      throw err;
    }

    // Check if cricketer was vetoed (strictly barred even in unsold round!)
    const vetoedLots = auctionState.vetoedLots || [];
    const wasVetoed = vetoedLots.some(v => v.lot?.playerId === realPlayerId);
    if (wasVetoed) {
      const err = new Error(`Cricketer '${card.name}' was vetoed by T2 Veto and is permanently barred from returning to this auction.`);
      err.status = 400;
      err.code = 'VETOED_PLAYER_CANNOT_RETURN';
      throw err;
    }

    // Format OVR calculation
    let formatOvr = card.overallRating || 90;
    const roomFmt = (rawRoom.format || 'T20').toLowerCase();
    if (card.ovr && typeof card.ovr === 'object') {
      if (roomFmt === 'test' && card.ovr.test) formatOvr = card.ovr.test;
      else if (roomFmt === 'odi' && card.ovr.odi) formatOvr = card.ovr.odi;
      else if (card.ovr.t20) formatOvr = card.ovr.t20;
    }

    // FIXED STARTING PRICE: EVERY PLAYER CARD STARTS AT EXACTLY 1 POINT
    const newLot = {
      cardId: card._id,
      playerId: realPlayerId,
      playerName: card.name,
      playerImage: card.imageUrl || card.avatarUrl || card.image,
      country: card.country,
      countryFlag: card.countryFlag,
      role: card.role,
      format: rawRoom.format,
      cardVariant: card.cardVariant || 'Peak',
      ovr: formatOvr,
      startingPrice: 1, // FIXED RULE: EXACTLY 1 POINT
      currentBid: 1,
      bidIncrement: auctionState.bidIncrement || 1,
      highestBidderId: null,
      highestBidderUsername: null,
      highestBidderTeam: null,
      status: 'nominated',
      timerRemaining: 15,
      timerExpiresAt: new Date(Date.now() + 15000),
      nominatedBy: userId,
      nominatedAt: new Date()
    };

    const updatedNominatedIds = [...nominatedPlayerIds, realPlayerId];
    const updatedReplayLogs = [
      ...(auctionState.replayLogs || []),
      {
        event: 'PLAYER_NOMINATED',
        data: {
          cardId: card._id,
          playerId: realPlayerId,
          playerName: card.name,
          ovr: formatOvr,
          cardVariant: card.cardVariant,
          nominatedBy: userId
        },
        timestamp: new Date()
      }
    ];

    const updatedAuctionState = {
      ...auctionState,
      status: 'active',
      currentLot: newLot,
      nominatedPlayerIds: updatedNominatedIds,
      replayLogs: updatedReplayLogs
    };

    return await updateRoom(code, {
      status: 'auction',
      auctionState: updatedAuctionState
    });
  });
};

// Place Auction Bid
// Enforces:
// 1. Starting at 1 point, increment validation
// 2. Purse budget validation
// 3. Anti-sniping timer extension
// 4. Spectator restriction
const placeAuctionBid = async (roomCode, userId, { amount }) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    const rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    // Spectators cannot bid
    await verifyPlayerActionPermission(code, userId, 'place bid');

    const auctionState = rawRoom.auctionState || {};
    const currentLot = auctionState.currentLot;

    if (!currentLot || currentLot.status !== 'nominated') {
      const err = new Error('No player is currently on the auction block.');
      err.status = 400;
      err.code = 'NO_ACTIVE_LOT';
      throw err;
    }

    if (currentLot.highestBidderId === userId) {
      const err = new Error('You are already the highest bidder for this lot.');
      err.status = 400;
      err.code = 'CANNOT_OUTBID_SELF';
      throw err;
    }

    const participants = rawRoom.participants ? [...rawRoom.participants] : [];
    const bidderIndex = participants.findIndex(p => p.userId === userId);
    if (bidderIndex === -1) {
      const err = new Error('Bidder not found in room participants.');
      err.status = 404;
      throw err;
    }
    const bidder = participants[bidderIndex];

    const bidAmount = Number(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      const err = new Error('Bid amount must be a positive integer.');
      err.status = 400;
      throw err;
    }

    // Minimum bid validation:
    // If no bids yet: minimum is startingPrice (1 point)
    // If bids exist: minimum is currentBid + bidIncrement
    const increment = currentLot.bidIncrement || auctionState.bidIncrement || 1;
    const minBid = currentLot.highestBidderId ? (currentLot.currentBid + increment) : currentLot.startingPrice;

    if (bidAmount < minBid) {
      const err = new Error(`Bid too low. Minimum valid bid is ${minBid} points.`);
      err.status = 400;
      err.code = 'BID_TOO_LOW';
      err.minBid = minBid;
      throw err;
    }

    // BUDGET VALIDATION
    if (bidAmount > bidder.budgetRemaining) {
      const err = new Error(`Bid of ${bidAmount} points exceeds your remaining purse of ${bidder.budgetRemaining} points.`);
      err.status = 400;
      err.code = 'INSUFFICIENT_BUDGET';
      err.budgetRemaining = bidder.budgetRemaining;
      throw err;
    }

    // Anti-sniping extension: if timer < 5s, extend timer to 8s
    let newTimer = currentLot.timerRemaining || 15;
    if (newTimer < 5) {
      newTimer = 8;
    }

    const updatedLot = {
      ...currentLot,
      currentBid: bidAmount,
      highestBidderId: userId,
      highestBidderUsername: bidder.username,
      highestBidderTeam: bidder.teamName,
      timerRemaining: newTimer,
      timerExpiresAt: new Date(Date.now() + newTimer * 1000)
    };

    const newBidRecord = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bidderId: userId,
      bidderUsername: bidder.username,
      bidderTeam: bidder.teamName,
      amount: bidAmount,
      timestamp: new Date()
    };

    const updatedBidHistory = [newBidRecord, ...(auctionState.bidHistory || [])];
    const updatedReplayLogs = [
      ...(auctionState.replayLogs || []),
      {
        event: 'BID_PLACED',
        data: {
          bidderId: userId,
          bidderUsername: bidder.username,
          amount: bidAmount,
          playerName: currentLot.playerName
        },
        timestamp: new Date()
      }
    ];

    const updatedAuctionState = {
      ...auctionState,
      currentLot: updatedLot,
      bidHistory: updatedBidHistory,
      replayLogs: updatedReplayLogs
    };

    return await updateRoom(code, { auctionState: updatedAuctionState });
  });
};

// T2 VETO — FIXED RULE
// - Exactly 2 tokens per participant (Total tokens = 2 × active participants)
// - Used after nomination and before sale
// - Successful veto immediately removes that nominated cricketer
// - Vetoed cricketer cannot return in unsold round, no card variant can return
// - Sold cards cannot be vetoed
// - Participant cannot veto the same cricketer twice
// - Atomic simultaneous veto handling: only first succeeds, second does not lose token
const useT2Veto = async (roomCode, userId) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    const rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    // Spectator permission check
    await verifyPlayerActionPermission(code, userId, 'use T2 Veto');

    const auctionState = rawRoom.auctionState || {};
    const currentLot = auctionState.currentLot;

    // Check if lot is active and nominated
    if (!currentLot || currentLot.status !== 'nominated') {
      const err = new Error('No active nomination to veto. Sold or already vetoed lots cannot be vetoed.');
      err.status = 400;
      err.code = 'LOT_NOT_ACTIVE_OR_ALREADY_RESOLVED';
      throw err;
    }

    const participants = rawRoom.participants ? [...rawRoom.participants] : [];
    const participantIndex = participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      const err = new Error('Participant not found.');
      err.status = 404;
      throw err;
    }
    const participant = participants[participantIndex];

    // EXACTLY TWO TOKENS PER PARTICIPANT
    const tokens = (participant.t2VetoTokens !== undefined) ? participant.t2VetoTokens : 2;
    if (tokens <= 0) {
      const err = new Error('You have exhausted your 2 T2 Veto tokens. Veto tokens cannot be refunded or transferred.');
      err.status = 400;
      err.code = 'INSUFFICIENT_VETO_TOKENS';
      throw err;
    }

    // Cannot veto the same cricketer twice
    const userVetoed = participant.vetoedPlayers || [];
    if (userVetoed.includes(currentLot.playerId)) {
      const err = new Error(`You have already used a T2 Veto on cricketer '${currentLot.playerName}'.`);
      err.status = 400;
      err.code = 'CANNOT_VETO_SAME_PLAYER_TWICE';
      throw err;
    }

    // Deduct exactly 1 token and mark user's vetoed list
    participant.t2VetoTokens = tokens - 1;
    participant.vetoedPlayers = [...userVetoed, currentLot.playerId];
    participants[participantIndex] = participant;

    // Mark lot as vetoed
    const vetoedLotRecord = { ...currentLot, status: 'vetoed' };

    const updatedVetoedLots = [
      ...(auctionState.vetoedLots || []),
      {
        lot: vetoedLotRecord,
        vetoedBy: userId,
        vetoedByUsername: participant.username,
        timestamp: new Date()
      }
    ];

    const updatedVetoHistory = [
      ...(auctionState.vetoHistory || []),
      {
        userId,
        username: participant.username,
        playerId: currentLot.playerId,
        playerName: currentLot.playerName,
        cardVariant: currentLot.cardVariant,
        timestamp: new Date()
      }
    ];

    const updatedReplayLogs = [
      ...(auctionState.replayLogs || []),
      {
        event: 'T2_VETO_EXECUTED',
        data: {
          vetoedBy: participant.username,
          userId,
          playerId: currentLot.playerId,
          playerName: currentLot.playerName,
          remainingTokens: participant.t2VetoTokens
        },
        timestamp: new Date()
      }
    ];

    // In rotating nomination, advance turn index
    const turnCount = (auctionState.turnOrder && auctionState.turnOrder.length) || 1;
    const nextTurnIndex = ((auctionState.currentTurnIndex || 0) + 1) % turnCount;

    const updatedAuctionState = {
      ...auctionState,
      currentLot: vetoedLotRecord,
      vetoedLots: updatedVetoedLots,
      vetoHistory: updatedVetoHistory,
      replayLogs: updatedReplayLogs,
      currentTurnIndex: nextTurnIndex
    };

    const systemMessage = {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: `⚡ T2 VETO USED! ${participant.username} played a T2 Veto token on ${currentLot.playerName}. Cricketer is permanently eliminated from this auction! (${participant.t2VetoTokens}/2 tokens remaining)`,
      timestamp: new Date()
    };

    const updatedMessages = [...(rawRoom.chatMessages || []), systemMessage];

    return await updateRoom(code, {
      participants,
      auctionState: updatedAuctionState,
      chatMessages: updatedMessages
    });
  });
};

// Hammer Sell / Unsold resolution
const hammerCurrentLot = async (roomCode, hostId) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    const rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    const auctionState = rawRoom.auctionState || {};
    const currentLot = auctionState.currentLot;

    if (!currentLot || currentLot.status !== 'nominated') {
      return computeRoomMetrics(rawRoom);
    }

    const participants = rawRoom.participants ? [...rawRoom.participants] : [];
    let updatedSoldLots = [...(auctionState.soldLots || [])];
    let updatedUnsoldLots = [...(auctionState.unsoldLots || [])];
    let updatedSpendingHistory = [...(auctionState.spendingHistory || [])];
    let updatedReplayLogs = [...(auctionState.replayLogs || [])];
    let resolvedLot = null;
    let systemText = '';

    if (currentLot.highestBidderId) {
      // SOLD!
      const buyerIndex = participants.findIndex(p => p.userId === currentLot.highestBidderId);
      if (buyerIndex !== -1) {
        const buyer = participants[buyerIndex];
        buyer.budgetRemaining = Math.max(0, buyer.budgetRemaining - currentLot.currentBid);
        buyer.squad = [
          ...(buyer.squad || []),
          {
            cardId: currentLot.cardId,
            playerId: currentLot.playerId,
            playerName: currentLot.playerName,
            playerImage: currentLot.playerImage,
            role: currentLot.role,
            cardVariant: currentLot.cardVariant,
            ovr: currentLot.ovr,
            acquiredPrice: currentLot.currentBid,
            acquiredAt: new Date()
          }
        ];
        participants[buyerIndex] = buyer;
      }

      resolvedLot = { ...currentLot, status: 'sold' };
      updatedSoldLots.push({
        lot: resolvedLot,
        finalPrice: currentLot.currentBid,
        buyerId: currentLot.highestBidderId,
        buyerUsername: currentLot.highestBidderUsername,
        buyerTeam: currentLot.highestBidderTeam,
        timestamp: new Date()
      });

      updatedSpendingHistory.push({
        userId: currentLot.highestBidderId,
        teamName: currentLot.highestBidderTeam,
        playerId: currentLot.playerId,
        playerName: currentLot.playerName,
        cardVariant: currentLot.cardVariant,
        amount: currentLot.currentBid,
        timestamp: new Date()
      });

      updatedReplayLogs.push({
        event: 'LOT_SOLD',
        data: {
          lot: resolvedLot,
          buyer: currentLot.highestBidderUsername,
          finalPrice: currentLot.currentBid
        },
        timestamp: new Date()
      });

      systemText = `🔨 GAVEL DOWN! ${currentLot.playerName} (${currentLot.cardVariant}) SOLD to ${currentLot.highestBidderUsername} (${currentLot.highestBidderTeam}) for ${currentLot.currentBid} points!`;
    } else {
      // UNSOLD!
      resolvedLot = { ...currentLot, status: 'unsold' };
      updatedUnsoldLots.push({
        lot: resolvedLot,
        timestamp: new Date()
      });

      updatedReplayLogs.push({
        event: 'LOT_UNSOLD',
        data: { lot: resolvedLot },
        timestamp: new Date()
      });

      systemText = `🔨 GAVEL DOWN! ${currentLot.playerName} is UNSOLD at 1 point starting price.`;
    }

    const turnCount = (auctionState.turnOrder && auctionState.turnOrder.length) || 1;
    const nextTurnIndex = ((auctionState.currentTurnIndex || 0) + 1) % turnCount;

    const updatedAuctionState = {
      ...auctionState,
      currentLot: resolvedLot,
      soldLots: updatedSoldLots,
      unsoldLots: updatedUnsoldLots,
      spendingHistory: updatedSpendingHistory,
      replayLogs: updatedReplayLogs,
      currentTurnIndex: nextTurnIndex
    };

    const systemMessage = {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: systemText,
      timestamp: new Date()
    };

    const updatedMessages = [...(rawRoom.chatMessages || []), systemMessage];

    return await updateRoom(code, {
      participants,
      auctionState: updatedAuctionState,
      chatMessages: updatedMessages
    });
  });
};

// Start Unsold Round
// Unsold players that were NOT vetoed can return
const startUnsoldRound = async (roomCode, hostId) => {
  return await withRoomLock(roomCode, async () => {
    const code = roomCode.toUpperCase();
    const rawRoom = isMongoConnected()
      ? await Room.findOne({ roomCode: code })
      : memoryStore.rooms.find(r => r.roomCode.toUpperCase() === code);

    if (!rawRoom) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    if (rawRoom.hostId !== hostId) {
      const err = new Error('Only the room host can initiate the Unsold Round.');
      err.status = 403;
      throw err;
    }

    const auctionState = rawRoom.auctionState || {};
    const vetoedLots = auctionState.vetoedLots || [];
    const vetoedPlayerIds = new Set(vetoedLots.map(v => v.lot?.playerId));

    // Exclude vetoed cricketers completely! Unsold cricketers that were NOT vetoed can return.
    const unsoldLots = auctionState.unsoldLots || [];
    const eligibleUnsoldPlayerIds = unsoldLots
      .map(u => u.lot?.playerId)
      .filter(id => id && !vetoedPlayerIds.has(id));

    const eligibleSet = new Set(eligibleUnsoldPlayerIds);

    // Remove eligible unsold cricketers from nominatedPlayerIds so they can be re-nominated
    const updatedNominatedIds = (auctionState.nominatedPlayerIds || []).filter(id => !eligibleSet.has(id));

    const updatedAuctionState = {
      ...auctionState,
      unsoldRoundActive: true,
      nominatedPlayerIds: updatedNominatedIds,
      currentLot: null,
      replayLogs: [
        ...(auctionState.replayLogs || []),
        {
          event: 'UNSOLD_ROUND_ACTIVATED',
          data: { eligibleCount: eligibleUnsoldPlayerIds.length },
          timestamp: new Date()
        }
      ]
    };

    const systemMessage = {
      id: `msg_${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      text: `📢 UNSOLD ROUND COMMENCED! ${eligibleUnsoldPlayerIds.length} players eligible for re-nomination. Vetoed cricketers remain permanently barred.`,
      timestamp: new Date()
    };

    return await updateRoom(code, {
      auctionState: updatedAuctionState,
      chatMessages: [...(rawRoom.chatMessages || []), systemMessage]
    });
  });
};

// Nominate Random Player
const nominateRandomPlayer = async (roomCode, userId) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  const auctionState = room.auctionState || {};
  const nominatedIds = auctionState.nominatedPlayerIds || [];
  const vetoedIds = new Set((auctionState.vetoedLots || []).map(v => v.lot?.playerId));

  const allPlayers = isMongoConnected() ? await Player.find() : memoryStore.players;

  // Filter available players:
  // 1. Not already nominated
  // 2. Not vetoed
  // 3. Format eligible if format is Test, ODI, or T20
  const roomFmt = (room.format || 'T20').toLowerCase();
  const available = allPlayers.filter(p => {
    const pId = p.playerId || p._id;
    if (nominatedIds.includes(pId)) return false;
    if (vetoedIds.has(pId)) return false;
    if (['test', 'odi', 't20'].includes(roomFmt)) {
      if (p.formatEligibility && p.formatEligibility[roomFmt] !== true) return false;
    }
    return true;
  });

  if (available.length === 0) {
    const err = new Error('No available players left to nominate for this format.');
    err.status = 400;
    err.code = 'CATALOG_EXHAUSTED';
    throw err;
  }

  const randomPlayer = available[Math.floor(Math.random() * available.length)];
  return await nominatePlayerForAuction(code, userId, { cardId: randomPlayer._id, playerId: randomPlayer.playerId });
};

// Update Auction Settings (host only)
const updateAuctionSettings = async (roomCode, hostId, settings = {}) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }
  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can modify auction settings.');
    err.status = 403;
    throw err;
  }

  const auctionState = {
    ...(room.auctionState || {}),
    ...(settings.bidIncrement ? { bidIncrement: Number(settings.bidIncrement) } : {}),
    ...(settings.nominationMode ? { nominationMode: settings.nominationMode } : {})
  };

  return await updateRoom(code, { auctionState });
};

// ==========================================
// PHASE 5: FRANCHISE & SQUAD MANAGEMENT
// ==========================================

// Calculate all squad strengths, balance, and chemistry
const calculateSquadMetrics = (populatedXI, populatedBench = [], format = 'T20') => {
  const fmt = (format || 'T20').toLowerCase();

  if (!populatedXI || populatedXI.length === 0) {
    return {
      squadStrength: 85,
      overallRating: 85,
      battingStrength: 85,
      bowlingStrength: 85,
      fieldingStrength: 85,
      fitnessAverage: 90,
      chemistryScore: 85,
      squadBalance: {
        battersCount: 0,
        bowlersCount: 0,
        allRoundersCount: 0,
        wicketKeepersCount: 0,
        isBalanced: false,
        summary: 'Incomplete Lineup'
      }
    };
  }

  // Format-specific OVR per player
  const getFormatOVR = (p) => {
    if (p.ovr && typeof p.ovr === 'object') {
      if (fmt === 'test' && p.ovr.test) return p.ovr.test;
      if (fmt === 'odi' && p.ovr.odi) return p.ovr.odi;
      if (p.ovr.t20) return p.ovr.t20;
    }
    return p.overallRating || 88;
  };

  const getBattingRating = (p) => p.attributes?.batting || p.stats?.bat || 75;
  const getBowlingRating = (p) => p.attributes?.bowling || p.stats?.bwl || 75;
  const getFieldingRating = (p) => p.attributes?.fielding || p.stats?.fld || 80;
  const getFitnessRating = (p) => p.attributes?.fitness || 90;

  // 1. Squad Strength / Overall Rating (average of Playing XI OVR)
  const ovrList = populatedXI.map(getFormatOVR);
  const squadStrength = Math.round(ovrList.reduce((a, b) => a + b, 0) / ovrList.length);

  // 2. Batting Strength: Top order (1-7) weighted heavier
  const batRatings = populatedXI.map(getBattingRating);
  const topBatters = [...batRatings].sort((a, b) => b - a).slice(0, 7);
  const battingStrength = Math.round(topBatters.reduce((a, b) => a + b, 0) / topBatters.length);

  // 3. Bowling Strength: Top 5 specialized bowlers / all-rounders
  const bwlRatings = populatedXI.map(getBowlingRating);
  const topBowlers = [...bwlRatings].sort((a, b) => b - a).slice(0, 5);
  const bowlingStrength = Math.round(topBowlers.reduce((a, b) => a + b, 0) / topBowlers.length);

  // 4. Fielding Strength
  const fldRatings = populatedXI.map(getFieldingRating);
  const fieldingStrength = Math.round(fldRatings.reduce((a, b) => a + b, 0) / fldRatings.length);

  // 5. Fitness Average
  const fitRatings = populatedXI.map(getFitnessRating);
  const fitnessAverage = Math.round(fitRatings.reduce((a, b) => a + b, 0) / fitRatings.length);

  // 6. Role Counts & Balance
  let battersCount = 0;
  let bowlersCount = 0;
  let allRoundersCount = 0;
  let wicketKeepersCount = 0;

  for (const p of populatedXI) {
    const role = (p.role || '').toLowerCase();
    if (role === 'batter') battersCount++;
    else if (role === 'bowler') bowlersCount++;
    else if (role === 'all-rounder') allRoundersCount++;
    else if (role === 'wicketkeeper') wicketKeepersCount++;
  }

  const isBalanced = battersCount >= 4 && bowlersCount >= 3 && (allRoundersCount >= 1 || bowlersCount >= 4) && wicketKeepersCount >= 1;
  let summary = 'Optimal Champion Balance';
  if (wicketKeepersCount === 0) summary = 'Warning: No Wicketkeeper selected in Playing XI';
  else if (bowlersCount < 3 && allRoundersCount < 2) summary = 'Warning: Bowling attack too light';
  else if (battersCount < 4) summary = 'Warning: Batting lineup too fragile';
  else summary = `Solid Balance (${battersCount} Bat, ${wicketKeepersCount} WK, ${allRoundersCount} AR, ${bowlersCount} Bowl)`;

  // 7. Chemistry Calculation
  let chemistryScore = 80;
  if (populatedXI.length === 11) chemistryScore += 8;
  if (isBalanced) chemistryScore += 7;
  const countryMap = {};
  for (const p of populatedXI) {
    countryMap[p.country] = (countryMap[p.country] || 0) + 1;
  }
  const maxCountryCluster = Math.max(...Object.values(countryMap), 0);
  if (maxCountryCluster >= 4) chemistryScore += 4;
  chemistryScore = Math.min(99, chemistryScore);

  return {
    squadStrength,
    overallRating: squadStrength,
    battingStrength,
    bowlingStrength,
    fieldingStrength,
    fitnessAverage,
    chemistryScore,
    squadBalance: {
      battersCount,
      bowlersCount,
      allRoundersCount,
      wicketKeepersCount,
      isBalanced,
      summary
    }
  };
};

// ==========================================
// PHASE 6: TACTICAL MANAGEMENT CONSTANTS & ENGINE
// ==========================================

// 18 Official Fielding Positions with metadata
const OFFICIAL_FIELD_POSITIONS = {
  'Slip': { name: 'Slip', side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Second Slip': { name: 'Second Slip', side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Third Slip': { name: 'Third Slip', side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Gully': { name: 'Gully', side: 'off', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Point': { name: 'Point', side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Cover': { name: 'Cover', side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Extra Cover': { name: 'Extra Cover', side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Mid-off': { name: 'Mid-off', side: 'off', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Mid-on': { name: 'Mid-on', side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Midwicket': { name: 'Midwicket', side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Square Leg': { name: 'Square Leg', side: 'leg', ring: 'inner', isBehindSquare: false, isDeep: false },
  'Fine Leg': { name: 'Fine Leg', side: 'leg', ring: 'inner', isBehindSquare: true, isDeep: false },
  'Third Man': { name: 'Third Man', side: 'off', ring: 'deep', isBehindSquare: true, isDeep: true },
  'Long-off': { name: 'Long-off', side: 'off', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Long-on': { name: 'Long-on', side: 'leg', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Deep Cover': { name: 'Deep Cover', side: 'off', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Deep Midwicket': { name: 'Deep Midwicket', side: 'leg', ring: 'deep', isBehindSquare: false, isDeep: true },
  'Deep Square Leg': { name: 'Deep Square Leg', side: 'leg', ring: 'deep', isBehindSquare: true, isDeep: true }
};

const BATTING_STRATEGIES = [
  'Aggressive',
  'Balanced',
  'Defensive',
  'Anchor',
  'Power Hitter',
  'Rotating Strike'
];

const BOWLER_ROLES = [
  'Opening bowlers',
  'First-change bowlers',
  'Middle-over specialists',
  'Death-over specialists'
];

const DELIVERY_TACTICS = [
  'Yorker',
  'Bouncer',
  'Swing',
  'Seam',
  'Slower ball',
  'Off-spin',
  'Leg-spin'
];

const FIELD_PRESETS = [
  'Attacking',
  'Defensive',
  'Powerplay',
  'Spin',
  'Death overs',
  'Custom'
];

// Format-specific maximum overs allowed per bowler
const getFormatMaxBowlerOvers = (format = 'T20') => {
  const fmt = (format || '').trim().toUpperCase();
  if (fmt === 'TEST') return 99; // Unlimited in Test
  if (fmt === 'ODI') return 10;
  if (fmt === 'T20') return 4;
  if (fmt === 'THE HUNDRED') return 4; // 20 balls = 4 sets of 5
  if (fmt === 'SUPER OVER') return 1;
  return 4;
};

// Preset positions generator
const getFieldPresetPositions = (preset = 'Powerplay', fielders = []) => {
  const name = (preset || 'Powerplay');
  let selectedPositions = [];
  if (name === 'Attacking') {
    selectedPositions = ['Slip', 'Second Slip', 'Third Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man'];
  } else if (name === 'Defensive') {
    selectedPositions = ['Point', 'Cover', 'Midwicket', 'Square Leg', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket'];
  } else if (name === 'Spin') {
    selectedPositions = ['Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Deep Midwicket', 'Long-on'];
  } else if (name === 'Death overs') {
    selectedPositions = ['Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket'];
  } else {
    // Powerplay or Custom default (max 2 outside circle)
    selectedPositions = ['Slip', 'Point', 'Cover', 'Extra Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Third Man', 'Long-on'];
  }

  return selectedPositions.map((pos, idx) => ({
    position: pos,
    fielderId: fielders[idx]?.playerId || fielders[idx]?._id || fielders[idx] || `fld_${idx}`,
    fielderName: fielders[idx]?.name || fielders[idx]?.shortName || `Fielder ${idx + 1}`,
    side: OFFICIAL_FIELD_POSITIONS[pos].side,
    ring: OFFICIAL_FIELD_POSITIONS[pos].ring,
    isBehindSquare: OFFICIAL_FIELD_POSITIONS[pos].isBehindSquare,
    isDeep: OFFICIAL_FIELD_POSITIONS[pos].isDeep
  }));
};

// Validate field placement against official cricket laws
const validateFieldPlacement = (positions = [], format = 'T20', isPowerplay = false) => {
  if (!Array.isArray(positions) || positions.length !== 9) {
    const err = new Error(`Field placement requires exactly 9 fielders on the field (currently ${positions ? positions.length : 0}/9). Bowler and Wicketkeeper are positioned automatically.`);
    err.status = 400;
    err.code = 'INVALID_FIELDER_COUNT';
    throw err;
  }

  const seenPositions = new Set();
  const seenFielders = new Set();
  let legSideCount = 0;
  let behindSquareLegCount = 0;
  let deepCount = 0;

  for (const item of positions) {
    const posName = item.position;
    const fielderId = item.fielderId;

    if (!OFFICIAL_FIELD_POSITIONS[posName]) {
      const err = new Error(`Position '${posName}' is not an official cricket fielding position.`);
      err.status = 400;
      err.code = 'INVALID_FIELD_POSITION';
      throw err;
    }

    if (seenPositions.has(posName)) {
      const err = new Error(`Duplicate position violation: Only one fielder can occupy '${posName}'.`);
      err.status = 400;
      err.code = 'DUPLICATE_FIELD_POSITION';
      throw err;
    }
    seenPositions.add(posName);

    if (fielderId) {
      if (seenFielders.has(fielderId)) {
        const err = new Error(`Duplicate fielder violation: Fielder '${fielderId}' is placed in multiple positions.`);
        err.status = 400;
        err.code = 'DUPLICATE_FIELDER';
        throw err;
      }
      seenFielders.add(fielderId);
    }

    const meta = OFFICIAL_FIELD_POSITIONS[posName];
    if (meta.side === 'leg') {
      legSideCount++;
      if (meta.isBehindSquare) {
        behindSquareLegCount++;
      }
    }
    if (meta.isDeep) {
      deepCount++;
    }
  }

  // ICC Law 28.4: At the instant of the bowler's delivery there shall not be more than 5 fielders on the leg side
  if (legSideCount > 5) {
    const err = new Error(`Official Fielding Restriction Violation (ICC Law 28.4): Maximum 5 fielders permitted on the leg side (currently ${legSideCount}/5).`);
    err.status = 400;
    err.code = 'EXCESS_LEG_SIDE_FIELDERS';
    throw err;
  }

  // ICC Law 28.4.1: At the instant of the bowler's delivery there shall not be more than 2 fielders behind square on the leg side
  if (behindSquareLegCount > 2) {
    const err = new Error(`Official Fielding Restriction Violation (ICC Law 28.4.1): Maximum 2 fielders permitted behind square on the leg side (currently ${behindSquareLegCount}/2).`);
    err.status = 400;
    err.code = 'EXCESS_BEHIND_SQUARE_FIELDERS';
    throw err;
  }

  // Powerplay Fielding Restriction
  if (isPowerplay && deepCount > 2) {
    const err = new Error(`Powerplay Restriction Violation: Maximum 2 fielders permitted outside the 30-yard circle during Powerplay (currently ${deepCount}/2).`);
    err.status = 400;
    err.code = 'POWERPLAY_RESTRICTION_EXCEEDED';
    throw err;
  }

  // Non-powerplay white-ball restriction: max 5 outside circle
  const fmt = (format || '').toUpperCase();
  if (fmt !== 'TEST' && !isPowerplay && deepCount > 5) {
    const err = new Error(`Outfield Restriction Violation: Maximum 5 fielders permitted outside the 30-yard circle (currently ${deepCount}/5).`);
    err.status = 400;
    err.code = 'OUTFIELD_RESTRICTION_EXCEEDED';
    throw err;
  }

  return {
    valid: true,
    deepFieldersCount: deepCount,
    legSideFieldersCount: legSideCount,
    behindSquareLegCount,
    restrictionsValid: true
  };
};

// Validate bowler over allocations
const validateBowlerOvers = (format = 'T20', bowlerAssignments = []) => {
  const maxOvers = getFormatMaxBowlerOvers(format);
  const fmt = (format || '').toUpperCase();

  if (fmt === 'TEST') return true; // Unlimited in Test

  for (const b of bowlerAssignments) {
    if (b.oversAllocated !== undefined && Number(b.oversAllocated) > maxOvers) {
      const err = new Error(`Format Bowling Restriction: Maximum ${maxOvers} overs per bowler allowed in ${format} format (allocated ${b.oversAllocated} overs to '${b.playerName || b.playerId}').`);
      err.status = 400;
      err.code = 'BOWLER_OVER_LIMIT_EXCEEDED';
      throw err;
    }
  }
  return true;
};

// Build default comprehensive tactics for a team
const getDefaultTeamTactics = (team, format = 'T20') => {
  const playingXI = team.playingXI || (team.squad || []).slice(0, 11);
  const battingOrder = team.battingOrder || playingXI;
  const bowlingOrder = team.bowlingOrder || playingXI.slice(4, 9);

  // Batting instructions: 11 batters
  const batterInstructions = battingOrder.map((pId, idx) => {
    let strat = 'Balanced';
    let aggression = 50;
    let intent = 'Standard';
    if (idx === 0 || idx === 1) {
      strat = 'Aggressive';
      aggression = 75;
      intent = 'Exploit Powerplay';
    } else if (idx === 2) {
      strat = 'Anchor';
      aggression = 55;
      intent = 'Control Innings';
    } else if (idx === 3 || idx === 4) {
      strat = 'Balanced';
      aggression = 60;
      intent = 'Consolidate & Accelerate';
    } else if (idx === 5 || idx === 6) {
      strat = 'Power Hitter';
      aggression = 85;
      intent = 'Death Overs Maximization';
    } else if (idx === 7) {
      strat = 'Rotating Strike';
      aggression = 50;
      intent = 'Keep Scoreboard Ticking';
    } else {
      strat = 'Defensive';
      aggression = 35;
      intent = 'Support Set Batter';
    }
    return {
      playerId: pId,
      battingPosition: idx + 1,
      strategy: strat,
      aggressionLevel: aggression,
      intent
    };
  });

  // Bowling assignments: 5 bowlers
  const maxOversPerBowler = getFormatMaxBowlerOvers(format);
  const bowlerAssignments = bowlingOrder.slice(0, 5).map((pId, idx) => {
    let role = 'Middle-over specialists';
    let tactic = 'Seam';
    if (idx === 0) {
      role = 'Opening bowlers';
      tactic = 'Swing';
    } else if (idx === 1) {
      role = 'Opening bowlers';
      tactic = 'Seam';
    } else if (idx === 2) {
      role = 'First-change bowlers';
      tactic = 'Bouncer';
    } else if (idx === 3) {
      role = 'Middle-over specialists';
      tactic = 'Off-spin';
    } else {
      role = 'Death-over specialists';
      tactic = 'Yorker';
    }
    return {
      playerId: pId,
      role,
      deliveryTactic: tactic,
      oversAllocated: maxOversPerBowler,
      oversBowled: 0,
      maxOvers: maxOversPerBowler
    };
  });

  // Field Placement: 9 fielders
  const nonWkFielders = playingXI.filter(id => id !== team.wicketKeeperId);
  const selected9 = nonWkFielders.slice(0, 9);
  while (selected9.length < 9 && playingXI.length >= 9) {
    for (const id of playingXI) {
      if (!selected9.includes(id)) selected9.push(id);
      if (selected9.length === 9) break;
    }
  }

  const positions = getFieldPresetPositions('Powerplay', selected9);

  return {
    batting: {
      teamStrategy: 'Balanced',
      batterInstructions
    },
    bowling: {
      bowlerAssignments,
      plannedPhases: {
        powerplayBowlers: bowlerAssignments.slice(0, 2).map(b => b.playerId),
        middleOversBowlers: bowlerAssignments.slice(2, 4).map(b => b.playerId),
        deathOversBowlers: [bowlerAssignments[0]?.playerId, bowlerAssignments[4]?.playerId].filter(Boolean)
      }
    },
    fieldPlacement: {
      preset: 'Powerplay',
      positions,
      deepFieldersCount: 2,
      legSideFieldersCount: 3,
      behindSquareLegCount: 0,
      restrictionsValid: true
    }
  };
};

// Populate player details from IDs
const populateTeamSquad = async (team, format = 'T20') => {
  if (!team) return null;
  const doc = (typeof team.toObject === 'function') ? team.toObject() : { ...team };

  const allPlayers = isMongoConnected() ? await Player.find() : memoryStore.players;
  const playerMap = new Map();
  for (const p of allPlayers) {
    const item = (typeof p.toObject === 'function') ? p.toObject() : { ...p };
    playerMap.set(p._id, item);
    if (p.playerId) {
      playerMap.set(p.playerId, item);
    }
  }

  const squadIds = doc.squad || [];
  const playingXIIds = doc.playingXI || squadIds.slice(0, 11);
  const benchIds = squadIds.filter(id => !playingXIIds.includes(id));

  const formatKey = (format || doc.format || 'T20').toLowerCase();

  const formatCardForDashboard = (pId, idx = 0) => {
    const raw = playerMap.get(pId) || {
      _id: pId,
      name: `Player ${pId}`,
      country: 'International',
      countryFlag: '🏏',
      role: 'Batter',
      overallRating: 85
    };

    let ovrVal = raw.overallRating || 88;
    if (raw.ovr && typeof raw.ovr === 'object') {
      if (formatKey === 'test' && raw.ovr.test) ovrVal = raw.ovr.test;
      else if (formatKey === 'odi' && raw.ovr.odi) ovrVal = raw.ovr.odi;
      else if (raw.ovr.t20) ovrVal = raw.ovr.t20;
    }

    return {
      _id: raw._id,
      playerId: raw.playerId || raw._id,
      name: raw.name,
      shortName: raw.shortName || raw.name,
      country: raw.country,
      countryFlag: raw.countryFlag || '🏏',
      imageUrl: raw.imageUrl || raw.avatarUrl,
      avatarUrl: raw.avatarUrl || raw.imageUrl,
      role: raw.role,
      format: doc.format || 'T20',
      cardVariant: raw.cardVariant || 'Peak',
      ovr: ovrVal,
      overallRating: ovrVal,
      battingRating: raw.attributes?.batting || raw.stats?.bat || 80,
      bowlingRating: raw.attributes?.bowling || raw.stats?.bwl || 40,
      fieldingRating: raw.attributes?.fielding || raw.stats?.fld || 85,
      fitness: raw.attributes?.fitness || 90,
      battingStyle: raw.battingStyle || 'Right-hand bat',
      bowlingStyle: raw.bowlingStyle || 'Right-arm medium',
      chemistry: 92,
      isCaptain: doc.captainId === raw._id || doc.captainId === raw.playerId,
      isViceCaptain: doc.viceCaptainId === raw._id || doc.viceCaptainId === raw.playerId,
      isWicketKeeper: doc.wicketKeeperId === raw._id || doc.wicketKeeperId === raw.playerId || raw.role?.toLowerCase() === 'wicketkeeper',
      battingOrderPosition: idx + 1
    };
  };

  const populatedPlayingXI = playingXIIds.map((id, idx) => formatCardForDashboard(id, idx));
  const populatedBench = benchIds.map(id => formatCardForDashboard(id));
  const populatedSquad = squadIds.map(id => formatCardForDashboard(id));

  const metrics = calculateSquadMetrics(populatedPlayingXI, populatedBench, doc.format || format);

  return {
    ...doc,
    captain: doc.captainId || doc.captain,
    viceCaptain: doc.viceCaptainId || doc.viceCaptain,
    wicketKeeper: doc.wicketKeeperId || doc.wicketKeeper,
    captainId: doc.captainId || doc.captain,
    viceCaptainId: doc.viceCaptainId || doc.viceCaptain,
    wicketKeeperId: doc.wicketKeeperId || doc.wicketKeeper,
    populatedSquad,
    populatedPlayingXI,
    populatedBench,
    ...metrics,
    tactics: doc.tactics || getDefaultTeamTactics(doc, doc.format || format),
    totalSpending: doc.totalSpending || 0,
    remainingPurse: doc.remainingPurse !== undefined ? doc.remainingPurse : (doc.budgetRemaining || 30)
  };
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

// Get or create franchise for user in a room (after auction or during lobby)
const getOrCreateUserFranchise = async (userId, roomCode = null) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  let code = roomCode ? roomCode.toUpperCase() : null;

  if (code) {
    const room = await getRoomByCode(code);
    if (!room) {
      const err = new Error(`Room '${roomCode}' not found.`);
      err.status = 404;
      throw err;
    }

    const participant = (room.participants || []).find(p => p.userId === userId);
    const isSpectator = participant?.role === 'spectator';

    // If user is spectator, return host's team or first franchise team as read-only preview
    if (isSpectator) {
      const roomTeams = isMongoConnected()
        ? await Team.find({ roomCode: code })
        : memoryStore.teams.filter(t => t.roomCode === code);
      if (roomTeams.length > 0) {
        const pop = await populateTeamSquad(roomTeams[0], room.format);
        return {
          ...pop,
          isReadOnly: true,
          isSpectator: true,
          spectatorMessage: 'Observing franchise as spectator. Read-only access.'
        };
      }
    }

    // Look for existing team for this user in this room
    let team = isMongoConnected()
      ? await Team.findOne({ ownerId: userId, roomCode: code })
      : memoryStore.teams.find(t => t.ownerId === userId && t.roomCode === code);

    // Get acquired players from participant's auction squad
    const acquiredSquad = (participant?.squad || []).map(s => (typeof s === 'string' ? s : (s.cardId || s._id)));
    const allPlayers = isMongoConnected() ? await Player.find() : memoryStore.players;

    // Fill default roster if fewer than 11 (e.g. before auction finishes or in demo)
    let squadIds = [...acquiredSquad];
    if (squadIds.length < 11) {
      const existingSet = new Set(squadIds);
      // Exclude players already assigned to other teams in this room to enforce auction uniqueness
      const otherRoomTeams = isMongoConnected()
        ? await Team.find({ roomCode: code })
        : memoryStore.teams.filter(t => t.roomCode === code);
      for (const ot of otherRoomTeams) {
        if (ot.ownerId !== userId && ot.squad) {
          for (const pid of ot.squad) {
            existingSet.add(pid);
          }
        }
      }

      for (const p of allPlayers) {
        if (!existingSet.has(p._id)) {
          squadIds.push(p._id);
          existingSet.add(p._id);
        }
        if (squadIds.length >= 13) break;
      }
    }

    const defaultLimits = room.squadLimits || getDefaultSquadLimits(room.format);

    if (!team) {
      const newTeamData = {
        _id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: participant?.teamName || `${user.username}'s Super XI`,
        shortCode: (participant?.teamName || user.username).substring(0, 3).toUpperCase(),
        logo: '🏏',
        logoUrl: '',
        ownerId: user._id,
        ownerUsername: user.username,
        roomCode: code,
        format: room.format || 'T20',
        squadLimits: defaultLimits,
        primaryColor: '#F59E0B',
        secondaryColor: '#1E293B',
        squad: squadIds,
        playingXI: squadIds.slice(0, 11),
        battingOrder: squadIds.slice(0, 11),
        bowlingOrder: squadIds.slice(4, 9),
        captainId: squadIds[0] || null,
        viceCaptainId: squadIds[1] || null,
        wicketKeeperId: squadIds.find(id => {
          const p = allPlayers.find(x => x._id === id);
          return p && p.role?.toLowerCase() === 'wicketkeeper';
        }) || squadIds[2] || null,
        totalSpending: (participant?.squad || []).reduce((sum, s) => sum + (s.acquiredPrice || 0), 0),
        remainingPurse: participant?.budgetRemaining !== undefined ? participant.budgetRemaining : (room.budgetPerTeam || 30)
      };

      if (isMongoConnected()) {
        const created = new Team(newTeamData);
        team = await created.save();
      } else {
        memoryStore.teams.push(newTeamData);
        team = newTeamData;
      }
    } else {
      if (participant) {
        const totalSpent = (participant.squad || []).reduce((sum, s) => sum + (s.acquiredPrice || 0), 0);
        team.remainingPurse = participant.budgetRemaining;
        team.totalSpending = totalSpent;
      }
    }

    const populated = await populateTeamSquad(team, room.format);
    return {
      ...populated,
      isReadOnly: false,
      isSpectator: false
    };
  }

  // Standalone mode
  let teams = isMongoConnected()
    ? await Team.find({ ownerId: userId })
    : memoryStore.teams.filter(t => t.ownerId === userId);

  let myTeam = teams[0];
  if (!myTeam) {
    const allPlayers = isMongoConnected() ? await Player.find() : memoryStore.players;
    const defaultSquad = allPlayers.slice(0, 13).map(p => p._id);
    const newTeam = {
      _id: `tm_${Date.now()}`,
      name: `${user.username}'s Super XI`,
      shortCode: user.username.substring(0, 3).toUpperCase(),
      logo: '🏏',
      logoUrl: '',
      ownerId: user._id,
      ownerUsername: user.username,
      roomCode: '',
      format: 'T20',
      squadLimits: getDefaultSquadLimits('T20'),
      primaryColor: '#F59E0B',
      secondaryColor: '#1E293B',
      squad: defaultSquad,
      playingXI: defaultSquad.slice(0, 11),
      battingOrder: defaultSquad.slice(0, 11),
      bowlingOrder: defaultSquad.slice(4, 9),
      captainId: defaultSquad[0] || null,
      viceCaptainId: defaultSquad[1] || null,
      wicketKeeperId: defaultSquad.find(id => {
        const p = allPlayers.find(x => x._id === id);
        return p && p.role?.toLowerCase() === 'wicketkeeper';
      }) || defaultSquad[2] || null,
      totalSpending: 0,
      remainingPurse: 30
    };

    if (isMongoConnected()) {
      const created = new Team(newTeam);
      myTeam = await created.save();
    } else {
      memoryStore.teams.push(newTeam);
      myTeam = newTeam;
    }
  }

  return await populateTeamSquad(myTeam, myTeam.format || 'T20');
};

// Get all franchise teams in a room (for room roster / spectator viewing)
const getFranchiseTeamsByRoom = async (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error(`Room '${roomCode}' not found.`);
    err.status = 404;
    throw err;
  }

  let teams = isMongoConnected()
    ? await Team.find({ roomCode: code })
    : memoryStore.teams.filter(t => t.roomCode === code);

  // If room participants have no teams yet, provision them
  const players = (room.participants || []).filter(p => p.role === 'player');
  for (const p of players) {
    const exists = teams.some(t => t.ownerId === p.userId);
    if (!exists) {
      await getOrCreateUserFranchise(p.userId, code);
    }
  }

  teams = isMongoConnected()
    ? await Team.find({ roomCode: code })
    : memoryStore.teams.filter(t => t.roomCode === code);

  const populated = await Promise.all(teams.map(t => populateTeamSquad(t, room.format)));
  return populated;
};

// Update Team Selection & Lineup
// Enforces:
// 1. Owner or authorized Host only (Spectators get 403 Forbidden)
// 2. Prevent duplicate players in playingXI
// 3. Exactly 11 players in playingXI
// 4. Respect auction ownership (all players in playingXI must belong to team squad)
// 5. One player cannot be assigned to multiple teams in the same auction
const updateTeamSelection = async (teamId, userId, updateData = {}) => {
  const team = await getTeamById(teamId);
  if (!team) {
    const err = new Error('Franchise team not found.');
    err.status = 404;
    throw err;
  }

  // Check authorization
  let isHost = false;
  let room = null;
  if (team.roomCode) {
    room = await getRoomByCode(team.roomCode);
    if (room && room.hostId === userId) {
      isHost = true;
    }
  }

  // Check spectator role
  if (room) {
    const participant = (room.participants || []).find(p => p.userId === userId);
    if (participant && participant.role === 'spectator') {
      const err = new Error('Forbidden: Spectators have read-only access and cannot modify team settings or lineups.');
      err.status = 403;
      err.code = 'SPECTATOR_READ_ONLY';
      throw err;
    }
  }

  if (team.ownerId !== userId && !isHost) {
    const err = new Error('Forbidden: Only the team owner or room host can modify franchise settings.');
    err.status = 403;
    err.code = 'UNAUTHORIZED_TEAM_EDIT';
    throw err;
  }

  const currentSquad = updateData.squad || team.squad || [];

  // RULE 1: PREVENT DUPLICATE PLAYERS IN PLAYING XI
  if (updateData.playingXI) {
    const xi = updateData.playingXI;
    const unique = new Set(xi);
    if (unique.size !== xi.length) {
      const err = new Error('Invalid Lineup: Playing XI cannot contain duplicate players. Every player must be unique.');
      err.status = 400;
      err.code = 'DUPLICATE_PLAYER_IN_XI';
      throw err;
    }

    if (xi.length !== 11) {
      const err = new Error(`Invalid Lineup: Playing XI must contain exactly 11 players (${xi.length}/11 selected).`);
      err.status = 400;
      err.code = 'INVALID_PLAYING_XI_SIZE';
      throw err;
    }

    // RULE 2: RESPECT AUCTION OWNERSHIP
    for (const pId of xi) {
      if (!currentSquad.includes(pId)) {
        const err = new Error(`Ownership Violation: Player '${pId}' is not part of this franchise squad roster.`);
        err.status = 400;
        err.code = 'UNOWNED_PLAYER_IN_LINEUP';
        throw err;
      }
    }
  }

  // RULE 3: ONE PLAYER CANNOT BE ASSIGNED TO MULTIPLE TEAMS IN THE SAME AUCTION
  if (team.roomCode && (updateData.squad || updateData.playingXI)) {
    const checkSquad = updateData.squad || team.squad;
    const otherTeams = isMongoConnected()
      ? await Team.find({ roomCode: team.roomCode, _id: { $ne: team._id } })
      : memoryStore.teams.filter(t => t.roomCode === team.roomCode && t._id !== team._id);

    for (const other of otherTeams) {
      for (const pId of checkSquad) {
        if (other.squad && other.squad.includes(pId)) {
          const err = new Error(`Auction Rule Violation: Player '${pId}' is already owned by '${other.name}' in this auction.`);
          err.status = 400;
          err.code = 'PLAYER_ALREADY_ASSIGNED_TO_OTHER_TEAM';
          throw err;
        }
      }
    }
  }

  const updates = {};
  if (updateData.name) updates.name = updateData.name.trim();
  if (updateData.shortCode) updates.shortCode = updateData.shortCode.trim().toUpperCase();
  if (updateData.logo) updates.logo = updateData.logo;
  if (updateData.logoUrl !== undefined) updates.logoUrl = updateData.logoUrl;
  if (updateData.primaryColor) updates.primaryColor = updateData.primaryColor;
  if (updateData.secondaryColor) updates.secondaryColor = updateData.secondaryColor;
  if (updateData.squad) updates.squad = updateData.squad;
  if (updateData.playingXI) {
    updates.playingXI = updateData.playingXI;
    updates.battingOrder = updateData.battingOrder || updateData.playingXI;
  }
  if (updateData.battingOrder) updates.battingOrder = updateData.battingOrder;
  if (updateData.bowlingOrder) updates.bowlingOrder = updateData.bowlingOrder;
  if (updateData.captainId !== undefined) updates.captainId = updateData.captainId;
  else if (updateData.captain !== undefined) updates.captainId = updateData.captain;

  if (updateData.viceCaptainId !== undefined) updates.viceCaptainId = updateData.viceCaptainId;
  else if (updateData.viceCaptain !== undefined) updates.viceCaptainId = updateData.viceCaptain;

  if (updateData.wicketKeeperId !== undefined) updates.wicketKeeperId = updateData.wicketKeeperId;
  else if (updateData.wicketKeeper !== undefined) updates.wicketKeeperId = updateData.wicketKeeper;

  const updatedRaw = await updateTeam(team._id, updates);
  return await populateTeamSquad(updatedRaw, updatedRaw.format || team.format);
};

// Swap two players between Playing XI and Bench (or within Batting Order)
const swapTeamPlayers = async (teamId, userId, { playerInId, playerOutId, newBattingOrder, newBowlingOrder }) => {
  const team = await getTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found.');
    err.status = 404;
    throw err;
  }

  // Check authorization
  let isHost = false;
  if (team.roomCode) {
    const room = await getRoomByCode(team.roomCode);
    if (room && room.hostId === userId) isHost = true;
    const participant = (room?.participants || []).find(p => p.userId === userId);
    if (participant?.role === 'spectator') {
      const err = new Error('Forbidden: Spectators have read-only access.');
      err.status = 403;
      err.code = 'SPECTATOR_READ_ONLY';
      throw err;
    }
  }

  if (team.ownerId !== userId && !isHost) {
    const err = new Error('Forbidden: Only team owner or host can modify lineup.');
    err.status = 403;
    throw err;
  }

  let playingXI = [...(team.playingXI || [])];
  const squad = team.squad || [];

  if (playerInId && playerOutId) {
    if (!squad.includes(playerInId)) {
      const err = new Error(`Player '${playerInId}' is not in your squad roster.`);
      err.status = 400;
      throw err;
    }

    const outIndex = playingXI.indexOf(playerOutId);
    if (outIndex === -1) {
      const err = new Error(`Player to replace '${playerOutId}' is not currently in the Playing XI.`);
      err.status = 400;
      throw err;
    }

    if (playingXI.includes(playerInId)) {
      const err = new Error('Invalid swap: incoming player is already in the Playing XI.');
      err.status = 400;
      err.code = 'DUPLICATE_PLAYER_IN_XI';
      throw err;
    }

    playingXI[outIndex] = playerInId;
  }

  if (newBattingOrder && Array.isArray(newBattingOrder)) {
    playingXI = newBattingOrder;
  }

  return await updateTeamSelection(teamId, userId, {
    playingXI,
    battingOrder: playingXI,
    ...(newBowlingOrder ? { bowlingOrder: newBowlingOrder } : {})
  });
};

// Host configures squad limits
const updateRoomSquadLimits = async (roomCode, hostId, squadLimits = {}) => {
  const code = roomCode.toUpperCase();
  const room = await getRoomByCode(code);
  if (!room) {
    const err = new Error('Room not found.');
    err.status = 404;
    throw err;
  }

  if (room.hostId !== hostId) {
    const err = new Error('Only the room host can configure squad limits.');
    err.status = 403;
    throw err;
  }

  const updatedLimits = {
    ...(room.squadLimits || getDefaultSquadLimits(room.format)),
    ...(squadLimits.test !== undefined ? { test: Number(squadLimits.test) } : {}),
    ...(squadLimits.odi !== undefined ? { odi: Number(squadLimits.odi) } : {}),
    ...(squadLimits.t20 !== undefined ? { t20: Number(squadLimits.t20) } : {}),
    ...(squadLimits.maxSquadSize !== undefined ? { maxSquadSize: Number(squadLimits.maxSquadSize) } : {}),
    ...(squadLimits.playingXISize !== undefined ? { playingXISize: Number(squadLimits.playingXISize) } : {})
  };

  const updatedRoom = await updateRoom(code, { squadLimits: updatedLimits });

  if (isMongoConnected()) {
    await Team.updateMany({ roomCode: code }, { $set: { squadLimits: updatedLimits } });
  } else {
    for (const t of memoryStore.teams) {
      if (t.roomCode === code) t.squadLimits = updatedLimits;
    }
  }

  return updatedRoom;
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

const updateMatch = async (matchId, updateFields) => {
  if (isMongoConnected()) {
    return await Match.findOneAndUpdate({ matchId }, { $set: updateFields }, { new: true });
  }
  const idx = memoryStore.matches.findIndex(m => m.matchId === matchId || m._id === matchId);
  if (idx === -1) return null;
  memoryStore.matches[idx] = { ...memoryStore.matches[idx], ...updateFields, updatedAt: new Date() };
  return memoryStore.matches[idx];
};

// ==========================================
// PHASE 6: TACTICAL MANAGEMENT SERVICE
// ==========================================

const getTeamTactics = async (teamId) => {
  const team = await getTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found.');
    err.status = 404;
    throw err;
  }
  return team.tactics || getDefaultTeamTactics(team, team.format || 'T20');
};

const updateTeamTactics = async (teamId, userId, tacticsData = {}) => {
  const team = await getTeamById(teamId);
  if (!team) {
    const err = new Error('Franchise team not found.');
    err.status = 404;
    throw err;
  }

  // Authorization check
  let isHost = false;
  let room = null;
  if (team.roomCode) {
    room = await getRoomByCode(team.roomCode);
    if (room && room.hostId === userId) isHost = true;
    const participant = (room?.participants || []).find(p => p.userId === userId);
    if (participant && participant.role === 'spectator') {
      const err = new Error('Forbidden: Spectators have read-only access and cannot modify team tactics.');
      err.status = 403;
      err.code = 'SPECTATOR_READ_ONLY';
      throw err;
    }
  }

  if (team.ownerId !== userId && !isHost) {
    const err = new Error('Forbidden: Only the team owner or authorized room host can modify tactics.');
    err.status = 403;
    err.code = 'UNAUTHORIZED_TACTICS_EDIT';
    throw err;
  }

  const existingTactics = team.tactics || getDefaultTeamTactics(team, team.format);
  const updatedTactics = { ...existingTactics };

  // Validate Batting Tactics
  if (tacticsData.batting) {
    if (tacticsData.batting.teamStrategy && !BATTING_STRATEGIES.includes(tacticsData.batting.teamStrategy)) {
      const err = new Error(`Invalid batting strategy '${tacticsData.batting.teamStrategy}'. Valid strategies: ${BATTING_STRATEGIES.join(', ')}.`);
      err.status = 400;
      err.code = 'INVALID_BATTING_STRATEGY';
      throw err;
    }
    if (tacticsData.batting.batterInstructions && Array.isArray(tacticsData.batting.batterInstructions)) {
      for (const instr of tacticsData.batting.batterInstructions) {
        if (instr.strategy && !BATTING_STRATEGIES.includes(instr.strategy)) {
          const err = new Error(`Invalid individual batter strategy '${instr.strategy}'.`);
          err.status = 400;
          err.code = 'INVALID_BATTING_STRATEGY';
          throw err;
        }
      }
    }
    updatedTactics.batting = {
      ...updatedTactics.batting,
      ...tacticsData.batting
    };
  }

  // Validate Bowling Tactics
  if (tacticsData.bowling) {
    if (tacticsData.bowling.bowlerAssignments && Array.isArray(tacticsData.bowling.bowlerAssignments)) {
      for (const b of tacticsData.bowling.bowlerAssignments) {
        if (b.deliveryTactic && !DELIVERY_TACTICS.includes(b.deliveryTactic)) {
          const err = new Error(`Invalid delivery tactic '${b.deliveryTactic}'. Valid tactics: ${DELIVERY_TACTICS.join(', ')}.`);
          err.status = 400;
          err.code = 'INVALID_DELIVERY_TACTIC';
          throw err;
        }
        if (b.role && !BOWLER_ROLES.includes(b.role)) {
          const err = new Error(`Invalid bowling role '${b.role}'. Valid roles: ${BOWLER_ROLES.join(', ')}.`);
          err.status = 400;
          err.code = 'INVALID_BOWLER_ROLE';
          throw err;
        }
      }
      validateBowlerOvers(team.format || 'T20', tacticsData.bowling.bowlerAssignments);
    }
    updatedTactics.bowling = {
      ...updatedTactics.bowling,
      ...tacticsData.bowling
    };
  }

  // Validate Field Placement
  if (tacticsData.fieldPlacement) {
    const isPowerplay = tacticsData.fieldPlacement.preset === 'Powerplay';
    const validation = validateFieldPlacement(tacticsData.fieldPlacement.positions, team.format || 'T20', isPowerplay);
    updatedTactics.fieldPlacement = {
      preset: tacticsData.fieldPlacement.preset || 'Custom',
      positions: tacticsData.fieldPlacement.positions,
      deepFieldersCount: validation.deepFieldersCount,
      legSideFieldersCount: validation.legSideFieldersCount,
      behindSquareLegCount: validation.behindSquareLegCount,
      restrictionsValid: true
    };
  }

  const updatedTeam = await updateTeam(team._id, { tactics: updatedTactics });
  return await populateTeamSquad(updatedTeam, updatedTeam.format || 'T20');
};

const getMatchTactics = async (matchId) => {
  const match = await getMatchById(matchId);
  if (!match) {
    const err = new Error(`Match '${matchId}' not found.`);
    err.status = 404;
    throw err;
  }
  return {
    matchId: match.matchId,
    tacticalBreak: match.tacticalBreak || 'live',
    teamATactics: match.teamATactics,
    teamBTactics: match.teamBTactics
  };
};

const updateMatchTactics = async (matchId, userId, { teamKey = 'teamA', tactics, tacticalBreak }) => {
  const match = await getMatchById(matchId);
  if (!match) {
    const err = new Error(`Match '${matchId}' not found.`);
    err.status = 404;
    throw err;
  }

  if (tactics) {
    if (tactics.fieldPlacement && tactics.fieldPlacement.positions) {
      const isPowerplay = tactics.fieldPlacement.preset === 'Powerplay' || (match.teamA?.overs || 0) <= 6;
      validateFieldPlacement(tactics.fieldPlacement.positions, match.format || 'T20', isPowerplay);
    }
    if (tactics.bowling && tactics.bowling.bowlerAssignments) {
      validateBowlerOvers(match.format || 'T20', tactics.bowling.bowlerAssignments);
    }
  }

  const updates = {};
  if (tacticalBreak) updates.tacticalBreak = tacticalBreak;
  if (teamKey === 'teamA') {
    updates.teamATactics = { ...(match.teamATactics || {}), ...(tactics || {}) };
  } else {
    updates.teamBTactics = { ...(match.teamBTactics || {}), ...(tactics || {}) };
  }

  return await updateMatch(match.matchId, updates);
};

// Tactical Ball Simulation Engine
const simulateTacticalBall = async (matchId) => {
  const match = await getMatchById(matchId);
  if (!match) {
    const err = new Error(`Match '${matchId}' not found.`);
    err.status = 404;
    throw err;
  }

  const isChasing = match.currentInnings === 2;
  const battingTactics = isChasing ? match.teamATactics : match.teamBTactics;
  const bowlingTactics = isChasing ? match.teamBTactics : match.teamATactics;

  const strikerName = match.currentStriker?.name || 'Batter';
  const bowlerName = match.currentBowler?.name || 'Bowler';

  // Find striker instruction
  const strikerInstruction = (battingTactics?.batting?.batterInstructions || []).find(b =>
    b.playerName === strikerName || b.playerId === match.currentStriker?.playerId
  ) || { strategy: battingTactics?.batting?.teamStrategy || 'Balanced', aggressionLevel: 55 };

  // Find bowler assignment
  const bowlerAssignment = (bowlingTactics?.bowling?.bowlerAssignments || []).find(b =>
    b.playerName === bowlerName || b.playerId === match.currentBowler?.playerId
  ) || { role: 'Middle-over specialists', deliveryTactic: 'Seam' };

  // Field Placement analysis
  const fieldPlacement = bowlingTactics?.fieldPlacement || { preset: 'Powerplay', positions: [] };
  const positions = (fieldPlacement.positions || []).map(p => p.position);
  const positionSet = new Set(positions);

  const hasSlips = positionSet.has('Slip') || positionSet.has('Second Slip') || positionSet.has('Third Slip');
  const hasDeepCover = positionSet.has('Deep Cover');
  const hasLongOff = positionSet.has('Long-off');
  const hasLongOn = positionSet.has('Long-on');
  const hasDeepMidwicket = positionSet.has('Deep Midwicket');

  const deepCount = positions.filter(pos => OFFICIAL_FIELD_POSITIONS[pos]?.isDeep).length;
  const ringCount = 9 - deepCount;

  const batStrategy = strikerInstruction.strategy || 'Balanced';
  const deliveryTactic = bowlerAssignment.deliveryTactic || 'Seam';

  // Base probabilities
  let wDot = 25;
  let wSingle = 30;
  let wTwo = 12;
  let wFour = 15;
  let wSix = 8;
  let wWicket = 10;

  // 1. Batting Strategy Impact
  if (batStrategy === 'Aggressive') {
    wFour += 8;
    wSix += 6;
    wWicket += 5;
    wDot -= 8;
  } else if (batStrategy === 'Power Hitter') {
    wSix += 12;
    wFour += 6;
    wWicket += 8;
    wSingle -= 10;
    wDot -= 6;
  } else if (batStrategy === 'Defensive') {
    wDot += 20;
    wWicket -= 6;
    wFour -= 10;
    wSix -= 7;
    wSingle -= 5;
  } else if (batStrategy === 'Anchor') {
    wSingle += 10;
    wTwo += 6;
    wWicket -= 4;
    wDot -= 5;
    wSix -= 4;
  } else if (batStrategy === 'Rotating Strike') {
    wSingle += 15;
    wTwo += 8;
    wDot -= 10;
    wFour -= 5;
    wSix -= 5;
  }

  // 2. Bowling Delivery Tactic Impact
  if (deliveryTactic === 'Yorker') {
    wDot += 12;
    wWicket += 8;
    wFour -= 8;
    wSix -= 7;
  } else if (deliveryTactic === 'Bouncer') {
    wDot += 8;
    wWicket += 6;
    wSix += 4;
  } else if (deliveryTactic === 'Swing') {
    wWicket += 8;
    wDot += 6;
    wTwo -= 4;
  } else if (deliveryTactic === 'Slower ball') {
    wDot += 8;
    wWicket += 7;
    wSix -= 4;
  } else if (deliveryTactic === 'Off-spin') {
    wDot += 8;
    wWicket += 6;
    wTwo -= 3;
  } else if (deliveryTactic === 'Leg-spin') {
    wWicket += 7;
    wDot += 6;
  }

  // 3. Field Placement Influence
  if (ringCount >= 7) {
    wSingle -= 8;
    wDot += 8;
  }
  if (deepCount >= 4) {
    wFour -= 6;
    wSix -= 5;
    wSingle += 4;
    wTwo += 3;
  } else if (deepCount <= 2) {
    wFour += 8;
    wSix += 4;
  }

  wDot = Math.max(5, wDot);
  wSingle = Math.max(5, wSingle);
  wTwo = Math.max(3, wTwo);
  wFour = Math.max(3, wFour);
  wSix = Math.max(1, wSix);
  wWicket = Math.max(2, wWicket);

  const totalWeight = wDot + wSingle + wTwo + wFour + wSix + wWicket;
  const rand = Math.random() * totalWeight;

  let chosenOutcome = null;

  if (rand < wDot) {
    let comm = '';
    if (deliveryTactic === 'Yorker') {
      comm = `${bowlerName}'s pinpoint Yorker thumps into the toe of the bat! Defensive block, no run.`;
    } else if (deliveryTactic === 'Bouncer') {
      comm = `Fierce Bouncer whistling past the helmet! ${strikerName} sways out of the way just in time.`;
    } else if (deliveryTactic === 'Swing') {
      comm = `Sensational late outswing! Beats the outside edge with Slips waiting eagerly!`;
    } else if (ringCount >= 7) {
      comm = `Punched into the off-side, but the packed 30-yard ring field at Point prevents the single.`;
    } else {
      comm = `Good length delivery on off stump, defended solidly into the covers. Dot ball.`;
    }
    chosenOutcome = { ball: '0', runs: 0, isWicket: false, badge: 'DOT', commentary: comm };
  } else if (rand < wDot + wSingle) {
    let comm = '';
    if (batStrategy === 'Rotating Strike') {
      comm = `Classic strike rotation! ${strikerName} drops it softly at Mid-on and scampers through for a sharp single.`;
    } else if (positionSet.has('Midwicket')) {
      comm = `Turned off the hips toward Midwicket for a comfortable single.`;
    } else {
      comm = `Pushed into the vacant gap on the off side, easily jogged through for one.`;
    }
    chosenOutcome = { ball: '1', runs: 1, isWicket: false, badge: 'SINGLE', commentary: comm };
  } else if (rand < wDot + wSingle + wTwo) {
    let comm = '';
    if (!hasDeepCover && !hasDeepMidwicket) {
      comm = `Found the big vacant gap between deep fielders! Hard running between wickets yields a comfortable brace!`;
    } else {
      comm = `Driven wide of Long-on, good fielding in the deep keeps it down to TWO.`;
    }
    chosenOutcome = { ball: '2', runs: 2, isWicket: false, badge: 'TWO', commentary: comm };
  } else if (rand < wDot + wSingle + wTwo + wFour) {
    let comm = '';
    if (!hasSlips && (deliveryTactic === 'Swing' || deliveryTactic === 'Seam')) {
      comm = `Thick outside edge! No slips in place and the ball races away past third man for FOUR!`;
    } else if (!hasDeepCover && batStrategy === 'Aggressive') {
      comm = `CRACK! Aggressive cover drive pierces the inner ring and whistles away to the vacant Deep Cover boundary!`;
    } else if (deepCount <= 2) {
      comm = `Powerplay exploited! Lofted cleanly over Mid-off's head, one bounce and over the rope for FOUR!`;
    } else {
      comm = `GLORIOUS SHOT! Timed to absolute perfection through the gap between Extra Cover and Mid-off for FOUR!`;
    }
    chosenOutcome = { ball: '4', runs: 4, isWicket: false, badge: 'FOUR', commentary: comm };
  } else if (rand < wDot + wSingle + wTwo + wFour + wSix) {
    let comm = '';
    if (batStrategy === 'Power Hitter') {
      comm = `STAND AND DELIVER! Power Hitter flexes his muscles, sending a colossal 105m blast into the top tier for SIX!`;
    } else if (!hasLongOn) {
      comm = `Smoked straight back down the ground! No Long-on to protect the rope and that sails high and handsome for SIX!`;
    } else {
      comm = `HIGH, HANDSOME AND GONE! Dispatched into the Kolkata night sky over deep square leg for a monstrous SIX!`;
    }
    chosenOutcome = { ball: '6', runs: 6, isWicket: false, badge: 'SIX', commentary: comm };
  } else {
    let comm = '';
    if (hasSlips && (deliveryTactic === 'Swing' || deliveryTactic === 'Seam' || deliveryTactic === 'Leg-spin')) {
      const slipPos = positionSet.has('Second Slip') ? 'Second Slip' : 'First Slip';
      comm = `OUT! Edged and taken at ${slipPos}! Brilliant swing bowling combined with attacking slip cordon produces the breakthrough!`;
    } else if ((hasDeepMidwicket || hasLongOn || hasLongOff) && (batStrategy === 'Aggressive' || batStrategy === 'Power Hitter' || deliveryTactic === 'Slower ball')) {
      const deepPos = hasDeepMidwicket ? 'Deep Midwicket' : (hasLongOn ? 'Long-on' : 'Long-off');
      comm = `CAUGHT! Batter went for the big heave against the ${deliveryTactic}, but ${deepPos} was placed right on the boundary cushion to swallow it!`;
    } else if (deliveryTactic === 'Yorker') {
      comm = `OUT! TIMBER! Blistering 145km/h Yorker crashes through the defense and uproots middle stump!`;
    } else if (ringCount >= 7 && batStrategy === 'Rotating Strike') {
      comm = `RUN OUT! Desperate call for a single against the packed ring field, Mid-off scores a direct hit at the bowler's end!`;
    } else {
      comm = `WICKET! Clean bowled! Fiery seam delivery nips back through the gate to end ${strikerName}'s innings!`;
    }
    chosenOutcome = { ball: 'W', runs: 0, isWicket: true, badge: 'WICKET', commentary: comm };
  }

  // Update match overs
  const currentOvers = match.teamA.overs;
  const wholeOvers = Math.floor(currentOvers);
  const ballsInOver = Math.round((currentOvers - wholeOvers) * 10);

  let newOvers;
  if (ballsInOver >= 5) {
    newOvers = wholeOvers + 1.0;
  } else {
    newOvers = Number((wholeOvers + (ballsInOver + 1) * 0.1).toFixed(1));
  }

  match.teamA.overs = newOvers;
  match.teamA.score += chosenOutcome.runs;
  if (chosenOutcome.isWicket) {
    match.teamA.wickets = Math.min(10, match.teamA.wickets + 1);
  }

  if (match.currentStriker) {
    match.currentStriker.runs += chosenOutcome.runs;
    match.currentStriker.balls += 1;
    if (chosenOutcome.badge === 'FOUR') match.currentStriker.fours += 1;
    if (chosenOutcome.badge === 'SIX') match.currentStriker.sixes += 1;
  }

  if (match.currentBowler) {
    match.currentBowler.runs += chosenOutcome.runs;
    if (chosenOutcome.isWicket) match.currentBowler.wickets += 1;
  }

  match.recentBalls = match.recentBalls || [];
  match.recentBalls.unshift(chosenOutcome.ball);
  if (match.recentBalls.length > 8) match.recentBalls.pop();

  match.commentary = match.commentary || [];
  match.commentary.unshift({
    id: `comm_${Date.now()}`,
    over: newOvers.toFixed(1),
    text: `${strikerName} vs ${bowlerName}: ${chosenOutcome.commentary}`,
    badge: chosenOutcome.badge,
    timestamp: new Date()
  });
  if (match.commentary.length > 25) match.commentary.pop();

  // Check victory / conclusion
  if (match.teamA.score > match.teamB.score) {
    match.status = 'completed';
    match.result = `${match.teamA.name} won by ${10 - match.teamA.wickets} wickets!`;
  } else if (match.teamA.wickets >= 10 || newOvers >= match.teamA.maxOvers) {
    match.status = 'completed';
    if (match.teamA.score === match.teamB.score) {
      match.result = 'Match Tied! Heading to Super Over!';
    } else {
      match.result = `${match.teamB.name} won by ${match.teamB.score - match.teamA.score} runs!`;
    }
  }

  const updatedMatch = await updateMatch(match.matchId, match);
  return {
    success: true,
    outcome: chosenOutcome,
    match: updatedMatch
  };
};

// ==========================================
// PHASE 7: PHASER 3 AUTHORITATIVE GAMEPLAY ENGINE
// ==========================================

const VALID_SHOT_TYPES = [
  'Drive',
  'Lofted Drive',
  'Pull / Hook',
  'Cut',
  'Sweep',
  'Defensive Block',
  'Ramp / Scoop'
];

const VALID_TIMINGS = ['Early', 'Good', 'Perfect', 'Late'];

const playAuthoritativeDelivery = async (matchId, deliveryInput = {}) => {
  const match = await getMatchById(matchId);
  if (!match) {
    const err = new Error(`Match '${matchId}' not found.`);
    err.status = 404;
    throw err;
  }

  const {
    controlMode = 'manual',
    shotType = 'Drive',
    direction = 'Cover',
    timing = 'Good',
    deliveryTactic = 'Seam',
    pitchLine = 'Off Stump',
    pitchLength = 'Good Length',
    runsAttempted = 0
  } = deliveryInput;

  // Tactical auto-mode delegates to tactical engine
  if (controlMode === 'tactical') {
    return await simulateTacticalBall(matchId);
  }

  // Validate shot type
  if (shotType && !VALID_SHOT_TYPES.includes(shotType)) {
    const err = new Error(`Invalid shot type '${shotType}'. Valid: ${VALID_SHOT_TYPES.join(', ')}.`);
    err.status = 400;
    err.code = 'INVALID_SHOT_TYPE';
    throw err;
  }

  // Validate delivery tactic
  if (deliveryTactic && !DELIVERY_TACTICS.includes(deliveryTactic)) {
    const err = new Error(`Invalid delivery tactic '${deliveryTactic}'.`);
    err.status = 400;
    err.code = 'INVALID_DELIVERY_TACTIC';
    throw err;
  }

  // Validate timing
  if (timing && !VALID_TIMINGS.includes(timing)) {
    const err = new Error(`Invalid timing '${timing}'. Valid: ${VALID_TIMINGS.join(', ')}.`);
    err.status = 400;
    err.code = 'INVALID_TIMING';
    throw err;
  }

  const strikerName = match.currentStriker?.name || 'Striker';
  const bowlerName = match.currentBowler?.name || 'Bowler';

  const allPlayers = isMongoConnected() ? await Player.find() : memoryStore.players;
  const strikerPlayer = allPlayers.find(p => p.name === strikerName || p._id === match.currentStriker?.playerId) || {
    attributes: { batting: 90, powerHitting: 85, temperament: 90, fitness: 88, strikeRotation: 85 }
  };
  const bowlerPlayer = allPlayers.find(p => p.name === bowlerName || p._id === match.currentBowler?.playerId) || {
    attributes: { bowling: 90, pace: 88, swing: 85, spin: 80, deathBowling: 85 }
  };

  const batAttr = strikerPlayer.attributes || {};
  const bwlAttr = bowlerPlayer.attributes || {};

  let outcome = null;

  const isTimingPerfect = timing === 'Perfect';
  const isTimingGood = timing === 'Good';
  const isTimingLate = timing === 'Late';
  const isTimingEarly = timing === 'Early';

  const isBouncerHazard = pitchLength === 'Short' && (shotType === 'Drive' || shotType === 'Defensive Block');
  const isYorkerHazard = pitchLength === 'Yorker' && (shotType === 'Pull / Hook' || shotType === 'Sweep');
  const isSpinHazard = (deliveryTactic === 'Off-spin' || deliveryTactic === 'Leg-spin') && (shotType === 'Ramp / Scoop' || shotType === 'Lofted Drive') && !isTimingPerfect;

  if (isTimingPerfect) {
    if (shotType === 'Lofted Drive' || shotType === 'Pull / Hook') {
      outcome = {
        ball: '6',
        runs: 6,
        isWicket: false,
        wicketType: null,
        badge: 'SIX',
        commentary: `SWEET AS A NUT! ${strikerName} timed the ${shotType} with flawless perfection! Ball launched 98 meters over the ropes for a colossal SIX!`
      };
    } else if (shotType === 'Defensive Block') {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Solid as a rock. ${strikerName} plays a textbook ${shotType} right under the eyes, dead on the turf.`
      };
    } else {
      outcome = {
        ball: '4',
        runs: 4,
        isWicket: false,
        wicketType: null,
        badge: 'FOUR',
        commentary: `CRACK! Exquisite timing on the ${shotType}! Bisects the inner ring fielders and races like a tracer bullet for FOUR!`
      };
    }
  } else if (isTimingGood) {
    if (shotType === 'Lofted Drive') {
      const power = batAttr.powerHitting || 85;
      if (power >= 105) {
        outcome = {
          ball: '6',
          runs: 6,
          isWicket: false,
          wicketType: null,
          badge: 'SIX',
          commentary: `High and handsome! Power hitting clears the ropes by a couple of yards for a sensational SIX!`
        };
      } else {
        outcome = {
          ball: '4',
          runs: 4,
          isWicket: false,
          wicketType: null,
          badge: 'FOUR',
          commentary: `One bounce over the rope! Beautifully lofted ${shotType} into the vacant deep zone for FOUR!`
        };
      }
    } else if (shotType === 'Defensive Block') {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Defended softly onto the off side. Dot ball.`
      };
    } else {
      const runs = runsAttempted >= 2 ? 2 : 1;
      outcome = {
        ball: String(runs),
        runs,
        isWicket: false,
        wicketType: null,
        badge: runs === 2 ? 'TWO' : 'SINGLE',
        commentary: `Crisp ${shotType} placed into the outfield gap. Clean running between wickets yields ${runs} run${runs > 1 ? 's' : ''}.`
      };
    }
  } else if (isTimingLate || isTimingEarly) {
    if (pitchLine === 'Middle Stump' && (pitchLength === 'Yorker' || deliveryTactic === 'Yorker') && isTimingLate) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'LBW',
        badge: 'WICKET',
        commentary: `OUT! LBW! Trapped right in front of middle stump by the searing Yorker! Umpire's finger goes straight up!`
      };
    } else if (isYorkerHazard || (pitchLength === 'Yorker' && isTimingLate)) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Bowled',
        badge: 'WICKET',
        commentary: `OUT! BOWLED! ${bowlerName}'s deadly Yorker sneaks under the late bat and shatters the off-stump! Timber!`
      };
    } else if (isSpinHazard) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Stumped',
        badge: 'WICKET',
        commentary: `OUT! STUMPED! ${strikerName} stepped down the track, deceived by the sharp turn, and the wicketkeeper whips off the bails in a flash!`
      };
    } else if (isBouncerHazard || isTimingEarly) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Caught',
        badge: 'WICKET',
        commentary: `OUT! CAUGHT! Leading edge loops softly into the air and the fielder takes a regulation catch!`
      };
    } else if (isTimingLate && (deliveryTactic === 'Swing' || deliveryTactic === 'Seam')) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Caught',
        badge: 'WICKET',
        commentary: `OUT! CAUGHT BEHIND! Feather of an outside edge through to the wicketkeeper! Superb bowling by ${bowlerName}!`
      };
    } else {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Mistimed stroke! Beaten for pace and movement. Dot ball.`
      };
    }
  }

  // Check Run-Out when running 2 or 3
  if (runsAttempted >= 2 && !outcome.isWicket && outcome.runs > 0) {
    const fitness = batAttr.fitness || 85;
    const runningChance = Math.random() * 100;
    if (deliveryInput.riskyRun || (fitness < 80 && runningChance > 70)) {
      outcome = {
        ball: 'W',
        runs: 1,
        isWicket: true,
        wicketType: 'Run Out',
        badge: 'WICKET',
        commentary: `OUT! RUN OUT! Risky second run attempted! Fielder throws down the stumps with a direct hit before the batter can ground the bat!`
      };
    }
  }

  // Update match state
  const currentOvers = match.teamA.overs;
  const wholeOvers = Math.floor(currentOvers);
  const ballsInOver = Math.round((currentOvers - wholeOvers) * 10);

  let newOvers;
  if (ballsInOver >= 5) {
    newOvers = wholeOvers + 1.0;
  } else {
    newOvers = Number((wholeOvers + (ballsInOver + 1) * 0.1).toFixed(1));
  }

  match.teamA.overs = newOvers;
  match.teamA.score += outcome.runs;
  if (outcome.isWicket) {
    match.teamA.wickets = Math.min(10, match.teamA.wickets + 1);
  }

  if (match.currentStriker) {
    match.currentStriker.runs += outcome.runs;
    match.currentStriker.balls += 1;
    if (outcome.badge === 'FOUR') match.currentStriker.fours += 1;
    if (outcome.badge === 'SIX') match.currentStriker.sixes += 1;
  }

  if (match.currentBowler) {
    match.currentBowler.runs += outcome.runs;
    if (outcome.isWicket) match.currentBowler.wickets += 1;
  }

  match.recentBalls = match.recentBalls || [];
  match.recentBalls.unshift(outcome.ball);
  if (match.recentBalls.length > 8) match.recentBalls.pop();

  match.commentary = match.commentary || [];
  match.commentary.unshift({
    id: `comm_${Date.now()}`,
    over: newOvers.toFixed(1),
    text: `${strikerName} vs ${bowlerName}: ${outcome.commentary}`,
    badge: outcome.badge,
    timestamp: new Date()
  });
  if (match.commentary.length > 25) match.commentary.pop();

  if (match.teamA.score > match.teamB.score) {
    match.status = 'completed';
    match.result = `${match.teamA.name} won by ${10 - match.teamA.wickets} wickets!`;
  } else if (match.teamA.wickets >= 10 || newOvers >= match.teamA.maxOvers) {
    match.status = 'completed';
    if (match.teamA.score === match.teamB.score) {
      match.result = 'Match Tied! Heading to Super Over!';
    } else {
      match.result = `${match.teamB.name} won by ${match.teamB.score - match.teamA.score} runs!`;
    }
  }

  const updatedMatch = await updateMatch(match.matchId, match);

  const visualPayload = {
    shotType,
    direction,
    timing,
    pitchLine,
    pitchLength,
    deliveryTactic,
    runs: outcome.runs,
    isWicket: outcome.isWicket,
    wicketType: outcome.wicketType,
    badge: outcome.badge,
    commentary: outcome.commentary
  };

  return {
    success: true,
    outcome,
    match: updatedMatch,
    deliveryData: visualPayload
  };
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

const createTournament = async (tournamentData) => {
  if (isMongoConnected()) {
    const created = new Tournament(tournamentData);
    return await created.save();
  }
  const item = {
    _id: `tour_${Date.now()}`,
    ...tournamentData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.tournaments.push(item);
  return item;
};

const updateTournament = async (tournamentId, updateFields) => {
  if (isMongoConnected()) {
    return await Tournament.findOneAndUpdate(
      { tournamentId },
      { $set: updateFields },
      { new: true }
    );
  }
  const idx = memoryStore.tournaments.findIndex(t => t.tournamentId === tournamentId || t._id === tournamentId);
  if (idx === -1) return null;
  memoryStore.tournaments[idx] = {
    ...memoryStore.tournaments[idx],
    ...updateFields,
    updatedAt: new Date()
  };
  return memoryStore.tournaments[idx];
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
  updatePlayer,
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
  getTournamentById,
  createTournament,
  updateTournament,
  // Live Auction Engine
  getFormatPurse,
  initAuctionForRoom,
  getAuctionState,
  nominatePlayerForAuction,
  placeAuctionBid,
  useT2Veto,
  hammerCurrentLot,
  startUnsoldRound,
  nominateRandomPlayer,
  updateAuctionSettings,
  withRoomLock,
  // Phase 5: Franchise & Squad Management
  getDefaultSquadLimits,
  calculateSquadMetrics,
  populateTeamSquad,
  getOrCreateUserFranchise,
  getFranchiseTeamsByRoom,
  updateTeamSelection,
  swapTeamPlayers,
  updateRoomSquadLimits,
  // Phase 6: Tactical Management
  OFFICIAL_FIELD_POSITIONS,
  BATTING_STRATEGIES,
  BOWLER_ROLES,
  DELIVERY_TACTICS,
  FIELD_PRESETS,
  getFormatMaxBowlerOvers,
  getFieldPresetPositions,
  validateFieldPlacement,
  validateBowlerOvers,
  getDefaultTeamTactics,
  getTeamTactics,
  updateTeamTactics,
  getMatchTactics,
  updateMatchTactics,
  updateMatch,
  simulateTacticalBall,
  // Phase 7: Phaser 3 Authoritative Delivery Engine
  VALID_SHOT_TYPES,
  VALID_TIMINGS,
  playAuthoritativeDelivery,
  getStadiumById
};


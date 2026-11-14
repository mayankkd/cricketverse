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
const bcrypt = require('bcryptjs');

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
    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }
    return await Player.find(query).sort({ overallRating: -1 });
  }
  let players = [...memoryStore.players];
  if (filters.role && filters.role !== 'All') {
    players = players.filter(p => p.role.toLowerCase() === filters.role.toLowerCase());
  }
  if (filters.cardTier && filters.cardTier !== 'All') {
    players = players.filter(p => p.cardTier.toLowerCase() === filters.cardTier.toLowerCase());
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    players = players.filter(p => p.name.toLowerCase().includes(term) || p.country.toLowerCase().includes(term));
  }
  return players.sort((a, b) => b.overallRating - a.overallRating);
};

const getPlayerById = async (id) => {
  if (isMongoConnected()) {
    return await Player.findById(id);
  }
  return memoryStore.players.find(p => p._id === id) || null;
};

// Room operations
const getAllRooms = async () => {
  if (isMongoConnected()) {
    return await Room.find().sort({ createdAt: -1 });
  }
  return memoryStore.rooms;
};

const getRoomByCode = async (roomCode) => {
  if (isMongoConnected()) {
    return await Room.findOne({ roomCode: roomCode.toUpperCase() });
  }
  return memoryStore.rooms.find(r => r.roomCode.toUpperCase() === roomCode.toUpperCase()) || null;
};

const createRoom = async (roomData) => {
  if (isMongoConnected()) {
    const newRoom = new Room(roomData);
    return await newRoom.save();
  }
  const newRoom = {
    _id: `room_${Date.now()}`,
    ...roomData,
    roomCode: (roomData.roomCode || `CRIC-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
    participants: roomData.participants || [],
    chatMessages: roomData.chatMessages || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.rooms.unshift(newRoom);
  return newRoom;
};

const updateRoom = async (roomCode, updateFields) => {
  if (isMongoConnected()) {
    return await Room.findOneAndUpdate({ roomCode: roomCode.toUpperCase() }, { $set: updateFields }, { new: true });
  }
  const idx = memoryStore.rooms.findIndex(r => r.roomCode.toUpperCase() === roomCode.toUpperCase());
  if (idx === -1) return null;
  memoryStore.rooms[idx] = {
    ...memoryStore.rooms[idx],
    ...updateFields,
    updatedAt: new Date()
  };
  return memoryStore.rooms[idx];
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
  getAllRooms,
  getRoomByCode,
  createRoom,
  updateRoom,
  addRoomChatMessage,
  getTeams,
  getTeamById,
  updateTeam,
  getMatches,
  getMatchById,
  getTournaments,
  getTournamentById
};


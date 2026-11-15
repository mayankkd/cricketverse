const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: {
    type: String,
    enum: ['player', 'spectator'],
    default: 'player'
  },
  teamName: { type: String, default: 'Spectator Dugout' },
  isReady: { type: Boolean, default: false },
  isHost: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  socketId: { type: String, default: null },
  budgetRemaining: { type: Number, default: 1000000000 },
  squad: [{ type: String }], // Player IDs
  joinedAt: { type: Date, default: Date.now }
});

const chatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true },
  senderRole: { type: String, enum: ['player', 'spectator', 'host', 'system'], default: 'player' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const invitationSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  isRevoked: { type: Boolean, default: false },
  password: { type: String, default: '' }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Room title is required'],
    trim: true
  },
  hostId: {
    type: String,
    required: true
  },
  hostUsername: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'auction', 'match', 'completed'],
    default: 'waiting'
  },
  format: {
    type: String,
    enum: ['T20', 'ODI', 'The Hundred', 'Super Over'],
    default: 'T20'
  },
  minPlayers: {
    type: Number,
    default: 2 // Fixed minimum required active players to start
  },
  maxPlayers: {
    type: Number,
    default: 6 // Fixed maximum 6 active players allowed
  },
  maxTeams: {
    type: Number,
    default: 6 // Backward compatibility
  },
  budgetPerTeam: {
    type: Number,
    default: 1000000000 // 100 Crores
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: ''
  },
  allowSpectators: {
    type: Boolean,
    default: true
  },
  allowPlayerJoining: {
    type: Boolean,
    default: true
  },
  spectatorChatEnabled: {
    type: Boolean,
    default: true
  },
  invitation: {
    type: invitationSchema,
    default: null
  },
  participants: [participantSchema],
  chatMessages: [chatMessageSchema]
}, {
  timestamps: true
});

// Helper virtuals
roomSchema.virtual('activePlayersCount').get(function () {
  return (this.participants || []).filter(p => p.role === 'player').length;
});

roomSchema.virtual('spectatorsCount').get(function () {
  return (this.participants || []).filter(p => p.role === 'spectator').length;
});

roomSchema.virtual('canStart').get(function () {
  const activeCount = (this.participants || []).filter(p => p.role === 'player').length;
  return activeCount >= (this.minPlayers || 2);
});

module.exports = mongoose.model('Room', roomSchema);

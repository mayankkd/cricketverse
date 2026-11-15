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
  budgetRemaining: { type: Number, default: 30 }, // Fixed purse in points: Test: 50, ODI: 40, T20: 30
  squad: [{ type: String }], // Card IDs won
  t2VetoTokens: { type: Number, default: 2 }, // Fixed rule: exactly 2 T2 Veto tokens per participant
  vetoedPlayers: [{ type: String }], // Unique cricketer playerIds vetoed by this participant
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

const auctionLotSchema = new mongoose.Schema({
  cardId: { type: String, required: true },
  playerId: { type: String, required: true }, // Real-world unique cricketer ID (e.g. cric_virat_kohli)
  playerName: { type: String, required: true },
  playerImage: { type: String },
  country: { type: String },
  countryFlag: { type: String },
  role: { type: String },
  format: { type: String },
  cardVariant: { type: String },
  ovr: { type: mongoose.Schema.Types.Mixed },
  startingPrice: { type: Number, default: 1 }, // EVERY CARD STARTS AT EXACTLY 1 POINT
  currentBid: { type: Number, default: 1 },
  bidIncrement: { type: Number, default: 1 },
  highestBidderId: { type: String, default: null },
  highestBidderUsername: { type: String, default: null },
  highestBidderTeam: { type: String, default: null },
  status: {
    type: String,
    enum: ['available', 'nominated', 'sold', 'unsold', 'vetoed'],
    default: 'nominated'
  },
  timerRemaining: { type: Number, default: 15 },
  timerExpiresAt: { type: Date },
  nominatedBy: { type: String },
  nominatedAt: { type: Date, default: Date.now }
}, { _id: false });

const auctionBidSchema = new mongoose.Schema({
  id: { type: String, required: true },
  bidderId: { type: String, required: true },
  bidderUsername: { type: String, required: true },
  bidderTeam: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const auctionStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['idle', 'active', 'paused', 'completed'],
    default: 'idle'
  },
  format: { type: String, default: 'T20' },
  initialPurse: { type: Number, default: 30 }, // Test: 50, ODI: 40, T20: 30
  bidIncrement: { type: Number, default: 1 }, // Host configurable, default 1 point
  currentLot: { type: auctionLotSchema, default: null },
  nominatedPlayerIds: [{ type: String }], // Real-world cricketer playerIds nominated in this auction (Sold, Unsold, or Vetoed)
  soldLots: [{
    lot: auctionLotSchema,
    finalPrice: Number,
    buyerId: String,
    buyerUsername: String,
    buyerTeam: String,
    timestamp: { type: Date, default: Date.now }
  }],
  unsoldLots: [{
    lot: auctionLotSchema,
    timestamp: { type: Date, default: Date.now }
  }],
  vetoedLots: [{
    lot: auctionLotSchema,
    vetoedBy: String,
    vetoedByUsername: String,
    timestamp: { type: Date, default: Date.now }
  }],
  unsoldRoundActive: { type: Boolean, default: false },
  bidHistory: [auctionBidSchema],
  spendingHistory: [{
    userId: String,
    teamName: String,
    playerId: String,
    playerName: String,
    cardVariant: String,
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  vetoHistory: [{
    userId: String,
    username: String,
    playerId: String,
    playerName: String,
    cardVariant: String,
    timestamp: { type: Date, default: Date.now }
  }],
  replayLogs: [{
    event: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  turnOrder: [{ type: String }], // User IDs for turn-based nomination
  currentTurnIndex: { type: Number, default: 0 },
  nominationMode: {
    type: String,
    enum: ['manual', 'rotating', 'random'],
    default: 'rotating'
  }
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
    enum: ['T20', 'ODI', 'Test', 'The Hundred', 'Super Over'],
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
    default: 6
  },
  budgetPerTeam: {
    type: Number,
    default: 30 // Test: 50, ODI: 40, T20: 30 points
  },
  squadLimits: {
    test: { type: Number, default: 15 },
    odi: { type: Number, default: 15 },
    t20: { type: Number, default: 13 },
    maxSquadSize: { type: Number, default: 15 },
    playingXISize: { type: Number, default: 11 }
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
  stadiumId: {
    type: String,
    default: 'lords'
  },
  stadium: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  invitation: {
    type: invitationSchema,
    default: null
  },
  participants: [participantSchema],
  chatMessages: [chatMessageSchema],
  auctionState: {
    type: auctionStateSchema,
    default: () => ({})
  }
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

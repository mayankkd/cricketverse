const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    default: 'Eden Gardens, Kolkata (Night)'
  },
  format: {
    type: String,
    default: 'T20'
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'innings_break', 'completed'],
    default: 'upcoming'
  },
  teamA: {
    name: { type: String, required: true },
    shortCode: { type: String, required: true },
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    maxOvers: { type: Number, default: 20 },
    color: { type: String, default: '#F59E0B' }
  },
  teamB: {
    name: { type: String, required: true },
    shortCode: { type: String, required: true },
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    maxOvers: { type: Number, default: 20 },
    color: { type: String, default: '#3B82F6' }
  },
  toss: {
    winner: { type: String, default: 'Team A' },
    decision: { type: String, default: 'bat' }
  },
  currentInnings: {
    type: Number,
    default: 1
  },
  currentStriker: {
    name: { type: String, default: 'Virat Kohli' },
    runs: { type: Number, default: 54 },
    balls: { type: Number, default: 32 },
    fours: { type: Number, default: 5 },
    sixes: { type: Number, default: 2 }
  },
  currentNonStriker: {
    name: { type: String, default: 'Glenn Maxwell' },
    runs: { type: Number, default: 28 },
    balls: { type: Number, default: 14 },
    fours: { type: Number, default: 2 },
    sixes: { type: Number, default: 2 }
  },
  currentBowler: {
    name: { type: String, default: 'Jasprit Bumrah' },
    overs: { type: Number, default: 3.2 },
    maidens: { type: Number, default: 0 },
    runs: { type: Number, default: 24 },
    wickets: { type: Number, default: 2 }
  },
  recentBalls: [{
    type: String // e.g. "1", "4", "0", "W", "6", "2"
  }],
  commentary: [{
    id: String,
    over: String,
    text: String,
    badge: String, // 'SIX', 'FOUR', 'WICKET', 'DOT', 'SINGLE'
    timestamp: Date
  }],
  wormData: [{
    over: Number,
    teamAScore: Number,
    teamBScore: Number,
    requiredRate: Number
  }],
  result: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);


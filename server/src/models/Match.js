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
  },
  tacticalBreak: {
    type: String,
    enum: ['pre_match', 'over_break', 'innings_break', 'tactical_break', 'live'],
    default: 'live'
  },
  seed: {
    type: String,
    default: 'cricketverse_seed_2026'
  },
  seq: {
    type: Number,
    default: 0
  },
  targetScore: {
    type: Number,
    default: null
  },
  battingTeamKey: {
    type: String,
    default: 'teamA'
  },
  bowlingTeamKey: {
    type: String,
    default: 'teamB'
  },
  battingUserId: {
    type: String,
    default: null
  },
  bowlingUserId: {
    type: String,
    default: null
  },
  turnPhase: {
    type: String,
    enum: ['waiting_bowling', 'waiting_batting', 'resolving', 'innings_break', 'completed'],
    default: 'waiting_bowling'
  },
  participants: [{
    userId: String,
    username: String,
    role: { type: String, enum: ['player', 'spectator'], default: 'player' },
    teamKey: String,
    socketId: String,
    isConnected: { type: Boolean, default: true }
  }],
  teamATactics: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  teamBTactics: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  stadium: {
    id: { type: String, default: 'eden_gardens' },
    name: { type: String, default: 'Eden Gardens' },
    city: { type: String, default: 'Kolkata' },
    country: { type: String, default: 'India' },
    pitchType: { type: String, enum: ['Green', 'Flat', 'Dry', 'Turning', 'Cracked'], default: 'Turning' },
    paceSupport: { type: Number, default: 65 },
    spinSupport: { type: Number, default: 85 },
    bounce: { type: String, enum: ['Low', 'True', 'Variable', 'Steep'], default: 'True' },
    boundaryDimensions: {
      straight: { type: Number, default: 72 },
      square: { type: Number, default: 68 }
    },
    historicalScores: {
      testAvg1stInn: { type: Number, default: 325 },
      odiAvg1stInn: { type: Number, default: 260 },
      t20Avg1stInn: { type: Number, default: 175 }
    },
    dewConditions: {
      hasEveningDew: { type: Boolean, default: true },
      dewFactor: { type: Number, default: 0.35 }
    }
  },
  weather: {
    condition: { type: String, enum: ['Clear', 'Overcast', 'Rain', 'Humid', 'Windy'], default: 'Clear' },
    temperature: { type: Number, default: 29 },
    windSpeedKmH: { type: Number, default: 14 },
    windDirection: { type: String, default: 'Crosswind' },
    humidityPercent: { type: Number, default: 65 },
    isDLSActive: { type: Boolean, default: false },
    dlsDetails: {
      originalOvers: { type: Number, default: 50 },
      revisedOvers: { type: Number, default: 50 },
      parScore: { type: Number, default: 0 },
      targetAdjustment: { type: Number, default: 0 }
    }
  },
  testDetails: {
    day: { type: Number, default: 1 },
    session: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Morning' },
    sessionOvers: { type: Number, default: 0 },
    totalOversInDay: { type: Number, default: 0 },
    maxOversPerDay: { type: Number, default: 90 },
    followOnEnforced: { type: Boolean, default: false },
    declarations: [{
      innings: Number,
      teamKey: String,
      score: Number,
      wickets: Number,
      overs: Number,
      declaredAt: Date
    }],
    pitchDeteriorationLevel: { type: Number, default: 1 }
  },
  tacticalTimeouts: {
    teamATimeoutsUsed: { type: Number, default: 0 },
    teamBTimeoutsUsed: { type: Number, default: 0 },
    isTimeoutActive: { type: Boolean, default: false },
    timeoutRemainingSec: { type: Number, default: 0 }
  },
  inningsHistory: [{
    innings: Number,
    teamKey: String,
    teamName: String,
    score: Number,
    wickets: Number,
    overs: Number,
    declared: Boolean,
    lead: Number
  }],
  bowlerFatigue: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);


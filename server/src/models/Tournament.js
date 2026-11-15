const mongoose = require('mongoose');

const standingSchema = new mongoose.Schema({
  teamName: String,
  shortCode: String,
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  tied: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  nrr: { type: Number, default: 0.00 },
  form: [{ type: String }] // ['W', 'W', 'L', 'W', 'L']
});

const fixtureSchema = new mongoose.Schema({
  id: String,
  matchNo: Number,
  team1: String,
  team2: String,
  venue: String,
  date: String,
  status: { type: String, default: 'upcoming' },
  result: String
});

const tournamentSchema = new mongoose.Schema({
  tournamentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  edition: {
    type: String,
    default: 'Season 2026'
  },
  status: {
    type: String,
    enum: ['registration', 'group_stage', 'playoffs', 'finals', 'completed'],
    default: 'group_stage'
  },
  format: {
    type: String,
    default: 'IPL Round Robin + Playoffs'
  },
  gameMode: {
    type: String,
    enum: [
      'Auction League',
      'World Cup',
      'Legends',
      'Practice',
      'Super Over',
      'Draft',
      'Historical Challenges',
      'Rivalry Matches',
      'Scenario Challenges',
      'Custom Tournaments'
    ],
    default: 'Auction League'
  },
  maxTeams: {
    type: Number,
    min: 2,
    max: 6,
    default: 6
  },
  prizePool: {
    type: Number,
    default: 500000000 // ₹50 Cr
  },
  teams: [{
    id: String,
    name: String,
    shortCode: String,
    logo: String
  }],
  standings: [standingSchema],
  fixtures: [fixtureSchema],
  playoffs: {
    qualifier1: { team1: String, team2: String, winner: String },
    eliminator: { team1: String, team2: String, winner: String },
    qualifier2: { team1: String, team2: String, winner: String },
    final: { team1: String, team2: String, winner: String }
  },
  awards: {
    orangeCap: {
      name: { type: String, default: 'Virat Kohli' },
      team: { type: String, default: 'Bangalore Royal Titans' },
      runs: { type: Number, default: 741 },
      balls: { type: Number, default: 478 },
      photoUrl: { type: String, default: '' }
    },
    purpleCap: {
      name: { type: String, default: 'Jasprit Bumrah' },
      team: { type: String, default: 'Mumbai Kings XI' },
      wickets: { type: Number, default: 22 },
      overs: { type: String, default: '54.2' },
      runs: { type: Number, default: 352 },
      photoUrl: { type: String, default: '' }
    },
    mvp: {
      name: { type: String, default: 'Virat Kohli' },
      team: { type: String, default: 'Bangalore Royal Titans' },
      points: { type: Number, default: 312 },
      photoUrl: { type: String, default: '' }
    },
    mostSixes: [{
      name: String,
      team: String,
      sixes: Number
    }],
    mostWickets: [{
      name: String,
      team: String,
      wickets: Number
    }],
    bestCaptain: {
      name: { type: String, default: 'Virat Kohli' },
      team: { type: String, default: 'Bangalore Royal Titans' },
      winRate: { type: Number, default: 71.4 },
      trophies: { type: Number, default: 2 }
    }
  },
  rules: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      oversPerMatch: 20,
      enableByes: true,
      hasPlayoffs: true,
      hasSuperOver: true
    })
  },
  scenarioData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);


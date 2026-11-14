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
  prizePool: {
    type: Number,
    default: 500000000 // ₹50 Cr
  },
  standings: [standingSchema],
  fixtures: [fixtureSchema],
  playoffs: {
    qualifier1: { team1: String, team2: String, winner: String },
    eliminator: { team1: String, team2: String, winner: String },
    qualifier2: { team1: String, team2: String, winner: String },
    final: { team1: String, team2: String, winner: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: '🏏'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  ownerId: {
    type: String,
    required: true
  },
  ownerUsername: {
    type: String,
    required: true
  },
  roomCode: {
    type: String,
    uppercase: true,
    trim: true,
    default: ''
  },
  format: {
    type: String,
    enum: ['Test', 'ODI', 'T20', 'The Hundred', 'Super Over'],
    default: 'T20'
  },
  squadLimits: {
    test: { type: Number, default: 15 },
    odi: { type: Number, default: 15 },
    t20: { type: Number, default: 13 },
    maxSquadSize: { type: Number, default: 15 },
    playingXISize: { type: Number, default: 11 }
  },
  primaryColor: {
    type: String,
    default: '#F59E0B'
  },
  secondaryColor: {
    type: String,
    default: '#1E293B'
  },
  squad: [{
    type: String // Player card IDs
  }],
  playingXI: [{
    type: String // Exactly 11 Player card IDs
  }],
  battingOrder: [{
    type: String // Player IDs in batting order 1–11
  }],
  bowlingOrder: [{
    type: String // Player IDs in bowling order
  }],
  captainId: {
    type: String,
    default: null
  },
  viceCaptainId: {
    type: String,
    default: null
  },
  wicketKeeperId: {
    type: String,
    default: null
  },
  chemistryScore: {
    type: Number,
    default: 85
  },
  overallRating: {
    type: Number,
    default: 88
  },
  battingRating: {
    type: Number,
    default: 85
  },
  bowlingRating: {
    type: Number,
    default: 85
  },
  fieldingRating: {
    type: Number,
    default: 85
  },
  fitnessRating: {
    type: Number,
    default: 90
  },
  totalSpending: {
    type: Number,
    default: 0
  },
  remainingPurse: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);



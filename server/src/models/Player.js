const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  countryFlag: {
    type: String,
    default: '🇮🇳'
  },
  role: {
    type: String,
    enum: ['Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'],
    required: true
  },
  battingStyle: {
    type: String,
    default: 'Right-hand bat'
  },
  bowlingStyle: {
    type: String,
    default: 'Right-arm medium fast'
  },
  overallRating: {
    type: Number,
    required: true,
    min: 50,
    max: 99
  },
  cardTier: {
    type: String,
    enum: ['ICON', 'DIAMOND', 'GOLD', 'SILVER', 'EMERGING'],
    default: 'GOLD'
  },
  stats: {
    bat: { type: Number, required: true }, // Batting skill
    bwl: { type: Number, required: true }, // Bowling skill
    fld: { type: Number, required: true }, // Fielding
    pwr: { type: Number, required: true }, // Six hitting / power
    clu: { type: Number, required: true }, // Clutch / death overs
    ldr: { type: Number, required: true }  // Leadership / captaincy
  },
  basePrice: {
    type: Number,
    default: 20000000 // In INR (e.g. 2 Crore)
  },
  currentPrice: {
    type: Number,
    default: 20000000
  },
  franchise: {
    type: String,
    default: 'Unsold'
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  jerseyNumber: {
    type: Number,
    default: 18
  },
  specialTraits: [{
    type: String
  }],
  isAvailableForAuction: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);

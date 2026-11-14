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
  ownerId: {
    type: String,
    required: true
  },
  ownerUsername: {
    type: String,
    required: true
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
    type: String // Player IDs
  }],
  playingXI: [{
    type: String // 11 Player IDs
  }],
  captainId: {
    type: String,
    default: null
  },
  viceCaptainId: {
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);


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
  },
  tactics: {
    batting: {
      teamStrategy: {
        type: String,
        enum: ['Aggressive', 'Balanced', 'Defensive', 'Anchor', 'Power Hitter', 'Rotating Strike'],
        default: 'Balanced'
      },
      batterInstructions: [{
        playerId: { type: String, required: true },
        playerName: { type: String },
        battingPosition: { type: Number },
        strategy: {
          type: String,
          enum: ['Aggressive', 'Balanced', 'Defensive', 'Anchor', 'Power Hitter', 'Rotating Strike'],
          default: 'Balanced'
        },
        aggressionLevel: { type: Number, default: 50 },
        intent: { type: String, default: 'Standard' }
      }]
    },
    bowling: {
      bowlerAssignments: [{
        playerId: { type: String, required: true },
        playerName: { type: String },
        role: {
          type: String,
          enum: ['Opening bowlers', 'First-change bowlers', 'Middle-over specialists', 'Death-over specialists'],
          default: 'Middle-over specialists'
        },
        deliveryTactic: {
          type: String,
          enum: ['Yorker', 'Bouncer', 'Swing', 'Seam', 'Slower ball', 'Off-spin', 'Leg-spin'],
          default: 'Seam'
        },
        oversAllocated: { type: Number, default: 4 },
        oversBowled: { type: Number, default: 0 }
      }],
      plannedPhases: {
        powerplayBowlers: [{ type: String }],
        middleOversBowlers: [{ type: String }],
        deathOversBowlers: [{ type: String }]
      }
    },
    fieldPlacement: {
      preset: {
        type: String,
        enum: ['Attacking', 'Defensive', 'Powerplay', 'Spin', 'Death overs', 'Custom'],
        default: 'Powerplay'
      },
      positions: [{
        position: { type: String, required: true },
        fielderId: { type: String, required: true },
        fielderName: { type: String }
      }],
      deepFieldersCount: { type: Number, default: 2 },
      legSideFieldersCount: { type: Number, default: 3 },
      behindSquareLegCount: { type: Number, default: 0 },
      restrictionsValid: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);



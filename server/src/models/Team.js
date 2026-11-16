const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `team_${crypto.randomBytes(12).toString('hex')}`
  },
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
  },
  // Phase 11: Franchise Legacy & Multi-Season Retention
  history: {
    establishedYear: { type: Number, default: 2024 },
    motto: { type: String, default: 'Pride, Passion & Glory' },
    allTimeRecord: {
      played: { type: Number, default: 28 },
      won: { type: Number, default: 19 },
      lost: { type: Number, default: 9 },
      tied: { type: Number, default: 0 },
      winPercentage: { type: Number, default: 67.8 }
    }
  },
  seasons: [{
    seasonId: { type: String, required: true },
    seasonName: { type: String, default: 'Season 1' },
    year: { type: Number, default: 2025 },
    position: { type: Number, default: 1 },
    played: { type: Number, default: 14 },
    won: { type: Number, default: 10 },
    lost: { type: Number, default: 4 },
    trophy: { type: String, default: 'Champions' },
    topBatter: {
      name: { type: String, default: 'Virat Kohli' },
      runs: { type: Number, default: 640 }
    },
    topBowler: {
      name: { type: String, default: 'Jasprit Bumrah' },
      wickets: { type: Number, default: 21 }
    },
    recap: { type: String, default: 'Dominant campaign capped by an unforgettable championship victory.' }
  }],
  trophies: [{
    trophyId: String,
    name: String,
    season: String,
    year: Number,
    icon: { type: String, default: '🏆' }
  }],
  acquisitions: [{
    playerId: String,
    playerName: String,
    type: { type: String, enum: ['AUCTION', 'DRAFT', 'TRANSFER', 'FREE_AGENT'], default: 'AUCTION' },
    amount: Number,
    season: String,
    date: { type: Date, default: Date.now }
  }],
  retentions: [{
    playerId: String,
    playerName: String,
    retentionTier: { type: String, default: 'Tier 1' },
    cost: { type: Number, default: 10 },
    season: String
  }],
  transfers: [{
    playerId: String,
    playerName: String,
    fromTeam: String,
    toTeam: String,
    terms: String,
    season: String,
    date: { type: Date, default: Date.now }
  }],
  careerStats: {
    totalRuns: { type: Number, default: 4890 },
    totalWickets: { type: Number, default: 214 },
    highestScore: { type: String, default: '228/4' },
    bestBowling: { type: String, default: '5/18' },
    centuries: { type: Number, default: 4 },
    fifties: { type: Number, default: 28 }
  },
  rivalries: [{
    opponentTeam: String,
    played: { type: Number, default: 6 },
    won: { type: Number, default: 4 },
    lost: { type: Number, default: 2 },
    tied: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 66.7 },
    trophyName: { type: String, default: 'El Clásico Derby Trophy' }
  }],
  hallOfFame: [{
    playerId: String,
    playerName: String,
    inductionYear: { type: Number, default: 2025 },
    jerseyNumber: Number,
    achievements: [String],
    photoUrl: String
  }],
  historicalMatches: [{
    matchId: String,
    season: String,
    opponent: String,
    teamScore: String,
    opponentScore: String,
    result: String,
    venue: String,
    date: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);



const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  _id: {
    type: String
  },
  // Unique real-world cricketer identifier (e.g. 'cric_virat_kohli').
  // Multiple card variants of the same cricketer share this exact playerId.
  playerId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true
  },
  countryFlag: {
    type: String,
    default: '🏏'
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
  jerseyNumber: {
    type: Number,
    default: 18
  },
  era: {
    type: String,
    default: 'Modern'
  },
  bio: {
    type: String,
    default: ''
  },

  // Strict Format Eligibility (Rule: at least one official appearance)
  formatEligibility: {
    test: { type: Boolean, default: false },
    odi: { type: Boolean, default: false },
    t20: { type: Boolean, default: false }
  },

  // OVR System on a 1–120 Scale
  ovr: {
    test: { type: Number, min: 1, max: 120, default: null },
    odi: { type: Number, min: 1, max: 120, default: null },
    t20: { type: Number, min: 1, max: 120, default: null }
  },
  overallRating: {
    type: Number,
    default: 95
  },

  // Card Variants
  cardVariant: {
    type: String,
    enum: [
      'Peak',
      'Best',
      'Average',
      'Icon',
      'Legends',
      'World Cup',
      'All-Time Great',
      'Captain',
      'Clutch',
      'Anniversary'
    ],
    default: 'Peak'
  },
  cardTier: {
    type: String,
    enum: ['ICON', 'DIAMOND', 'GOLD', 'SILVER', 'EMERGING'],
    default: 'GOLD'
  },
  variants: [
    {
      variant: {
        type: String,
        enum: [
          'Peak',
          'Best',
          'Average',
          'Icon',
          'Legends',
          'World Cup',
          'All-Time Great',
          'Captain',
          'Clutch',
          'Anniversary'
        ]
      },
      ovr: {
        test: Number,
        odi: Number,
        t20: Number
      },
      seasonYear: String,
      specialBuff: String
    }
  ],

  // 14 Core Attributes (1–120 Rating Scale)
  attributes: {
    batting: { type: Number, min: 1, max: 120, default: 70 },
    bowling: { type: Number, min: 1, max: 120, default: 40 },
    fielding: { type: Number, min: 1, max: 120, default: 75 },
    fitness: { type: Number, min: 1, max: 120, default: 80 },
    temperament: { type: Number, min: 1, max: 120, default: 80 },
    consistency: { type: Number, min: 1, max: 120, default: 80 },
    captaincy: { type: Number, min: 1, max: 120, default: 70 },
    powerHitting: { type: Number, min: 1, max: 120, default: 70 },
    strikeRotation: { type: Number, min: 1, max: 120, default: 80 },
    pace: { type: Number, min: 1, max: 120, default: 35 },
    swing: { type: Number, min: 1, max: 120, default: 35 },
    spin: { type: Number, min: 1, max: 120, default: 35 },
    deathBowling: { type: Number, min: 1, max: 120, default: 40 },
    defensiveTechnique: { type: Number, min: 1, max: 120, default: 80 }
  },

  // Backward-compatible summary stats
  stats: {
    bat: { type: Number, default: 80 },
    bwl: { type: Number, default: 50 },
    fld: { type: Number, default: 80 },
    pwr: { type: Number, default: 80 },
    clu: { type: Number, default: 85 },
    ldr: { type: Number, default: 80 }
  },

  // Image Management & Legal Licensing
  imageUrl: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  imageSource: {
    type: String,
    default: 'Wikimedia Commons'
  },
  attribution: {
    type: String,
    default: 'Creative Commons Sports Media Archive'
  },
  licenceInfo: {
    type: String,
    default: 'CC BY-SA 4.0'
  },
  formatSpecificImage: {
    test: String,
    odi: String,
    t20: String
  },

  // Separate International Statistics
  internationalStats: {
    test: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      average: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      bowlingAverage: { type: Number, default: 0 },
      bestBowling: { type: String, default: '-' }
    },
    odi: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      average: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      bowlingAverage: { type: Number, default: 0 },
      bestBowling: { type: String, default: '-' }
    },
    t20i: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      average: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      bowlingAverage: { type: Number, default: 0 },
      bestBowling: { type: String, default: '-' }
    }
  },

  // Domestic & Franchise Statistics (Kept Separate)
  franchiseDomesticStats: {
    ipl: {
      teams: [{ type: String }],
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      average: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      titles: { type: Number, default: 0 }
    },
    domestic: {
      teams: [{ type: String }],
      firstClassMatches: { type: Number, default: 0 },
      listAMatches: { type: Number, default: 0 },
      t20Matches: { type: Number, default: 0 },
      totalRuns: { type: Number, default: 0 },
      totalWickets: { type: Number, default: 0 }
    }
  },

  // Economy & Auction Settings: Every card starts at exactly 1 point regardless of OVR or variant
  basePrice: {
    type: Number,
    default: 1
  },
  currentPrice: {
    type: Number,
    default: 1
  },
  franchise: {
    type: String,
    default: 'Unsold'
  },
  specialTraits: [
    {
      type: String
    }
  ],
  isAvailableForAuction: {
    type: Boolean,
    default: true
  },

  // Phase 12: Player Development System
  development: {
    form: { type: Number, min: 30, max: 100, default: 80 },
    confidence: { type: Number, min: 0, max: 100, default: 75 },
    fitness: { type: Number, min: 0, max: 100, default: 90 },
    fatigue: { type: Number, min: 0, max: 100, default: 10 },
    injury: {
      status: {
        type: String,
        enum: ['healthy', 'minor_strain', 'hamstring_tear', 'side_strain', 'fracture'],
        default: 'healthy'
      },
      type: { type: String, default: null },
      matchesOut: { type: Number, default: 0 },
      recoveryProgress: { type: Number, default: 100 },
      injuryRisk: { type: Number, default: 10 }
    },
    training: {
      battingXP: { type: Number, default: 0 },
      bowlingXP: { type: Number, default: 0 },
      fieldingXP: { type: Number, default: 0 },
      fitnessXP: { type: Number, default: 0 },
      mentalXP: { type: Number, default: 0 },
      captaincyXP: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    },
    availability: {
      type: String,
      enum: ['available', 'rested', 'injured', 'suspended'],
      default: 'available'
    }
  },

  // Phase 12: Special Abilities
  specialAbilities: [{ type: String }],

  // Phase 12: Chemistry Tags & Partnerships
  chemistryTags: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);

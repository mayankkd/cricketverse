const bcrypt = require('bcryptjs');

// Demo hashed password for password123
const demoHashedPassword = bcrypt.hashSync('password123', 10);

const initialUsers = [
  {
    _id: 'usr_demo_101',
    username: 'cricket_legend',
    email: 'captain@cricketverse.com',
    password: demoHashedPassword,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    favoriteTeam: 'Royal Challengers Bengaluru',
    budget: 885000000,
    tier: 'Legend',
    level: 14,
    xp: 4850,
    rating: 1845,
    stats: {
      matchesPlayed: 48,
      matchesWon: 34,
      matchesLost: 14,
      winRate: 70.8,
      tournamentsWon: 3,
      highestScore: 236,
      totalRuns: 4210,
      totalWickets: 126,
      auctionsWon: 18
    },
    preferences: {
      soundEnabled: true,
      commentaryLanguage: 'English (Harsha & Ravi)',
      graphicsQuality: 'Ultra HDR',
      simulationSpeed: 'Fast (2x)',
      pushNotifications: true
    }
  },
  {
    _id: 'usr_demo_102',
    username: 'rohit_hitman',
    email: 'rohit@cricketverse.com',
    password: demoHashedPassword,
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    favoriteTeam: 'Mumbai Indians',
    budget: 920000000,
    tier: 'Master',
    level: 11,
    xp: 3200,
    rating: 1720,
    stats: {
      matchesPlayed: 32,
      matchesWon: 22,
      matchesLost: 10,
      winRate: 68.7,
      tournamentsWon: 2,
      highestScore: 218,
      totalRuns: 2940,
      totalWickets: 84,
      auctionsWon: 12
    },
    preferences: {
      soundEnabled: true,
      commentaryLanguage: 'Hindi (Aakash & Sidhu)',
      graphicsQuality: 'High',
      simulationSpeed: 'Normal (1x)',
      pushNotifications: true
    }
  }
];

const initialPlayers = [
  // 1. VIRAT KOHLI (INDIA)
  {
    _id: 'ply_01',
    playerId: 'cric_virat_kohli',
    name: 'Virat Kohli',
    shortName: 'V. Kohli',
    slug: 'virat-kohli',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    jerseyNumber: 18,
    era: '2008–Present',
    bio: 'Chase Master, ICC Hall of Fame contender, leading all-time T20 World Cup run scorer and master of 50 ODI centuries.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 114, odi: 120, t20: 115 },
    overallRating: 118,
    cardVariant: 'Peak',
    cardTier: 'ICON',
    variants: [
      { variant: 'Peak', ovr: { test: 114, odi: 120, t20: 115 }, seasonYear: '2016–2018', specialBuff: 'Unstoppable Run Machine' },
      { variant: 'Best', ovr: { test: 108, odi: 112, t20: 108 }, seasonYear: '2019', specialBuff: 'Tactical Precision' },
      { variant: 'Average', ovr: { test: 94, odi: 92, t20: 89 }, seasonYear: 'Career Mean', specialBuff: 'Standard Consistency' },
      { variant: 'World Cup', ovr: { test: null, odi: 119, t20: 118 }, seasonYear: '2023 / 2024', specialBuff: 'Tournament MVP' },
      { variant: 'Captain', ovr: { test: 115, odi: 112, t20: 105 }, seasonYear: '2017–2021', specialBuff: 'Test Dominance' },
      { variant: 'Clutch', ovr: { test: 110, odi: 120, t20: 120 }, seasonYear: 'Melbourne 2022', specialBuff: '82* Miracle' }
    ],
    attributes: {
      batting: 120,
      bowling: 45,
      fielding: 112,
      fitness: 120,
      temperament: 118,
      consistency: 119,
      captaincy: 108,
      powerHitting: 105,
      strikeRotation: 120,
      pace: 40,
      swing: 45,
      spin: 30,
      deathBowling: 35,
      defensiveTechnique: 114
    },
    stats: { bat: 118, bwl: 45, fld: 112, pwr: 105, clu: 120, ldr: 108 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'NAPARAZZI / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Virat_Kohli_in_2018.jpg/440px-Virat_Kohli_in_2018.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Virat_Kohli_celebrating_50.jpg/440px-Virat_Kohli_celebrating_50.jpg'
    },
    internationalStats: {
      test: { matches: 118, innings: 200, runs: 9040, highestScore: '254*', average: 48.74, hundreds: 29, fifties: 31, wickets: 0, bowlingAverage: 0, bestBowling: '0/0' },
      odi: { matches: 295, innings: 283, runs: 13906, highestScore: '183', average: 58.18, hundreds: 50, fifties: 72, wickets: 5, bowlingAverage: 142.2, bestBowling: '1/15' },
      t20i: { matches: 125, innings: 117, runs: 4188, highestScore: '122*', average: 48.69, strikeRate: 137.04, hundreds: 1, fifties: 38, wickets: 4, bowlingAverage: 51.0, bestBowling: '1/13' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Royal Challengers Bengaluru'], matches: 252, runs: 8004, highestScore: '113', average: 38.67, strikeRate: 131.97, hundreds: 8, wickets: 4, titles: 0 },
      domestic: { teams: ['Delhi', 'North Zone'], firstClassMatches: 148, listAMatches: 320, t20Matches: 377, totalRuns: 27500, totalWickets: 12 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Royal Challengers Bengaluru',
    specialTraits: ['Chase Master', 'Anchor & Accelerate', 'Fitness Freak'],
    isAvailableForAuction: true
  },

  // 2. JASPRIT BUMRAH (INDIA)
  {
    _id: 'ply_02',
    playerId: 'cric_jasprit_bumrah',
    name: 'Jasprit Bumrah',
    shortName: 'J. Bumrah',
    slug: 'jasprit-bumrah',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast (Hyperextension)',
    jerseyNumber: 93,
    era: '2016–Present',
    bio: 'The undisputed premier all-format strike bowler on the planet, possessing deadly yorkers and unplayable reverse swing.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 118, odi: 119, t20: 120 },
    overallRating: 119,
    cardVariant: 'Peak',
    cardTier: 'ICON',
    variants: [
      { variant: 'Peak', ovr: { test: 118, odi: 119, t20: 120 }, seasonYear: '2023–2024', specialBuff: 'Toe Crusher' },
      { variant: 'Best', ovr: { test: 112, odi: 114, t20: 115 }, seasonYear: '2019', specialBuff: 'World Cup Spearhead' },
      { variant: 'Average', ovr: { test: 98, odi: 96, t20: 98 }, seasonYear: 'Career Mean', specialBuff: 'Sub-6 Economy' },
      { variant: 'Clutch', ovr: { test: 116, odi: 118, t20: 120 }, seasonYear: 'T20 WC Final 2024', specialBuff: 'Zero Boundary Death' }
    ],
    attributes: {
      batting: 42,
      bowling: 120,
      fielding: 92,
      fitness: 114,
      temperament: 119,
      consistency: 118,
      captaincy: 104,
      powerHitting: 55,
      strikeRotation: 40,
      pace: 116,
      swing: 115,
      spin: 10,
      deathBowling: 120,
      defensiveTechnique: 58
    },
    stats: { bat: 42, bwl: 120, fld: 92, pwr: 55, clu: 120, ldr: 104 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Bollywood Hungama / Wikimedia Commons',
    licenceInfo: 'CC BY 3.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Jasprit_Bumrah.jpg/440px-Jasprit_Bumrah.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
    },
    internationalStats: {
      test: { matches: 40, innings: 76, runs: 280, highestScore: '34*', average: 8.48, hundreds: 0, fifties: 0, wickets: 173, bowlingAverage: 20.49, bestBowling: '6/27' },
      odi: { matches: 89, innings: 88, runs: 85, highestScore: '16', average: 7.08, hundreds: 0, fifties: 0, wickets: 149, bowlingAverage: 23.55, bestBowling: '6/19' },
      t20i: { matches: 70, innings: 69, runs: 26, highestScore: '7', average: 4.33, strikeRate: 68.42, hundreds: 0, fifties: 0, wickets: 89, bowlingAverage: 17.74, bestBowling: '3/7' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Mumbai Indians'], matches: 133, runs: 69, highestScore: '16', average: 9.85, strikeRate: 98.57, hundreds: 0, wickets: 165, titles: 5 },
      domestic: { teams: ['Gujarat', 'West Zone'], firstClassMatches: 68, listAMatches: 110, t20Matches: 220, totalRuns: 650, totalWickets: 440 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Mumbai Indians',
    specialTraits: ['Toe Crusher', 'Death Over Magician', 'Zero Economy'],
    isAvailableForAuction: true
  },

  // 3. SIR DONALD BRADMAN (AUSTRALIA) - Test Only
  {
    _id: 'ply_03',
    playerId: 'cric_don_bradman',
    name: 'Sir Donald Bradman',
    shortName: 'D. Bradman',
    slug: 'don-bradman',
    country: 'Australia',
    countryCode: 'AUS',
    countryFlag: '🇦🇺',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    jerseyNumber: 1,
    era: '1928–1948',
    bio: 'The greatest cricketer in sporting history. 99.94 Test batting average across 52 Tests, unchallenged across human history.',
    formatEligibility: { test: true, odi: false, t20: false },
    ovr: { test: 120, odi: null, t20: null },
    overallRating: 120,
    cardVariant: 'All-Time Great',
    cardTier: 'ICON',
    variants: [
      { variant: 'All-Time Great', ovr: { test: 120, odi: null, t20: null }, seasonYear: '1930 Ashes', specialBuff: '99.94 Average' },
      { variant: 'Legends', ovr: { test: 120, odi: null, t20: null }, seasonYear: '1948 Invincibles', specialBuff: 'Invincible Captain' },
      { variant: 'Peak', ovr: { test: 120, odi: null, t20: null }, seasonYear: '1930–1938', specialBuff: 'Triple Century Master' }
    ],
    attributes: {
      batting: 120,
      bowling: 65,
      fielding: 104,
      fitness: 112,
      temperament: 120,
      consistency: 120,
      captaincy: 116,
      powerHitting: 108,
      strikeRotation: 120,
      pace: 40,
      swing: 35,
      spin: 65,
      deathBowling: 40,
      defensiveTechnique: 120
    },
    stats: { bat: 120, bwl: 65, fld: 104, pwr: 108, clu: 120, ldr: 116 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Donald_Bradman_1930.jpg/440px-Donald_Bradman_1930.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Donald_Bradman_1930.jpg/440px-Donald_Bradman_1930.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'State Library of New South Wales / Public Domain',
    licenceInfo: 'Public Domain',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Donald_Bradman_1930.jpg/440px-Donald_Bradman_1930.jpg',
      odi: null,
      t20: null
    },
    internationalStats: {
      test: { matches: 52, innings: 80, runs: 6996, highestScore: '334', average: 99.94, hundreds: 29, fifties: 13, wickets: 2, bowlingAverage: 36.0, bestBowling: '1/8' },
      odi: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' },
      t20i: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: [], matches: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, wickets: 0, titles: 0 },
      domestic: { teams: ['New South Wales', 'South Australia'], firstClassMatches: 234, listAMatches: 0, t20Matches: 0, totalRuns: 28067, totalWickets: 36 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Unsold',
    specialTraits: ['99.94 Average', 'Unmatched Concentration', 'Invincible Captain'],
    isAvailableForAuction: true
  },

  // 4. SACHIN TENDULKAR (INDIA)
  {
    _id: 'ply_04',
    playerId: 'cric_sachin_tendulkar',
    name: 'Sachin Tendulkar',
    shortName: 'S. Tendulkar',
    slug: 'sachin-tendulkar',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak / legbreak',
    jerseyNumber: 10,
    era: '1989–2013',
    bio: 'The God of Cricket, sole player in history to score 100 international centuries, with 34,357 international runs.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 120, odi: 119, t20: 95 },
    overallRating: 119,
    cardVariant: 'Icon',
    cardTier: 'ICON',
    variants: [
      { variant: 'Icon', ovr: { test: 120, odi: 119, t20: 95 }, seasonYear: '1998 Desert Storm', specialBuff: '100 Centuries' },
      { variant: 'Peak', ovr: { test: 120, odi: 120, t20: 96 }, seasonYear: '1998–2003', specialBuff: 'Straight Drive Perfection' },
      { variant: 'World Cup', ovr: { test: null, odi: 118, t20: null }, seasonYear: '2003 / 2011', specialBuff: 'Golden Bat' },
      { variant: 'All-Time Great', ovr: { test: 120, odi: 119, t20: 95 }, seasonYear: 'Career Legacy', specialBuff: 'Master Blaster' }
    ],
    attributes: {
      batting: 120,
      bowling: 78,
      fielding: 102,
      fitness: 108,
      temperament: 120,
      consistency: 119,
      captaincy: 98,
      powerHitting: 106,
      strikeRotation: 118,
      pace: 45,
      swing: 50,
      spin: 82,
      deathBowling: 55,
      defensiveTechnique: 120
    },
    stats: { bat: 120, bwl: 78, fld: 102, pwr: 106, clu: 119, ldr: 98 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sachin_Tendulkar_at_MRF_Promotion_Event.jpg/440px-Sachin_Tendulkar_at_MRF_Promotion_Event.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sachin_Tendulkar_at_MRF_Promotion_Event.jpg/440px-Sachin_Tendulkar_at_MRF_Promotion_Event.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Flickr User / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sachin_Tendulkar_at_MRF_Promotion_Event.jpg/440px-Sachin_Tendulkar_at_MRF_Promotion_Event.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Sachin_Tendulkar_2008.jpg/440px-Sachin_Tendulkar_2008.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sachin_Tendulkar_at_MRF_Promotion_Event.jpg/440px-Sachin_Tendulkar_at_MRF_Promotion_Event.jpg'
    },
    internationalStats: {
      test: { matches: 200, innings: 329, runs: 15921, highestScore: '248*', average: 53.78, hundreds: 51, fifties: 68, wickets: 46, bowlingAverage: 54.17, bestBowling: '3/10' },
      odi: { matches: 463, innings: 452, runs: 18426, highestScore: '200*', average: 44.83, hundreds: 49, fifties: 96, wickets: 154, bowlingAverage: 44.48, bestBowling: '5/32' },
      t20i: { matches: 1, innings: 1, runs: 10, highestScore: '10', average: 10.0, strikeRate: 83.33, hundreds: 0, fifties: 0, wickets: 1, bowlingAverage: 12.0, bestBowling: '1/12' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Mumbai Indians'], matches: 78, runs: 2334, highestScore: '100*', average: 34.83, strikeRate: 119.81, hundreds: 1, wickets: 0, titles: 1 },
      domestic: { teams: ['Mumbai', 'Yorkshire'], firstClassMatches: 310, listAMatches: 551, t20Matches: 96, totalRuns: 50192, totalWickets: 201 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Mumbai Indians',
    specialTraits: ['100 Centuries', 'Desert Storm', 'Straight Drive Master'],
    isAvailableForAuction: true
  },

  // 5. SHANE WARNE (AUSTRALIA) - Test & ODI
  {
    _id: 'ply_05',
    playerId: 'cric_shane_warne',
    name: 'Shane Warne',
    shortName: 'S. Warne',
    slug: 'shane-warne',
    country: 'Australia',
    countryCode: 'AUS',
    countryFlag: '🇦🇺',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Legbreak googly',
    jerseyNumber: 23,
    era: '1992–2007',
    bio: 'The King of Spin, bowler of the Ball of the Century, with 708 Test wickets and inaugural IPL winning captain with Rajasthan Royals.',
    formatEligibility: { test: true, odi: true, t20: false },
    ovr: { test: 120, odi: 112, t20: null },
    overallRating: 118,
    cardVariant: 'Legends',
    cardTier: 'ICON',
    variants: [
      { variant: 'Legends', ovr: { test: 120, odi: 112, t20: null }, seasonYear: '1993–1999', specialBuff: 'Ball of the Century' },
      { variant: 'Peak', ovr: { test: 120, odi: 115, t20: null }, seasonYear: '1999 World Cup', specialBuff: 'Big Match Hero' },
      { variant: 'Captain', ovr: { test: 114, odi: 110, t20: null }, seasonYear: '2008 Rajasthan', specialBuff: 'Tactical Genius' }
    ],
    attributes: {
      batting: 68,
      bowling: 120,
      fielding: 104,
      fitness: 96,
      temperament: 120,
      consistency: 118,
      captaincy: 116,
      powerHitting: 72,
      strikeRotation: 60,
      pace: 35,
      swing: 30,
      spin: 120,
      deathBowling: 90,
      defensiveTechnique: 75
    },
    stats: { bat: 68, bwl: 120, fld: 104, pwr: 72, clu: 120, ldr: 116 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Shane_Warne_2015_%28cropped%29.jpg/440px-Shane_Warne_2015_%28cropped%29.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Shane_Warne_2015_%28cropped%29.jpg/440px-Shane_Warne_2015_%28cropped%29.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Eva Rinaldi / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Shane_Warne_2015_%28cropped%29.jpg/440px-Shane_Warne_2015_%28cropped%29.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Shane_Warne_2015_%28cropped%29.jpg/440px-Shane_Warne_2015_%28cropped%29.jpg',
      t20: null
    },
    internationalStats: {
      test: { matches: 145, innings: 273, runs: 3154, highestScore: '99', average: 17.32, hundreds: 0, fifties: 12, wickets: 708, bowlingAverage: 25.41, bestBowling: '8/71' },
      odi: { matches: 194, innings: 191, runs: 1018, highestScore: '55', average: 13.05, hundreds: 0, fifties: 1, wickets: 293, bowlingAverage: 25.73, bestBowling: '5/33' },
      t20i: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Rajasthan Royals'], matches: 55, runs: 198, highestScore: '34*', average: 9.9, strikeRate: 92.52, hundreds: 0, wickets: 57, titles: 1 },
      domestic: { teams: ['Victoria', 'Hampshire'], firstClassMatches: 301, listAMatches: 311, t20Matches: 73, totalRuns: 6919, totalWickets: 1319 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Rajasthan Royals',
    specialTraits: ['Ball of the Century', 'Flipper Specialist', 'Psychological Warfare'],
    isAvailableForAuction: true
  },

  // 6. SIR VIV RICHARDS (WEST INDIES)
  {
    _id: 'ply_06',
    playerId: 'cric_viv_richards',
    name: 'Sir Vivian Richards',
    shortName: 'V. Richards',
    slug: 'viv-richards',
    country: 'West Indies',
    countryCode: 'WI',
    countryFlag: '🌴',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    jerseyNumber: 21,
    era: '1974–1991',
    bio: 'The original Master Blaster, destroyer of express pace without ever wearing a helmet, 2x World Cup champion.',
    formatEligibility: { test: true, odi: true, t20: false },
    ovr: { test: 118, odi: 120, t20: null },
    overallRating: 119,
    cardVariant: 'Icon',
    cardTier: 'ICON',
    variants: [
      { variant: 'Icon', ovr: { test: 118, odi: 120, t20: null }, seasonYear: '1976–1985', specialBuff: 'Fearless Swag' },
      { variant: 'World Cup', ovr: { test: null, odi: 120, t20: null }, seasonYear: '1979 Final (138*)', specialBuff: 'Lord\'s Destruction' },
      { variant: 'Peak', ovr: { test: 119, odi: 120, t20: null }, seasonYear: '1976 England Tour', specialBuff: '829 Test Runs' }
    ],
    attributes: {
      batting: 120,
      bowling: 70,
      fielding: 110,
      fitness: 115,
      temperament: 120,
      consistency: 116,
      captaincy: 114,
      powerHitting: 120,
      strikeRotation: 115,
      pace: 40,
      swing: 35,
      spin: 72,
      deathBowling: 50,
      defensiveTechnique: 110
    },
    stats: { bat: 120, bwl: 70, fld: 110, pwr: 120, clu: 120, ldr: 114 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sir_Vivian_Richards_in_1985.jpg/440px-Sir_Vivian_Richards_in_1985.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sir_Vivian_Richards_in_1985.jpg/440px-Sir_Vivian_Richards_in_1985.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Allan Warren / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 3.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sir_Vivian_Richards_in_1985.jpg/440px-Sir_Vivian_Richards_in_1985.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sir_Vivian_Richards_in_1985.jpg/440px-Sir_Vivian_Richards_in_1985.jpg',
      t20: null
    },
    internationalStats: {
      test: { matches: 121, innings: 182, runs: 8540, highestScore: '291', average: 50.23, hundreds: 24, fifties: 45, wickets: 32, bowlingAverage: 61.09, bestBowling: '2/17' },
      odi: { matches: 187, innings: 167, runs: 6721, highestScore: '189*', average: 47.0, strikeRate: 90.2, hundreds: 11, fifties: 45, wickets: 118, bowlingAverage: 35.83, bestBowling: '6/41' },
      t20i: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: [], matches: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, wickets: 0, titles: 0 },
      domestic: { teams: ['Somerset', 'Queensland'], firstClassMatches: 507, listAMatches: 419, t20Matches: 0, totalRuns: 36212, totalWickets: 382 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Unsold',
    specialTraits: ['No-Helmet Swagger', 'Hook Shot King', '90 SR in 1970s'],
    isAvailableForAuction: true
  },

  // 7. BRIAN LARA (WEST INDIES)
  {
    _id: 'ply_07',
    playerId: 'cric_brian_lara',
    name: 'Brian Lara',
    shortName: 'B. Lara',
    slug: 'brian-lara',
    country: 'West Indies',
    countryCode: 'WI',
    countryFlag: '🌴',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    jerseyNumber: 9,
    era: '1990–2007',
    bio: 'The Prince of Trinidad, record holder for highest individual Test score (400*) and highest first-class score (501*).',
    formatEligibility: { test: true, odi: true, t20: false },
    ovr: { test: 120, odi: 114, t20: null },
    overallRating: 118,
    cardVariant: 'All-Time Great',
    cardTier: 'ICON',
    variants: [
      { variant: 'All-Time Great', ovr: { test: 120, odi: 114, t20: null }, seasonYear: '2004 Antigua', specialBuff: '400 Not Out' },
      { variant: 'Peak', ovr: { test: 120, odi: 116, t20: null }, seasonYear: '1994–1999', specialBuff: 'High Backlift Maestro' },
      { variant: 'Clutch', ovr: { test: 119, odi: 112, t20: null }, seasonYear: '1999 vs Australia', specialBuff: '153* Run Chase' }
    ],
    attributes: {
      batting: 120,
      bowling: 30,
      fielding: 94,
      fitness: 104,
      temperament: 118,
      consistency: 114,
      captaincy: 106,
      powerHitting: 108,
      strikeRotation: 116,
      pace: 25,
      swing: 25,
      spin: 35,
      deathBowling: 20,
      defensiveTechnique: 118
    },
    stats: { bat: 120, bwl: 30, fld: 94, pwr: 108, clu: 119, ldr: 106 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Brian_Lara_at_World_Economic_Forum_2010.jpg/440px-Brian_Lara_at_World_Economic_Forum_2010.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Brian_Lara_at_World_Economic_Forum_2010.jpg/440px-Brian_Lara_at_World_Economic_Forum_2010.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'World Economic Forum / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Brian_Lara_at_World_Economic_Forum_2010.jpg/440px-Brian_Lara_at_World_Economic_Forum_2010.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Brian_Lara_at_World_Economic_Forum_2010.jpg/440px-Brian_Lara_at_World_Economic_Forum_2010.jpg',
      t20: null
    },
    internationalStats: {
      test: { matches: 131, innings: 232, runs: 11953, highestScore: '400*', average: 52.88, hundreds: 34, fifties: 48, wickets: 0, bowlingAverage: 0, bestBowling: '0/0' },
      odi: { matches: 299, innings: 289, runs: 10405, highestScore: '169', average: 40.48, hundreds: 19, fifties: 63, wickets: 4, bowlingAverage: 15.25, bestBowling: '2/5' },
      t20i: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: [], matches: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, wickets: 0, titles: 0 },
      domestic: { teams: ['Trinidad & Tobago', 'Warwickshire'], firstClassMatches: 261, listAMatches: 427, t20Matches: 3, totalRuns: 33760, totalWickets: 9 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Unsold',
    specialTraits: ['400* Record', '501* County Innings', 'High Backlift'],
    isAvailableForAuction: true
  },

  // 8. MS DHONI (INDIA)
  {
    _id: 'ply_08',
    playerId: 'cric_ms_dhoni',
    name: 'MS Dhoni',
    shortName: 'MS Dhoni',
    slug: 'ms-dhoni',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Wicketkeeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    jerseyNumber: 7,
    era: '2004–2020 (IPL active)',
    bio: 'Only captain in cricket history to win all three ICC white-ball trophies (T20 WC 2007, ODI WC 2011, Champions Trophy 2013) and 5x IPL winner.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 102, odi: 119, t20: 114 },
    overallRating: 118,
    cardVariant: 'Captain',
    cardTier: 'ICON',
    variants: [
      { variant: 'Captain', ovr: { test: 102, odi: 119, t20: 114 }, seasonYear: '2007–2016', specialBuff: '3x ICC Trophies' },
      { variant: 'World Cup', ovr: { test: null, odi: 120, t20: 116 }, seasonYear: '2011 Final (91*)', specialBuff: 'Wankhede Six' },
      { variant: 'Clutch', ovr: { test: 104, odi: 120, t20: 118 }, seasonYear: 'Finishing Era', specialBuff: 'Ice in Veins' },
      { variant: 'Anniversary', ovr: { test: 100, odi: 118, t20: 112 }, seasonYear: 'CSK 5 Titles', specialBuff: 'Thala Forever' }
    ],
    attributes: {
      batting: 114,
      bowling: 40,
      fielding: 120,
      fitness: 118,
      temperament: 120,
      consistency: 116,
      captaincy: 120,
      powerHitting: 118,
      strikeRotation: 115,
      pace: 30,
      swing: 30,
      spin: 30,
      deathBowling: 25,
      defensiveTechnique: 102
    },
    stats: { bat: 114, bwl: 40, fld: 120, pwr: 118, clu: 120, ldr: 120 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_%28Prabal_cropped%29.jpg/440px-MS_Dhoni_%28Prabal_cropped%29.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_%28Prabal_cropped%29.jpg/440px-MS_Dhoni_%28Prabal_cropped%29.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Prabal / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_%28Prabal_cropped%29.jpg/440px-MS_Dhoni_%28Prabal_cropped%29.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_%28Prabal_cropped%29.jpg/440px-MS_Dhoni_%28Prabal_cropped%29.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_%28Prabal_cropped%29.jpg/440px-MS_Dhoni_%28Prabal_cropped%29.jpg'
    },
    internationalStats: {
      test: { matches: 90, innings: 144, runs: 4876, highestScore: '224', average: 38.09, hundreds: 6, fifties: 33, wickets: 0, bowlingAverage: 0, bestBowling: '0/0' },
      odi: { matches: 350, innings: 297, runs: 10773, highestScore: '183*', average: 50.57, hundreds: 10, fifties: 73, wickets: 1, bowlingAverage: 31.0, bestBowling: '1/14' },
      t20i: { matches: 98, innings: 85, runs: 1617, highestScore: '56', average: 37.6, strikeRate: 126.13, hundreds: 0, fifties: 2, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Chennai Super Kings', 'Rising Pune Supergiant'], matches: 264, runs: 5243, highestScore: '84*', average: 39.13, strikeRate: 137.53, hundreds: 0, wickets: 0, titles: 5 },
      domestic: { teams: ['Jharkhand', 'Bihar'], firstClassMatches: 131, listAMatches: 412, t20Matches: 390, totalRuns: 21500, totalWickets: 2 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Chennai Super Kings',
    specialTraits: ['Helicopter Shot', 'Lightning 0.08s Stumping', 'Captain Cool'],
    isAvailableForAuction: true
  },

  // 9. ROHIT SHARMA (INDIA)
  {
    _id: 'ply_09',
    playerId: 'cric_rohit_sharma',
    name: 'Rohit Sharma',
    shortName: 'R. Sharma',
    slug: 'rohit-sharma',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    jerseyNumber: 45,
    era: '2007–Present',
    bio: 'Hitman, only batter with three ODI double centuries (including world record 264), 2024 T20 World Cup winning captain, and 5x IPL champion.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 106, odi: 120, t20: 116 },
    overallRating: 117,
    cardVariant: 'Peak',
    cardTier: 'DIAMOND',
    variants: [
      { variant: 'Peak', ovr: { test: 106, odi: 120, t20: 116 }, seasonYear: '2019 WC (5 Hundreds)', specialBuff: '264 World Record' },
      { variant: 'Captain', ovr: { test: 108, odi: 118, t20: 118 }, seasonYear: '2024 T20 WC Champion', specialBuff: 'Aggressive Intent' },
      { variant: 'Best', ovr: { test: 104, odi: 116, t20: 114 }, seasonYear: '2017–2020', specialBuff: 'Pull Shot Maestro' },
      { variant: 'Average', ovr: { test: 92, odi: 94, t20: 90 }, seasonYear: 'Career Mean', specialBuff: 'Powerplay Blitz' }
    ],
    attributes: {
      batting: 118,
      bowling: 50,
      fielding: 98,
      fitness: 102,
      temperament: 116,
      consistency: 114,
      captaincy: 118,
      powerHitting: 120,
      strikeRotation: 112,
      pace: 35,
      swing: 30,
      spin: 65,
      deathBowling: 35,
      defensiveTechnique: 106
    },
    stats: { bat: 118, bwl: 50, fld: 98, pwr: 120, clu: 118, ldr: 118 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/440px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/440px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'NAPARAZZI / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/440px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/440px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/440px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg'
    },
    internationalStats: {
      test: { matches: 64, innings: 111, runs: 4278, highestScore: '212', average: 42.78, hundreds: 12, fifties: 18, wickets: 2, bowlingAverage: 112.0, bestBowling: '1/26' },
      odi: { matches: 265, innings: 257, runs: 10866, highestScore: '264', average: 49.16, hundreds: 31, fifties: 57, wickets: 9, bowlingAverage: 64.33, bestBowling: '2/27' },
      t20i: { matches: 159, innings: 151, runs: 4231, highestScore: '121*', average: 32.05, strikeRate: 140.89, hundreds: 5, fifties: 32, wickets: 1, bowlingAverage: 113.0, bestBowling: '1/22' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Mumbai Indians', 'Deccan Chargers'], matches: 257, runs: 6628, highestScore: '109*', average: 29.72, strikeRate: 131.14, hundreds: 2, wickets: 15, titles: 6 },
      domestic: { teams: ['Mumbai', 'West Zone'], firstClassMatches: 126, listAMatches: 334, t20Matches: 442, totalRuns: 27900, totalWickets: 34 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Mumbai Indians',
    specialTraits: ['264 World Record', 'Pull Shot King', '5x IPL Champion'],
    isAvailableForAuction: true
  },

  // 10. HEINRICH KLAASEN (SOUTH AFRICA)
  {
    _id: 'ply_10',
    playerId: 'cric_heinrich_klaasen',
    name: 'Heinrich Klaasen',
    shortName: 'H. Klaasen',
    slug: 'heinrich-klaasen',
    country: 'South Africa',
    countryCode: 'SA',
    countryFlag: '🇿🇦',
    role: 'Wicketkeeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    jerseyNumber: 4,
    era: '2018–Present',
    bio: 'The most destructive middle-overs spin destroyer in modern white-ball cricket with lethal death hitting power.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 82, odi: 112, t20: 118 },
    overallRating: 114,
    cardVariant: 'Peak',
    cardTier: 'DIAMOND',
    variants: [
      { variant: 'Peak', ovr: { test: 82, odi: 112, t20: 118 }, seasonYear: '2023–2024', specialBuff: 'Spin Demolisher' },
      { variant: 'Clutch', ovr: { test: 78, odi: 110, t20: 119 }, seasonYear: '2024 IPL & WC', specialBuff: 'Death Strike 200+' },
      { variant: 'Average', ovr: { test: 75, odi: 95, t20: 98 }, seasonYear: 'Career Mean', specialBuff: 'Clean Striker' }
    ],
    attributes: {
      batting: 114,
      bowling: 30,
      fielding: 104,
      fitness: 108,
      temperament: 114,
      consistency: 112,
      captaincy: 88,
      powerHitting: 120,
      strikeRotation: 110,
      pace: 25,
      swing: 20,
      spin: 45,
      deathBowling: 25,
      defensiveTechnique: 85
    },
    stats: { bat: 114, bwl: 30, fld: 104, pwr: 120, clu: 116, ldr: 88 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'ICC CC Media Archive / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Heinrich_Klaasen_2023.jpg/440px-Heinrich_Klaasen_2023.jpg'
    },
    internationalStats: {
      test: { matches: 4, innings: 8, runs: 104, highestScore: '35', average: 13.0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' },
      odi: { matches: 54, innings: 50, runs: 1723, highestScore: '174', average: 40.06, hundreds: 4, fifties: 6, wickets: 0, bowlingAverage: 0, bestBowling: '-' },
      t20i: { matches: 58, innings: 53, runs: 1000, highestScore: '81', average: 23.8, strikeRate: 142.45, hundreds: 0, fifties: 5, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Sunrisers Hyderabad', 'Rajasthan Royals', 'Royal Challengers Bangalore'], matches: 35, runs: 993, highestScore: '104', average: 36.78, strikeRate: 168.31, hundreds: 1, wickets: 0, titles: 0 },
      domestic: { teams: ['Titans', 'Northerns', 'Durban Super Giants'], firstClassMatches: 85, listAMatches: 160, t20Matches: 215, totalRuns: 13400, totalWickets: 0 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Sunrisers Hyderabad',
    specialTraits: ['Spin Destroyer', 'Death Surge', 'Back-Foot Sixes'],
    isAvailableForAuction: true
  },

  // 11. PAT CUMMINS (AUSTRALIA)
  {
    _id: 'ply_11',
    playerId: 'cric_pat_cummins',
    name: 'Pat Cummins',
    shortName: 'P. Cummins',
    slug: 'pat-cummins',
    country: 'Australia',
    countryCode: 'AUS',
    countryFlag: '🇦🇺',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    jerseyNumber: 30,
    era: '2011–Present',
    bio: 'Captain who silenced 130,000 at Ahmedabad to win 2023 ODI World Cup, ICC World Test Champion captain, and premier fast bowler.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 118, odi: 114, t20: 108 },
    overallRating: 116,
    cardVariant: 'Captain',
    cardTier: 'DIAMOND',
    variants: [
      { variant: 'Captain', ovr: { test: 118, odi: 116, t20: 108 }, seasonYear: '2023 WTC & WC', specialBuff: 'Silence The Crowd' },
      { variant: 'Peak', ovr: { test: 119, odi: 112, t20: 106 }, seasonYear: '2019 Ashes', specialBuff: '29 Ashes Wickets' },
      { variant: 'Clutch', ovr: { test: 116, odi: 115, t20: 110 }, seasonYear: '2023 Ahmedabad', specialBuff: 'Knockout Specialist' }
    ],
    attributes: {
      batting: 84,
      bowling: 118,
      fielding: 106,
      fitness: 118,
      temperament: 120,
      consistency: 118,
      captaincy: 120,
      powerHitting: 92,
      strikeRotation: 76,
      pace: 116,
      swing: 112,
      spin: 20,
      deathBowling: 106,
      defensiveTechnique: 88
    },
    stats: { bat: 84, bwl: 118, fld: 106, pwr: 92, clu: 118, ldr: 120 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pat_Cummins_2023.jpg/440px-Pat_Cummins_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pat_Cummins_2023.jpg/440px-Pat_Cummins_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'NAPARAZZI / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pat_Cummins_2023.jpg/440px-Pat_Cummins_2023.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pat_Cummins_2023.jpg/440px-Pat_Cummins_2023.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pat_Cummins_2023.jpg/440px-Pat_Cummins_2023.jpg'
    },
    internationalStats: {
      test: { matches: 62, innings: 117, runs: 1295, highestScore: '64*', average: 16.6, hundreds: 0, fifties: 3, wickets: 269, bowlingAverage: 22.53, bestBowling: '6/23' },
      odi: { matches: 88, innings: 85, runs: 450, highestScore: '36', average: 12.5, hundreds: 0, fifties: 0, wickets: 141, bowlingAverage: 28.14, bestBowling: '5/70' },
      t20i: { matches: 57, innings: 55, runs: 195, highestScore: '28', average: 12.18, strikeRate: 137.32, hundreds: 0, fifties: 0, wickets: 66, bowlingAverage: 23.77, bestBowling: '3/15' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Sunrisers Hyderabad', 'Kolkata Knight Riders', 'Delhi Daredevils'], matches: 58, runs: 515, highestScore: '56*', average: 18.39, strikeRate: 151.03, hundreds: 0, wickets: 63, titles: 1 },
      domestic: { teams: ['New South Wales'], firstClassMatches: 84, listAMatches: 115, t20Matches: 154, totalRuns: 2750, totalWickets: 530 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Sunrisers Hyderabad',
    specialTraits: ['Silence The Crowd', '14-Ball Fifty', 'Elite Captain'],
    isAvailableForAuction: true
  },

  // 12. BEN STOKES (ENGLAND)
  {
    _id: 'ply_12',
    playerId: 'cric_ben_stokes',
    name: 'Ben Stokes',
    shortName: 'B. Stokes',
    slug: 'ben-stokes',
    country: 'England',
    countryCode: 'ENG',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm fast medium',
    jerseyNumber: 55,
    era: '2011–Present',
    bio: 'Ultimate big-match clutch competitor: Headingley 2019 135*, 2019 World Cup Final 84*, 2022 T20 World Cup Final 52*, and pioneer of Bazball.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 116, odi: 114, t20: 112 },
    overallRating: 115,
    cardVariant: 'Clutch',
    cardTier: 'ICON',
    variants: [
      { variant: 'Clutch', ovr: { test: 118, odi: 118, t20: 115 }, seasonYear: '2019 Summer', specialBuff: 'Headingley Miracle' },
      { variant: 'World Cup', ovr: { test: null, odi: 118, t20: 116 }, seasonYear: '2019 & 2022 Finals', specialBuff: 'Finals MVP' },
      { variant: 'Captain', ovr: { test: 116, odi: 105, t20: 104 }, seasonYear: '2022–Present', specialBuff: 'Bazball Revolution' }
    ],
    attributes: {
      batting: 114,
      bowling: 104,
      fielding: 118,
      fitness: 115,
      temperament: 120,
      consistency: 108,
      captaincy: 116,
      powerHitting: 116,
      strikeRotation: 110,
      pace: 108,
      swing: 106,
      spin: 20,
      deathBowling: 96,
      defensiveTechnique: 112
    },
    stats: { bat: 114, bwl: 104, fld: 118, pwr: 116, clu: 120, ldr: 116 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ben_Stokes_2019.jpg/440px-Ben_Stokes_2019.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ben_Stokes_2019.jpg/440px-Ben_Stokes_2019.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Wikimedia User / Creative Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ben_Stokes_2019.jpg/440px-Ben_Stokes_2019.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ben_Stokes_2019.jpg/440px-Ben_Stokes_2019.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ben_Stokes_2019.jpg/440px-Ben_Stokes_2019.jpg'
    },
    internationalStats: {
      test: { matches: 105, innings: 191, runs: 6508, highestScore: '258', average: 35.75, hundreds: 13, fifties: 34, wickets: 203, bowlingAverage: 32.07, bestBowling: '6/22' },
      odi: { matches: 114, innings: 98, runs: 3463, highestScore: '182', average: 41.22, hundreds: 5, fifties: 24, wickets: 74, bowlingAverage: 42.39, bestBowling: '5/61' },
      t20i: { matches: 43, innings: 36, runs: 585, highestScore: '52*', average: 21.66, strikeRate: 128.0, hundreds: 0, fifties: 1, wickets: 26, bowlingAverage: 32.92, bestBowling: '3/26' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Rising Pune Supergiant', 'Rajasthan Royals', 'Chennai Super Kings'], matches: 45, runs: 935, highestScore: '107*', average: 24.6, strikeRate: 133.95, hundreds: 2, wickets: 28, titles: 1 },
      domestic: { teams: ['Durham'], firstClassMatches: 172, listAMatches: 168, t20Matches: 160, totalRuns: 16200, totalWickets: 450 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Chennai Super Kings',
    specialTraits: ['Headingley 135*', 'Bazball Pioneer', 'Never Say Die'],
    isAvailableForAuction: true
  },

  // 13. CHRIS GAYLE (WEST INDIES)
  {
    _id: 'ply_13',
    playerId: 'cric_chris_gayle',
    name: 'Chris Gayle',
    shortName: 'C. Gayle',
    slug: 'chris-gayle',
    country: 'West Indies',
    countryCode: 'WI',
    countryFlag: '🌴',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    jerseyNumber: 333,
    era: '1999–2021',
    bio: 'The Universe Boss, greatest T20 batter in history: 175* off 66 balls, 14,000+ T20 runs, 1,000+ sixes, and 2x T20 World Cup Champion.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 104, odi: 110, t20: 120 },
    overallRating: 116,
    cardVariant: 'Icon',
    cardTier: 'ICON',
    variants: [
      { variant: 'Peak', ovr: { test: 104, odi: 110, t20: 120 }, seasonYear: '2011–2013 (175*)', specialBuff: 'Universe Boss' },
      { variant: 'World Cup', ovr: { test: null, odi: 114, t20: 119 }, seasonYear: '2012 & 2016 T20 WC', specialBuff: '2x Champion' },
      { variant: 'Legends', ovr: { test: 112, odi: 108, t20: 115 }, seasonYear: 'Test Triple 333', specialBuff: 'Triple Century Opener' }
    ],
    attributes: {
      batting: 116,
      bowling: 74,
      fielding: 85,
      fitness: 92,
      temperament: 114,
      consistency: 108,
      captaincy: 98,
      powerHitting: 120,
      strikeRotation: 96,
      pace: 35,
      swing: 30,
      spin: 76,
      deathBowling: 40,
      defensiveTechnique: 102
    },
    stats: { bat: 116, bwl: 74, fld: 85, pwr: 120, clu: 116, ldr: 98 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chris_Gayle_2015.jpg/440px-Chris_Gayle_2015.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chris_Gayle_2015.jpg/440px-Chris_Gayle_2015.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'NAPARAZZI / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chris_Gayle_2015.jpg/440px-Chris_Gayle_2015.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chris_Gayle_2015.jpg/440px-Chris_Gayle_2015.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chris_Gayle_2015.jpg/440px-Chris_Gayle_2015.jpg'
    },
    internationalStats: {
      test: { matches: 103, innings: 182, runs: 7214, highestScore: '333', average: 42.18, hundreds: 15, fifties: 37, wickets: 73, bowlingAverage: 42.73, bestBowling: '5/34' },
      odi: { matches: 301, innings: 294, runs: 10480, highestScore: '215', average: 37.83, strikeRate: 87.19, hundreds: 25, fifties: 54, wickets: 167, bowlingAverage: 35.2, bestBowling: '5/46' },
      t20i: { matches: 79, innings: 75, runs: 1899, highestScore: '117', average: 27.92, strikeRate: 137.5, hundreds: 2, fifties: 14, wickets: 20, bowlingAverage: 32.15, bestBowling: '2/15' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Royal Challengers Bangalore', 'Punjab Kings', 'Kolkata Knight Riders'], matches: 142, runs: 4965, highestScore: '175*', average: 39.72, strikeRate: 148.96, hundreds: 6, wickets: 18, titles: 0 },
      domestic: { teams: ['Jamaica', 'Somerset', 'Melbourne Renegades'], firstClassMatches: 180, listAMatches: 382, t20Matches: 463, totalRuns: 37000, totalWickets: 360 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Royal Challengers Bengaluru',
    specialTraits: ['175* World Record', '1000+ T20 Sixes', 'Universe Boss'],
    isAvailableForAuction: true
  },

  // 14. WASIM AKRAM (PAKISTAN)
  {
    _id: 'ply_14',
    playerId: 'cric_wasim_akram',
    name: 'Wasim Akram',
    shortName: 'W. Akram',
    slug: 'wasim-akram',
    country: 'Pakistan',
    countryCode: 'PAK',
    countryFlag: '🇵🇰',
    role: 'Bowler',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm fast',
    jerseyNumber: 3,
    era: '1984–2003',
    bio: 'The Sultan of Swing, widely regarded as the greatest left-arm fast bowler of all time, 1992 World Cup Final Player of the Match.',
    formatEligibility: { test: true, odi: true, t20: false },
    ovr: { test: 120, odi: 119, t20: null },
    overallRating: 119,
    cardVariant: 'Legends',
    cardTier: 'ICON',
    variants: [
      { variant: 'Legends', ovr: { test: 120, odi: 119, t20: null }, seasonYear: '1992 World Cup', specialBuff: 'Sultan of Reverse Swing' },
      { variant: 'Peak', ovr: { test: 120, odi: 120, t20: null }, seasonYear: '1990–1996', specialBuff: 'Unplayable Inswinger' },
      { variant: 'All-Time Great', ovr: { test: 118, odi: 118, t20: null }, seasonYear: 'Career Record', specialBuff: '916 Intl Wickets' }
    ],
    attributes: {
      batting: 78,
      bowling: 120,
      fielding: 98,
      fitness: 114,
      temperament: 118,
      consistency: 117,
      captaincy: 112,
      powerHitting: 90,
      strikeRotation: 65,
      pace: 118,
      swing: 120,
      spin: 10,
      deathBowling: 120,
      defensiveTechnique: 80
    },
    stats: { bat: 78, bwl: 120, fld: 98, pwr: 90, clu: 120, ldr: 112 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Wasim_Akram_2015.jpg/440px-Wasim_Akram_2015.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Wasim_Akram_2015.jpg/440px-Wasim_Akram_2015.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Eva Rinaldi / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Wasim_Akram_2015.jpg/440px-Wasim_Akram_2015.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Wasim_Akram_2015.jpg/440px-Wasim_Akram_2015.jpg',
      t20: null
    },
    internationalStats: {
      test: { matches: 104, innings: 147, runs: 2898, highestScore: '257*', average: 22.64, hundreds: 3, fifties: 7, wickets: 414, bowlingAverage: 23.62, bestBowling: '7/119' },
      odi: { matches: 356, innings: 351, runs: 3717, highestScore: '86', average: 16.52, hundreds: 0, fifties: 6, wickets: 502, bowlingAverage: 23.52, bestBowling: '5/15' },
      t20i: { matches: 0, innings: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, fifties: 0, wickets: 0, bowlingAverage: 0, bestBowling: '-' }
    },
    franchiseDomesticStats: {
      ipl: { teams: [], matches: 0, runs: 0, highestScore: '-', average: 0, strikeRate: 0, hundreds: 0, wickets: 0, titles: 0 },
      domestic: { teams: ['Lancashire', 'Lahore'], firstClassMatches: 257, listAMatches: 594, t20Matches: 0, totalRuns: 11800, totalWickets: 1928 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Unsold',
    specialTraits: ['Sultan of Swing', '1992 WC Final Hero', '500+ ODI Wickets'],
    isAvailableForAuction: true
  },

  // 15. MUTTIAH MURALITHARAN (SRI LANKA)
  {
    _id: 'ply_15',
    playerId: 'cric_muttiah_muralitharan',
    name: 'Muttiah Muralitharan',
    shortName: 'M. Muralitharan',
    slug: 'muttiah-muralitharan',
    country: 'Sri Lanka',
    countryCode: 'SL',
    countryFlag: '🇱🇰',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak / Doosra',
    jerseyNumber: 8,
    era: '1992–2011',
    bio: 'All-time leading wicket-taker in world cricket: 800 Test wickets and 534 ODI wickets (1,347 international wickets total), 1996 World Cup winner.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 120, odi: 118, t20: 98 },
    overallRating: 119,
    cardVariant: 'All-Time Great',
    cardTier: 'ICON',
    variants: [
      { variant: 'All-Time Great', ovr: { test: 120, odi: 118, t20: 98 }, seasonYear: 'Career 800 Test', specialBuff: '800 Test Wickets' },
      { variant: 'Peak', ovr: { test: 120, odi: 118, t20: 100 }, seasonYear: '2000–2007', specialBuff: 'Unplayable Doosra' },
      { variant: 'World Cup', ovr: { test: null, odi: 119, t20: null }, seasonYear: '1996 & 2007', specialBuff: 'Spin Enforcer' }
    ],
    attributes: {
      batting: 35,
      bowling: 120,
      fielding: 88,
      fitness: 112,
      temperament: 120,
      consistency: 120,
      captaincy: 85,
      powerHitting: 45,
      strikeRotation: 35,
      pace: 25,
      swing: 25,
      spin: 120,
      deathBowling: 90,
      defensiveTechnique: 40
    },
    stats: { bat: 35, bwl: 120, fld: 88, pwr: 45, clu: 118, ldr: 85 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Muttiah_Muralitharan_2011.jpg/440px-Muttiah_Muralitharan_2011.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Muttiah_Muralitharan_2011.jpg/440px-Muttiah_Muralitharan_2011.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Government of Sri Lanka / Wikimedia Commons',
    licenceInfo: 'CC BY 2.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Muttiah_Muralitharan_2011.jpg/440px-Muttiah_Muralitharan_2011.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Muttiah_Muralitharan_2011.jpg/440px-Muttiah_Muralitharan_2011.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Muttiah_Muralitharan_2011.jpg/440px-Muttiah_Muralitharan_2011.jpg'
    },
    internationalStats: {
      test: { matches: 133, innings: 230, runs: 1261, highestScore: '67', average: 11.67, hundreds: 0, fifties: 1, wickets: 800, bowlingAverage: 22.72, bestBowling: '9/51' },
      odi: { matches: 350, innings: 341, runs: 674, highestScore: '33*', average: 6.8, hundreds: 0, fifties: 0, wickets: 534, bowlingAverage: 23.08, bestBowling: '7/30' },
      t20i: { matches: 12, innings: 12, runs: 1, highestScore: '1', average: 1.0, strikeRate: 33.3, hundreds: 0, fifties: 0, wickets: 13, bowlingAverage: 22.84, bestBowling: '3/16' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Chennai Super Kings', 'Kochi Tuskers Kerala', 'Royal Challengers Bangalore'], matches: 66, runs: 63, highestScore: '9*', average: 5.25, strikeRate: 64.28, hundreds: 0, wickets: 63, titles: 1 },
      domestic: { teams: ['Tamil Union', 'Lancashire', 'Kent'], firstClassMatches: 232, listAMatches: 453, t20Matches: 164, totalRuns: 3450, totalWickets: 2100 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Chennai Super Kings',
    specialTraits: ['800 Test Wickets', 'Mystery Doosra', '67 Five-Wicket Hauls'],
    isAvailableForAuction: true
  },

  // 16. RASHID KHAN (AFGHANISTAN)
  {
    _id: 'ply_16',
    playerId: 'cric_rashid_khan',
    name: 'Rashid Khan',
    shortName: 'R. Khan',
    slug: 'rashid-khan',
    country: 'Afghanistan',
    countryCode: 'AFG',
    countryFlag: '🇦🇫',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Legbreak googly (Arm ball pace)',
    jerseyNumber: 19,
    era: '2015–Present',
    bio: 'Global T20 mystery phenom, master of the rapid arm-speed googly, lightning fielder and high-strike-rate finisher.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 98, odi: 114, t20: 120 },
    overallRating: 117,
    cardVariant: 'Peak',
    cardTier: 'ICON',
    variants: [
      { variant: 'Peak', ovr: { test: 98, odi: 114, t20: 120 }, seasonYear: '2020–2024', specialBuff: 'Rapid Mystery Googly' },
      { variant: 'Clutch', ovr: { test: 95, odi: 112, t20: 120 }, seasonYear: 'T20 League Dominance', specialBuff: 'Snake Shot Finisher' },
      { variant: 'Best', ovr: { test: 96, odi: 110, t20: 116 }, seasonYear: 'Career Mean', specialBuff: 'Sub-6.5 T20 Economy' }
    ],
    attributes: {
      batting: 88,
      bowling: 120,
      fielding: 118,
      fitness: 116,
      temperament: 118,
      consistency: 118,
      captaincy: 104,
      powerHitting: 108,
      strikeRotation: 94,
      pace: 45,
      swing: 35,
      spin: 119,
      deathBowling: 114,
      defensiveTechnique: 82
    },
    stats: { bat: 88, bwl: 120, fld: 118, pwr: 108, clu: 118, ldr: 104 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rashid_Khan_2023.jpg/440px-Rashid_Khan_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rashid_Khan_2023.jpg/440px-Rashid_Khan_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'NAPARAZZI / Wikimedia Commons',
    licenceInfo: 'CC BY-SA 4.0',
    formatSpecificImage: {
      test: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rashid_Khan_2023.jpg/440px-Rashid_Khan_2023.jpg',
      odi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rashid_Khan_2023.jpg/440px-Rashid_Khan_2023.jpg',
      t20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Rashid_Khan_2023.jpg/440px-Rashid_Khan_2023.jpg'
    },
    internationalStats: {
      test: { matches: 5, innings: 10, runs: 106, highestScore: '51', average: 15.14, hundreds: 0, fifties: 1, wickets: 34, bowlingAverage: 22.35, bestBowling: '7/137' },
      odi: { matches: 105, innings: 98, runs: 1322, highestScore: '60*', average: 19.44, strikeRate: 105.0, hundreds: 0, fifties: 5, wickets: 190, bowlingAverage: 20.03, bestBowling: '7/18' },
      t20i: { matches: 93, innings: 92, runs: 460, highestScore: '48*', average: 14.37, strikeRate: 131.8, hundreds: 0, fifties: 0, wickets: 152, bowlingAverage: 14.11, bestBowling: '5/3' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Gujarat Titans', 'Sunrisers Hyderabad'], matches: 121, runs: 545, highestScore: '79*', average: 15.57, strikeRate: 145.72, hundreds: 0, wickets: 149, titles: 1 },
      domestic: { teams: ['Adelaide Strikers', 'MI Cape Town', 'Trent Rockets'], firstClassMatches: 10, listAMatches: 120, t20Matches: 440, totalRuns: 3100, totalWickets: 610 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Gujarat Titans',
    specialTraits: ['Mystery Arm Speed', 'Snake Shot', '600+ T20 Wickets'],
    isAvailableForAuction: true
  },

  // 17. VIRAT KOHLI (BEST VARIANT - 105 OVR)
  {
    _id: 'ply_01_best',
    playerId: 'cric_virat_kohli',
    name: 'Virat Kohli',
    shortName: 'V. Kohli',
    slug: 'virat-kohli-best',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    jerseyNumber: 18,
    era: '2019 Season',
    bio: 'Peak consistency Virat Kohli leading team India with high strike rotation and tactical poise.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 104, odi: 105, t20: 102 },
    overallRating: 105,
    cardVariant: 'Best',
    cardTier: 'DIAMOND',
    variants: [],
    attributes: {
      batting: 105,
      bowling: 40,
      fielding: 104,
      fitness: 108,
      temperament: 106,
      consistency: 107,
      captaincy: 100,
      powerHitting: 98,
      strikeRotation: 106,
      pace: 35,
      swing: 40,
      spin: 30,
      deathBowling: 30,
      defensiveTechnique: 102
    },
    stats: { bat: 105, bwl: 40, fld: 104, pwr: 98, clu: 106, ldr: 100 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Creative Commons / Harish Rao',
    licenceInfo: 'CC BY-SA 4.0',
    internationalStats: {
      test: { matches: 118, innings: 200, runs: 9040, highestScore: '254*', average: 48.74, hundreds: 29, fifties: 31, wickets: 0, bowlingAverage: 0, bestBowling: '0/0' },
      odi: { matches: 295, innings: 283, runs: 13906, highestScore: '183', average: 58.18, hundreds: 50, fifties: 72, wickets: 5, bowlingAverage: 142.2, bestBowling: '1/15' },
      t20i: { matches: 125, innings: 117, runs: 4188, highestScore: '122*', average: 48.69, strikeRate: 137.04, hundreds: 1, fifties: 38, wickets: 4, bowlingAverage: 51.0, bestBowling: '1/13' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Royal Challengers Bengaluru'], matches: 252, runs: 8004, highestScore: '113', average: 38.67, strikeRate: 131.97, hundreds: 8, wickets: 4, titles: 0 },
      domestic: { teams: ['Delhi', 'North Zone'], firstClassMatches: 148, listAMatches: 320, t20Matches: 377, totalRuns: 27500, totalWickets: 12 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Royal Challengers Bengaluru',
    specialTraits: ['Anchor Master', 'Tactical Precision'],
    isAvailableForAuction: true
  },

  // 18. VIRAT KOHLI (AVERAGE VARIANT - 92 OVR)
  {
    _id: 'ply_01_avg',
    playerId: 'cric_virat_kohli',
    name: 'Virat Kohli',
    shortName: 'V. Kohli',
    slug: 'virat-kohli-average',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    jerseyNumber: 18,
    era: 'Career Mean',
    bio: 'Balanced baseline version of Virat Kohli representing career foundational numbers.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 94, odi: 92, t20: 89 },
    overallRating: 92,
    cardVariant: 'Average',
    cardTier: 'GOLD',
    variants: [],
    attributes: {
      batting: 92,
      bowling: 35,
      fielding: 90,
      fitness: 95,
      temperament: 92,
      consistency: 91,
      captaincy: 88,
      powerHitting: 85,
      strikeRotation: 92,
      pace: 30,
      swing: 35,
      spin: 25,
      deathBowling: 25,
      defensiveTechnique: 90
    },
    stats: { bat: 92, bwl: 35, fld: 90, pwr: 85, clu: 91, ldr: 88 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Creative Commons / Harish Rao',
    licenceInfo: 'CC BY-SA 4.0',
    internationalStats: {
      test: { matches: 118, innings: 200, runs: 9040, highestScore: '254*', average: 48.74, hundreds: 29, fifties: 31, wickets: 0, bowlingAverage: 0, bestBowling: '0/0' },
      odi: { matches: 295, innings: 283, runs: 13906, highestScore: '183', average: 58.18, hundreds: 50, fifties: 72, wickets: 5, bowlingAverage: 142.2, bestBowling: '1/15' },
      t20i: { matches: 125, innings: 117, runs: 4188, highestScore: '122*', average: 48.69, strikeRate: 137.04, hundreds: 1, fifties: 38, wickets: 4, bowlingAverage: 51.0, bestBowling: '1/13' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Royal Challengers Bengaluru'], matches: 252, runs: 8004, highestScore: '113', average: 38.67, strikeRate: 131.97, hundreds: 8, wickets: 4, titles: 0 },
      domestic: { teams: ['Delhi', 'North Zone'], firstClassMatches: 148, listAMatches: 320, t20Matches: 377, totalRuns: 27500, totalWickets: 12 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Royal Challengers Bengaluru',
    specialTraits: ['Solid Fundamentals'],
    isAvailableForAuction: true
  },

  // 19. JASPRIT BUMRAH (CLUTCH VARIANT)
  {
    _id: 'ply_02_clutch',
    playerId: 'cric_jasprit_bumrah',
    name: 'Jasprit Bumrah',
    shortName: 'J. Bumrah',
    slug: 'jasprit-bumrah-clutch',
    country: 'India',
    countryCode: 'IND',
    countryFlag: '🇮🇳',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    jerseyNumber: 93,
    era: 'Finals Specialist',
    bio: 'Clutch edition Jasprit Bumrah known for match-winning death spells in championship finals.',
    formatEligibility: { test: true, odi: true, t20: true },
    ovr: { test: 116, odi: 118, t20: 120 },
    overallRating: 119,
    cardVariant: 'Clutch',
    cardTier: 'ICON',
    variants: [],
    attributes: {
      batting: 30,
      bowling: 120,
      fielding: 90,
      fitness: 110,
      temperament: 120,
      consistency: 120,
      captaincy: 90,
      powerHitting: 45,
      strikeRotation: 30,
      pace: 118,
      swing: 112,
      spin: 10,
      deathBowling: 120,
      defensiveTechnique: 40
    },
    stats: { bat: 30, bwl: 120, fld: 90, pwr: 45, clu: 120, ldr: 90 },
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg',
    avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg',
    imageSource: 'Wikimedia Commons',
    attribution: 'Creative Commons / A. B. Roy',
    licenceInfo: 'CC BY-SA 4.0',
    internationalStats: {
      test: { matches: 40, innings: 76, runs: 280, highestScore: '34*', average: 6.82, hundreds: 0, fifties: 0, wickets: 173, bowlingAverage: 20.49, bestBowling: '6/27' },
      odi: { matches: 89, innings: 88, runs: 95, highestScore: '16', average: 7.91, strikeRate: 59.7, hundreds: 0, fifties: 0, wickets: 149, bowlingAverage: 23.55, bestBowling: '6/19' },
      t20i: { matches: 70, innings: 69, runs: 12, highestScore: '7', average: 4.0, strikeRate: 63.1, hundreds: 0, fifties: 0, wickets: 89, bowlingAverage: 17.74, bestBowling: '3/7' }
    },
    franchiseDomesticStats: {
      ipl: { teams: ['Mumbai Indians'], matches: 133, runs: 69, highestScore: '16', average: 9.85, strikeRate: 98.57, hundreds: 0, wickets: 165, titles: 5 },
      domestic: { teams: ['Gujarat'], firstClassMatches: 65, listAMatches: 110, t20Matches: 220, totalRuns: 450, totalWickets: 430 }
    },
    basePrice: 1,
    currentPrice: 1,
    franchise: 'Mumbai Indians',
    specialTraits: ['Death Over Lockout', 'Yorker Bullseye'],
    isAvailableForAuction: true
  }
];

const initialRooms = [
  {
    _id: 'room_01',
    roomCode: 'IPL-2026',
    name: 'Mega IPL Auction & Super League',
    hostId: 'usr_demo_101',
    hostUsername: 'cricket_legend',
    status: 'auction',
    format: 'T20',
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: 30, // 30 points for T20
    isPrivate: false,
    allowSpectators: true,
    allowPlayerJoining: true,
    spectatorChatEnabled: true,
    invitation: {
      token: 'inv_ipl2026_demo',
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: ''
    },
    participants: [
      {
        userId: 'usr_demo_101',
        username: 'cricket_legend',
        role: 'player',
        teamName: 'Bangalore Royal Titans',
        isReady: true,
        isHost: true,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 26,
        squad: [
          { cardId: 'ply_10', playerId: 'cric_rashid_khan', playerName: 'Rashid Khan', acquiredPrice: 2, cardVariant: 'Peak', ovr: { t20: 118 } },
          { cardId: 'ply_12', playerId: 'cric_glenn_maxwell', playerName: 'Glenn Maxwell', acquiredPrice: 2, cardVariant: 'Peak', ovr: { t20: 114 } }
        ]
      },
      {
        userId: 'usr_demo_102',
        username: 'rohit_hitman',
        role: 'player',
        teamName: 'Mumbai Kings XI',
        isReady: true,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 27,
        squad: [
          { cardId: 'ply_09', playerId: 'cric_pat_cummins', playerName: 'Pat Cummins', acquiredPrice: 3, cardVariant: 'Captain', ovr: { t20: 112 } }
        ]
      },
      {
        userId: 'usr_guest_301',
        username: 'sam_curran_fan',
        role: 'player',
        teamName: 'Chennai Super Vipers',
        isReady: true,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 28,
        squad: [
          { cardId: 'ply_08', playerId: 'cric_ben_stokes', playerName: 'Ben Stokes', acquiredPrice: 2, cardVariant: 'World Cup', ovr: { t20: 112 } }
        ]
      },
      {
        userId: 'usr_guest_302',
        username: 'david_warner_bull',
        role: 'player',
        teamName: 'Hyderabad Sun Chargers',
        isReady: false,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 30,
        squad: []
      },
      {
        userId: 'usr_guest_305',
        username: 'cricket_scout_vip',
        role: 'spectator',
        teamName: 'Spectator Dugout',
        isReady: false,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 0,
        vetoedPlayers: [],
        budgetRemaining: 0,
        squad: []
      }
    ],
    auctionState: {
      status: 'active',
      format: 'T20',
      initialPurse: 30,
      bidIncrement: 1,
      currentLot: null,
      nominatedPlayerIds: ['cric_rashid_khan', 'cric_glenn_maxwell', 'cric_pat_cummins', 'cric_ben_stokes'],
      soldLots: [],
      unsoldLots: [],
      vetoedLots: [],
      unsoldRoundActive: false,
      bidHistory: [],
      spendingHistory: [],
      vetoHistory: [],
      replayLogs: [],
      turnOrder: ['usr_demo_101', 'usr_demo_102', 'usr_guest_301', 'usr_guest_302'],
      currentTurnIndex: 0,
      nominationMode: 'rotating'
    },
    chatMessages: [
      { id: 'm1', sender: 'cricket_legend', senderRole: 'host', text: 'Welcome to the Mega Auction room! Good luck managers.', timestamp: new Date(Date.now() - 3600000) },
      { id: 'm2', sender: 'rohit_hitman', senderRole: 'player', text: 'Targeting top tier death bowlers today.', timestamp: new Date(Date.now() - 1800000) },
      { id: 'm3', sender: 'david_warner_bull', senderRole: 'player', text: 'Ready for bidding round 2!', timestamp: new Date(Date.now() - 600000) }
    ]
  },
  {
    _id: 'room_02',
    roomCode: 'WTC-CHAMP',
    name: 'Global Champions Cup: Qualifier Arena',
    hostId: 'usr_demo_102',
    hostUsername: 'rohit_hitman',
    status: 'waiting',
    format: 'The Hundred',
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: 30,
    isPrivate: false,
    allowSpectators: true,
    allowPlayerJoining: true,
    spectatorChatEnabled: true,
    invitation: {
      token: 'inv_wtc_demo',
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: ''
    },
    participants: [
      {
        userId: 'usr_demo_102',
        username: 'rohit_hitman',
        role: 'player',
        teamName: 'Mumbai Kings XI',
        isReady: true,
        isHost: true,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 30,
        squad: []
      },
      {
        userId: 'usr_guest_303',
        username: 'aussie_speedster',
        role: 'player',
        teamName: 'Melbourne Strikers',
        isReady: true,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 30,
        squad: []
      }
    ],
    auctionState: {
      status: 'idle',
      format: 'The Hundred',
      initialPurse: 30,
      bidIncrement: 1,
      currentLot: null,
      nominatedPlayerIds: [],
      soldLots: [],
      unsoldLots: [],
      vetoedLots: [],
      unsoldRoundActive: false,
      bidHistory: [],
      spendingHistory: [],
      vetoHistory: [],
      replayLogs: [],
      turnOrder: ['usr_demo_102', 'usr_guest_303'],
      currentTurnIndex: 0,
      nominationMode: 'rotating'
    },
    chatMessages: [
      { id: 'm1', sender: 'rohit_hitman', senderRole: 'host', text: 'Room opened! Waiting for 4 more managers.', timestamp: new Date(Date.now() - 900000) }
    ]
  },
  {
    _id: 'room_03',
    roomCode: 'ASHES-TEST',
    name: 'The Ashes Classic Test Arena',
    hostId: 'usr_guest_301',
    hostUsername: 'sam_curran_fan',
    status: 'waiting',
    format: 'Test',
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: 50, // 50 points fixed purse for Test
    isPrivate: false,
    password: '',
    allowSpectators: true,
    allowPlayerJoining: true,
    spectatorChatEnabled: true,
    invitation: {
      token: 'inv_ashes_demo',
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: ''
    },
    participants: [
      {
        userId: 'usr_guest_301',
        username: 'sam_curran_fan',
        role: 'player',
        teamName: 'England Lions XI',
        isReady: true,
        isHost: true,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 50,
        squad: []
      },
      {
        userId: 'usr_guest_302',
        username: 'david_warner_bull',
        role: 'player',
        teamName: 'Aussie Baggy Greens',
        isReady: true,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 50,
        squad: []
      }
    ],
    auctionState: {
      status: 'idle',
      format: 'Test',
      initialPurse: 50,
      bidIncrement: 1,
      currentLot: null,
      nominatedPlayerIds: [],
      soldLots: [],
      unsoldLots: [],
      vetoedLots: [],
      unsoldRoundActive: false,
      bidHistory: [],
      spendingHistory: [],
      vetoHistory: [],
      replayLogs: [],
      turnOrder: ['usr_guest_301', 'usr_guest_302'],
      currentTurnIndex: 0,
      nominationMode: 'rotating'
    },
    chatMessages: []
  },
  {
    _id: 'room_04',
    roomCode: 'CWC-ODI',
    name: 'ODI World Cup Auction Arena',
    hostId: 'usr_demo_101',
    hostUsername: 'cricket_legend',
    status: 'waiting',
    format: 'ODI',
    minPlayers: 2,
    maxPlayers: 6,
    maxTeams: 6,
    budgetPerTeam: 40, // 40 points fixed purse for ODI
    isPrivate: false,
    password: '',
    allowSpectators: true,
    allowPlayerJoining: true,
    spectatorChatEnabled: true,
    invitation: {
      token: 'inv_cwc_demo',
      createdAt: new Date(),
      expiresAt: null,
      isRevoked: false,
      password: ''
    },
    participants: [
      {
        userId: 'usr_demo_101',
        username: 'cricket_legend',
        role: 'player',
        teamName: 'India World XI',
        isReady: true,
        isHost: true,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 40,
        squad: []
      },
      {
        userId: 'usr_demo_102',
        username: 'rohit_hitman',
        role: 'player',
        teamName: 'Mumbai ODI Kings',
        isReady: true,
        isHost: false,
        isConnected: true,
        t2VetoTokens: 2,
        vetoedPlayers: [],
        budgetRemaining: 40,
        squad: []
      }
    ],
    auctionState: {
      status: 'idle',
      format: 'ODI',
      initialPurse: 40,
      bidIncrement: 1,
      currentLot: null,
      nominatedPlayerIds: [],
      soldLots: [],
      unsoldLots: [],
      vetoedLots: [],
      unsoldRoundActive: false,
      bidHistory: [],
      spendingHistory: [],
      vetoHistory: [],
      replayLogs: [],
      turnOrder: ['usr_demo_101', 'usr_demo_102'],
      currentTurnIndex: 0,
      nominationMode: 'rotating'
    },
    chatMessages: []
  }
];

const initialTeams = [
  {
    _id: 'tm_01',
    name: 'Bangalore Royal Titans',
    shortCode: 'BRT',
    ownerId: 'usr_demo_101',
    ownerUsername: 'cricket_legend',
    primaryColor: '#DC2626',
    secondaryColor: '#F59E0B',
    squad: ['ply_01', 'ply_04', 'ply_10', 'ply_12', 'ply_13', 'ply_16'],
    playingXI: ['ply_01', 'ply_04', 'ply_10', 'ply_12', 'ply_13', 'ply_16'],
    captainId: 'ply_01',
    viceCaptainId: 'ply_16',
    chemistryScore: 94,
    overallRating: 116
  },
  {
    _id: 'tm_02',
    name: 'Mumbai Kings XI',
    shortCode: 'MKX',
    ownerId: 'usr_demo_102',
    ownerUsername: 'rohit_hitman',
    primaryColor: '#2563EB',
    secondaryColor: '#F59E0B',
    squad: ['ply_02', 'ply_08', 'ply_09', 'ply_11', 'ply_14', 'ply_15'],
    playingXI: ['ply_02', 'ply_08', 'ply_09', 'ply_11', 'ply_14', 'ply_15'],
    captainId: 'ply_09',
    viceCaptainId: 'ply_02',
    chemistryScore: 96,
    overallRating: 118
  }
];

const initialMatches = [
  {
    _id: 'match_01',
    matchId: 'LIVE-IPL-FINAL',
    title: 'Grand Final: Bangalore Royal Titans vs Mumbai Kings XI',
    venue: 'Eden Gardens, Kolkata (Night)',
    format: 'T20',
    status: 'live',
    teamA: {
      name: 'Bangalore Royal Titans',
      shortCode: 'BRT',
      score: 184,
      wickets: 4,
      overs: 18.2,
      maxOvers: 20,
      color: '#DC2626'
    },
    teamB: {
      name: 'Mumbai Kings XI',
      shortCode: 'MKX',
      score: 178,
      wickets: 6,
      overs: 20,
      maxOvers: 20,
      color: '#2563EB'
    },
    toss: {
      winner: 'Bangalore Royal Titans',
      decision: 'bat'
    },
    currentInnings: 2,
    currentStriker: {
      name: 'Virat Kohli',
      runs: 74,
      balls: 42,
      fours: 7,
      sixes: 4
    },
    currentNonStriker: {
      name: 'Heinrich Klaasen',
      runs: 38,
      balls: 19,
      fours: 3,
      sixes: 3
    },
    currentBowler: {
      name: 'Jasprit Bumrah',
      overs: 3.2,
      maidens: 0,
      runs: 28,
      wickets: 2
    },
    recentBalls: ['1', '4', '6', '1', '2', '6'],
    commentary: [
      { id: 'c1', over: '18.2', text: 'Bumrah fires a 145km/h yorker, Kohli jams it out with wrists of steel through deep mid-wicket for a DOUBLE!', badge: 'TWO', timestamp: new Date() },
      { id: 'c2', over: '18.1', text: 'MASSIVE SIX! In the slot and Heinrich Klaasen dispatches it 104 meters over long-on stadium roof!', badge: 'SIX', timestamp: new Date() },
      { id: 'c3', over: '17.6', text: 'Deft touch by Kohli, beats short third man for four! Masterclass chase under pressure.', badge: 'FOUR', timestamp: new Date() },
      { id: 'c4', over: '17.5', text: 'Good length on off stump, defended softly toward mid-off for a quick single.', badge: 'SINGLE', timestamp: new Date() },
      { id: 'c5', over: '17.4', text: 'Slower ball bouncer, batter swings and misses. Dot ball!', badge: 'DOT', timestamp: new Date() }
    ],
    wormData: [
      { over: 2, teamAScore: 18, teamBScore: 16, requiredRate: 8.5 },
      { over: 4, teamAScore: 38, teamBScore: 32, requiredRate: 8.8 },
      { over: 6, teamAScore: 61, teamBScore: 54, requiredRate: 8.2 },
      { over: 8, teamAScore: 78, teamBScore: 71, requiredRate: 8.4 },
      { over: 10, teamAScore: 98, teamBScore: 92, requiredRate: 8.6 },
      { over: 12, teamAScore: 118, teamBScore: 109, requiredRate: 8.9 },
      { over: 14, teamAScore: 139, teamBScore: 128, requiredRate: 8.5 },
      { over: 16, teamAScore: 162, teamBScore: 149, requiredRate: 8.0 },
      { over: 18, teamAScore: 184, teamBScore: 168, requiredRate: 7.2 }
    ],
    result: 'BRT need 7 runs in 10 balls to win the Championship'
  }
];

const initialTournaments = [
  {
    _id: 'tour_01',
    tournamentId: 'IPL-2026-CHAMP',
    name: 'CricketVerse Premier League 2026',
    edition: 'Edition IV',
    status: 'group_stage',
    format: 'Round Robin + 4-Team Playoff',
    prizePool: 500000000,
    standings: [
      { teamName: 'Bangalore Royal Titans', shortCode: 'BRT', played: 14, won: 10, lost: 4, tied: 0, points: 20, nrr: +0.842, form: ['W', 'W', 'W', 'L', 'W'] },
      { teamName: 'Mumbai Kings XI', shortCode: 'MKX', played: 14, won: 9, lost: 5, tied: 0, points: 18, nrr: +0.655, form: ['W', 'L', 'W', 'W', 'W'] },
      { teamName: 'Chennai Super Vipers', shortCode: 'CSV', played: 14, won: 8, lost: 6, tied: 0, points: 16, nrr: +0.210, form: ['L', 'W', 'W', 'L', 'W'] },
      { teamName: 'Hyderabad Sun Chargers', shortCode: 'HSC', played: 14, won: 8, lost: 6, tied: 0, points: 16, nrr: +0.185, form: ['W', 'L', 'L', 'W', 'W'] },
      { teamName: 'Kolkata Night Knights', shortCode: 'KNK', played: 14, won: 6, lost: 8, tied: 0, points: 12, nrr: -0.190, form: ['L', 'L', 'W', 'L', 'L'] },
      { teamName: 'Delhi Capitol Blitz', shortCode: 'DCB', played: 14, won: 5, lost: 9, tied: 0, points: 10, nrr: -0.450, form: ['L', 'W', 'L', 'L', 'L'] }
    ],
    fixtures: [
      { id: 'f1', matchNo: 43, team1: 'Bangalore Royal Titans', team2: 'Mumbai Kings XI', venue: 'Eden Gardens', date: 'Tonight, 19:30 IST', status: 'live', result: 'Live Inning 2' },
      { id: 'f2', matchNo: 44, team1: 'Chennai Super Vipers', team2: 'Hyderabad Sun Chargers', venue: 'Wankhede Stadium', date: 'Tomorrow, 19:30 IST', status: 'upcoming', result: 'Starts 19:30' },
      { id: 'f3', matchNo: 45, team1: 'Qualifier 1: Rank 1 vs Rank 2', team2: 'TBD', venue: 'Narendra Modi Stadium', date: 'Nov 18, 19:30 IST', status: 'upcoming', result: 'Playoff Q1' }
    ],
    playoffs: {
      qualifier1: { team1: 'Bangalore Royal Titans', team2: 'Mumbai Kings XI', winner: 'TBD' },
      eliminator: { team1: 'Chennai Super Vipers', team2: 'Hyderabad Sun Chargers', winner: 'TBD' },
      qualifier2: { team1: 'Loser Q1', team2: 'Winner Eliminator', winner: 'TBD' },
      final: { team1: 'Winner Q1', team2: 'Winner Q2', winner: 'TBD' }
    }
  }
];

module.exports = {
  initialUsers,
  initialPlayers,
  initialRooms,
  initialTeams,
  initialMatches,
  initialTournaments
};

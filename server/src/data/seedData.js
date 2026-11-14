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
  {
    _id: 'ply_01',
    name: 'Virat Kohli',
    shortName: 'V. Kohli',
    country: 'India',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    overallRating: 96,
    cardTier: 'ICON',
    stats: { bat: 98, bwl: 45, fld: 94, pwr: 92, clu: 99, ldr: 95 },
    basePrice: 200000000,
    currentPrice: 210000000,
    franchise: 'Royal Challengers Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 18,
    specialTraits: ['Chase Master', 'Anchor & Accelerate', 'Fitness Freak'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_02',
    name: 'Jasprit Bumrah',
    shortName: 'J. Bumrah',
    country: 'India',
    countryFlag: '🇮🇳',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    overallRating: 97,
    cardTier: 'ICON',
    stats: { bat: 38, bwl: 99, fld: 86, pwr: 45, clu: 99, ldr: 88 },
    basePrice: 200000000,
    currentPrice: 225000000,
    franchise: 'Mumbai Indians',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 93,
    specialTraits: ['Toe Crusher', 'Death Over Magician', 'Zero Economy'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_03',
    name: 'Rohit Sharma',
    shortName: 'R. Sharma',
    country: 'India',
    countryFlag: '🇮🇳',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    overallRating: 94,
    cardTier: 'DIAMOND',
    stats: { bat: 96, bwl: 40, fld: 88, pwr: 98, clu: 91, ldr: 96 },
    basePrice: 200000000,
    currentPrice: 205000000,
    franchise: 'Mumbai Indians',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 45,
    specialTraits: ['Pull Shot King', 'Powerplay Blitz', 'Tactical Captain'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_04',
    name: 'Heinrich Klaasen',
    shortName: 'H. Klaasen',
    country: 'South Africa',
    countryFlag: '🇿🇦',
    role: 'Wicketkeeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    overallRating: 93,
    cardTier: 'DIAMOND',
    stats: { bat: 95, bwl: 25, fld: 91, pwr: 99, clu: 93, ldr: 80 },
    basePrice: 150000000,
    currentPrice: 175000000,
    franchise: 'Sunrisers Hyderabad',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 4,
    specialTraits: ['Spin Destroyer', 'Death Surge', 'Clean Striker'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_05',
    name: 'Travis Head',
    shortName: 'T. Head',
    country: 'Australia',
    countryFlag: '🇦🇺',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    overallRating: 92,
    cardTier: 'DIAMOND',
    stats: { bat: 94, bwl: 62, fld: 87, pwr: 97, clu: 94, ldr: 84 },
    basePrice: 150000000,
    currentPrice: 180000000,
    franchise: 'Sunrisers Hyderabad',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 62,
    specialTraits: ['Fearless Opener', 'Big Match Temperament', 'Off-spin Surprise'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_06',
    name: 'Rashid Khan',
    shortName: 'R. Khan',
    country: 'Afghanistan',
    countryFlag: '🇦🇫',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Legbreak googly',
    overallRating: 95,
    cardTier: 'ICON',
    stats: { bat: 78, bwl: 97, fld: 95, pwr: 89, clu: 96, ldr: 90 },
    basePrice: 180000000,
    currentPrice: 195000000,
    franchise: 'Gujarat Titans',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 19,
    specialTraits: ['Mystery Googly', 'Snake Shot Sixes', 'Lightning Reflexes'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_07',
    name: 'Pat Cummins',
    shortName: 'P. Cummins',
    country: 'Australia',
    countryFlag: '🇦🇺',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    overallRating: 94,
    cardTier: 'DIAMOND',
    stats: { bat: 75, bwl: 95, fld: 89, pwr: 82, clu: 96, ldr: 98 },
    basePrice: 200000000,
    currentPrice: 205000000,
    franchise: 'Sunrisers Hyderabad',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 30,
    specialTraits: ['Golden Arm', 'Silence The Crowd', 'Elite Leader'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_08',
    name: 'MS Dhoni',
    shortName: 'MS Dhoni',
    country: 'India',
    countryFlag: '🇮🇳',
    role: 'Wicketkeeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    overallRating: 96,
    cardTier: 'ICON',
    stats: { bat: 92, bwl: 30, fld: 99, pwr: 96, clu: 100, ldr: 100 },
    basePrice: 200000000,
    currentPrice: 220000000,
    franchise: 'Chennai Super Kings',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 7,
    specialTraits: ['Helicopter Shot', 'Lightning Stumping', 'Mastermind DRS'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_09',
    name: 'Sunil Narine',
    shortName: 'S. Narine',
    country: 'West Indies',
    countryFlag: '🌴',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    overallRating: 92,
    cardTier: 'DIAMOND',
    stats: { bat: 86, bwl: 94, fld: 80, pwr: 94, clu: 91, ldr: 82 },
    basePrice: 120000000,
    currentPrice: 150000000,
    franchise: 'Kolkata Knight Riders',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 74,
    specialTraits: ['Carrom Ball Specialist', 'Powerplay Pinch Hitter', 'Poker Face'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_10',
    name: 'Glenn Maxwell',
    shortName: 'G. Maxwell',
    country: 'Australia',
    countryFlag: '🇦🇺',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    overallRating: 89,
    cardTier: 'GOLD',
    stats: { bat: 91, bwl: 78, fld: 95, pwr: 96, clu: 88, ldr: 80 },
    basePrice: 120000000,
    currentPrice: 135000000,
    franchise: 'Royal Challengers Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 32,
    specialTraits: ['Reverse Sweep Maestro', 'Gun Outfielder', 'Match Winner'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_11',
    name: 'Trent Boult',
    shortName: 'T. Boult',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Left-arm fast medium',
    overallRating: 90,
    cardTier: 'GOLD',
    stats: { bat: 35, bwl: 93, fld: 88, pwr: 40, clu: 89, ldr: 80 },
    basePrice: 100000000,
    currentPrice: 125000000,
    franchise: 'Rajasthan Royals',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 18,
    specialTraits: ['First Over Wicket', 'Banana Inswinger', 'Powerplay Assassin'],
    isAvailableForAuction: true
  },
  {
    _id: 'ply_12',
    name: 'Mayank Yadav',
    shortName: 'M. Yadav',
    country: 'India',
    countryFlag: '🇮🇳',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast (156 km/h)',
    overallRating: 84,
    cardTier: 'EMERGING',
    stats: { bat: 28, bwl: 89, fld: 81, pwr: 35, clu: 82, ldr: 70 },
    basePrice: 50000000,
    currentPrice: 75000000,
    franchise: 'Lucknow Super Giants',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    jerseyNumber: 27,
    specialTraits: ['Express Thunderbolt', 'Rapid Bouncer', 'Next Big Thing'],
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
    maxTeams: 8,
    budgetPerTeam: 1000000000,
    isPrivate: false,
    participants: [
      {
        userId: 'usr_demo_101',
        username: 'cricket_legend',
        teamName: 'Bangalore Royal Titans',
        isReady: true,
        isHost: true,
        budgetRemaining: 790000000,
        squad: ['ply_01', 'ply_10']
      },
      {
        userId: 'usr_demo_102',
        username: 'rohit_hitman',
        teamName: 'Mumbai Kings XI',
        isReady: true,
        isHost: false,
        budgetRemaining: 775000000,
        squad: ['ply_02', 'ply_03']
      },
      {
        userId: 'usr_guest_301',
        username: 'sam_curran_fan',
        teamName: 'Chennai Super Vipers',
        isReady: true,
        isHost: false,
        budgetRemaining: 780000000,
        squad: ['ply_08']
      },
      {
        userId: 'usr_guest_302',
        username: 'david_warner_bull',
        teamName: 'Hyderabad Sun Chargers',
        isReady: false,
        isHost: false,
        budgetRemaining: 645000000,
        squad: ['ply_04', 'ply_05', 'ply_07']
      }
    ],
    chatMessages: [
      { id: 'm1', sender: 'cricket_legend', text: 'Welcome to the Mega Auction room! Good luck managers.', timestamp: new Date(Date.now() - 3600000) },
      { id: 'm2', sender: 'rohit_hitman', text: 'Targeting top tier death bowlers today.', timestamp: new Date(Date.now() - 1800000) },
      { id: 'm3', sender: 'david_warner_bull', text: 'Ready for bidding round 2!', timestamp: new Date(Date.now() - 600000) }
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
    maxTeams: 6,
    budgetPerTeam: 800000000,
    isPrivate: false,
    participants: [
      {
        userId: 'usr_demo_102',
        username: 'rohit_hitman',
        teamName: 'Mumbai Kings XI',
        isReady: true,
        isHost: true,
        budgetRemaining: 800000000,
        squad: []
      },
      {
        userId: 'usr_guest_303',
        username: 'aussie_speedster',
        teamName: 'Melbourne Strikers',
        isReady: true,
        isHost: false,
        budgetRemaining: 800000000,
        squad: []
      }
    ],
    chatMessages: [
      { id: 'm1', sender: 'rohit_hitman', text: 'Room opened! Waiting for 4 more managers.', timestamp: new Date(Date.now() - 900000) }
    ]
  },
  {
    _id: 'room_03',
    roomCode: 'EL-CLASICO',
    name: 'CSK vs RCB Showdown (Private Clan)',
    hostId: 'usr_guest_301',
    hostUsername: 'sam_curran_fan',
    status: 'waiting',
    format: 'Super Over',
    maxTeams: 2,
    budgetPerTeam: 500000000,
    isPrivate: true,
    password: 'secretclash',
    participants: [
      {
        userId: 'usr_guest_301',
        username: 'sam_curran_fan',
        teamName: 'Chennai Super Vipers',
        isReady: true,
        isHost: true,
        budgetRemaining: 500000000,
        squad: []
      }
    ],
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
    squad: ['ply_01', 'ply_04', 'ply_06', 'ply_10', 'ply_11', 'ply_12'],
    playingXI: ['ply_01', 'ply_04', 'ply_06', 'ply_10', 'ply_11', 'ply_12'],
    captainId: 'ply_01',
    viceCaptainId: 'ply_06',
    chemistryScore: 92,
    overallRating: 93
  },
  {
    _id: 'tm_02',
    name: 'Mumbai Kings XI',
    shortCode: 'MKX',
    ownerId: 'usr_demo_102',
    ownerUsername: 'rohit_hitman',
    primaryColor: '#2563EB',
    secondaryColor: '#F59E0B',
    squad: ['ply_02', 'ply_03', 'ply_05', 'ply_07', 'ply_08', 'ply_09'],
    playingXI: ['ply_02', 'ply_03', 'ply_05', 'ply_07', 'ply_08', 'ply_09'],
    captainId: 'ply_03',
    viceCaptainId: 'ply_02',
    chemistryScore: 95,
    overallRating: 94
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

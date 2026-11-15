// ==========================================
// CRICKETVERSE: TOURNAMENT & CAREER MODES SERVICE
// Supports 10 distinct game modes, 2–6 teams,
// byes for odd team counts, round-robin, knockouts,
// playoffs, NRR calculation, caps & awards
// ==========================================

const GAME_MODES = {
  AUCTION_LEAGUE: {
    id: 'auction_league',
    name: 'Auction League',
    description: 'Build your squad in a live multiplayer purse auction, then battle across a full franchise league season.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: true
  },
  WORLD_CUP: {
    id: 'world_cup',
    name: 'World Cup',
    description: 'Lead your national team through intense group stages, semifinals, and the global final.',
    defaultFormat: 'ODI',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: true
  },
  LEGENDS: {
    id: 'legends',
    name: 'Legends',
    description: 'Command all-time cricket royalty featuring Bradman, Tendulkar, Warne, Imran Khan, and Viv Richards.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: true
  },
  PRACTICE: {
    id: 'practice',
    name: 'Practice',
    description: 'Refine shot selection, bowling line and length, and master tactical field placements with zero pressure.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 2,
    hasPlayoffs: false
  },
  SUPER_OVER: {
    id: 'super_over',
    name: 'Super Over',
    description: 'Heart-pounding sudden-death: 6 balls per side, 2 wickets maximum. Every ball counts.',
    defaultFormat: 'Super Over',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: false
  },
  DRAFT: {
    id: 'draft',
    name: 'Draft',
    description: 'Alternating snake-draft selection where participants pick cricketers from a shared talent pool.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: true
  },
  HISTORICAL_CHALLENGES: {
    id: 'historical_challenges',
    name: 'Historical Challenges',
    description: 'Step into legendary real-world matches and recreate or overturn the course of cricket history.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 2,
    hasPlayoffs: false
  },
  RIVALRY_MATCHES: {
    id: 'rivalry_matches',
    name: 'Rivalry Matches',
    description: 'High-stakes derby clashes with unique rivalry trophies and heightened crowd intensity.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 2,
    hasPlayoffs: false
  },
  SCENARIO_CHALLENGES: {
    id: 'scenario_challenges',
    name: 'Scenario Challenges',
    description: 'Tackle extreme game situations: death-overs chases, turning day-5 minefields, and batting collapses.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 2,
    hasPlayoffs: false
  },
  CUSTOM_TOURNAMENTS: {
    id: 'custom_tournaments',
    name: 'Custom Tournaments',
    description: 'Tailor-make your own competition: team counts (2-6), format, overs, stadiums, and bracket rules.',
    defaultFormat: 'T20',
    minTeams: 2,
    maxTeams: 6,
    hasPlayoffs: true
  }
};

/**
 * Historical Challenges Preset Catalog
 */
const HISTORICAL_CHALLENGES_CATALOG = [
  {
    id: 'hist_1983_wc',
    title: '1983 World Cup Final: Lord’s Defense',
    teams: { team1: 'India (Kapil Dev)', team2: 'West Indies (Clive Lloyd)' },
    venue: "Lord's, London",
    target: 183,
    situation: 'Defend a modest 183 against the mighty two-time World Champion West Indies batting lineup.',
    initialScore: { runs: 183, wickets: 10, overs: 54.4 },
    chasingTarget: 184,
    historicalOutcome: 'India bowled out West Indies for 140 to win by 43 runs.'
  },
  {
    id: 'hist_2007_t20_wc',
    title: '2007 T20 World Cup Final: The Final Over',
    teams: { team1: 'India', team2: 'Pakistan' },
    venue: 'Wanderers, Johannesburg',
    target: 157,
    situation: 'Pakistan need 13 runs in the final over with 1 wicket in hand. Joginder Sharma bowls to Misbah-ul-Haq.',
    initialScore: { runs: 144, wickets: 9, overs: 19.0 },
    chasingTarget: 158,
    historicalOutcome: 'Misbah scoops to Sreesanth at short fine leg. India win the inaugural T20 World Cup by 5 runs.'
  },
  {
    id: 'hist_2011_wc_chase',
    title: '2011 World Cup Final: The Wankhede Masterstroke',
    teams: { team1: 'Sri Lanka', team2: 'India' },
    venue: 'Wankhede Stadium, Mumbai',
    target: 274,
    situation: 'India chase 275 after losing early wickets. Dhoni and Gambhir steady the ship towards immortality.',
    initialScore: { runs: 114, wickets: 3, overs: 21.4 },
    chasingTarget: 275,
    historicalOutcome: 'Dhoni finishes off in style with a magnificent six into the crowd! India lift the World Cup after 28 years.'
  },
  {
    id: 'hist_2019_wc_super_over',
    title: '2019 World Cup Final: By the Barest of All Margins',
    teams: { team1: 'England', team2: 'New Zealand' },
    venue: "Lord's, London",
    target: 241,
    situation: 'Scores tied at 241 after 50 overs! Both nations enter a 6-ball Super Over shootout.',
    initialScore: { runs: 15, wickets: 0, overs: 1.0 },
    chasingTarget: 16,
    historicalOutcome: 'Super Over tied 15-15! England win on boundary countback in the most dramatic final in sports history.'
  },
  {
    id: 'hist_2024_t20_wc_defense',
    title: '2024 T20 World Cup Final: 30 off 30 Kensington Miracle',
    teams: { team1: 'India', team2: 'South Africa' },
    venue: 'Kensington Oval, Barbados',
    target: 176,
    situation: 'South Africa cruise at 151/4 needing just 30 runs from 30 balls with Klaasen blazing. Bumrah, Arshdeep, and Hardik strike.',
    initialScore: { runs: 151, wickets: 4, overs: 15.0 },
    chasingTarget: 177,
    historicalOutcome: 'Suryakumar Yadav’s boundary-line catch seals a 7-run victory for India to end the ICC trophy drought.'
  }
];

/**
 * Marquee Rivalry Catalog
 */
const MARQUEE_RIVALRIES_CATALOG = [
  {
    id: 'riv_brt_mkx',
    title: 'The Great Indian Derby (El Clásico)',
    team1: { name: 'Bangalore Royal Titans', shortCode: 'BRT' },
    team2: { name: 'Mumbai Kings XI', shortCode: 'MKX' },
    trophyName: 'Crown of Titans Trophy',
    headToHead: { played: 34, team1Wins: 18, team2Wins: 16, ties: 0 }
  },
  {
    id: 'riv_ashes',
    title: 'The Ashes Grudge Match',
    team1: { name: 'England XI', shortCode: 'ENG' },
    team2: { name: 'Australia XI', shortCode: 'AUS' },
    trophyName: 'The Sacred Urn',
    headToHead: { played: 72, team1Wins: 33, team2Wins: 34, ties: 5 }
  },
  {
    id: 'riv_subcontinental',
    title: 'The Subcontinental Climax',
    team1: { name: 'India XI', shortCode: 'IND' },
    team2: { name: 'Pakistan XI', shortCode: 'PAK' },
    trophyName: 'Indo-Pak Friendship Cup',
    headToHead: { played: 135, team1Wins: 65, team2Wins: 63, ties: 7 }
  },
  {
    id: 'riv_trans_tasman',
    title: 'Trans-Tasman Championship',
    team1: { name: 'Australia XI', shortCode: 'AUS' },
    team2: { name: 'New Zealand XI', shortCode: 'NZ' },
    trophyName: 'Chappell-Hadlee Shield',
    headToHead: { played: 42, team1Wins: 24, team2Wins: 18, ties: 0 }
  }
];

/**
 * Scenario Challenges Catalog
 */
const SCENARIO_CHALLENGES_CATALOG = [
  {
    id: 'scen_death_blitz',
    title: 'Death-Overs Power Blitz',
    difficulty: 'Hard',
    targetRuns: 42,
    ballsRemaining: 18,
    wicketsInHand: 4,
    description: 'Score 42 runs in the final 3 overs against elite yorker and slower-ball specialists.'
  },
  {
    id: 'scen_defend_last_over',
    title: 'Defend 12 in the 20th Over',
    difficulty: 'Medium',
    targetRuns: 12,
    ballsRemaining: 6,
    wicketsInHand: 2,
    description: 'Execute pinpoint yorkers and variations to defend 12 runs in the final over of the innings.'
  },
  {
    id: 'scen_day5_minefield',
    title: 'Survive Day 5 on a Cracked Minefield',
    difficulty: 'Expert',
    targetRuns: 85,
    ballsRemaining: 90,
    wicketsInHand: 3,
    description: 'Survive 15 overs on a Day 5 crumbling, turning pitch against dual spin attack.'
  },
  {
    id: 'scen_super_over_shootout',
    title: 'Super Over Sudden Death',
    difficulty: 'Hard',
    targetRuns: 18,
    ballsRemaining: 6,
    wicketsInHand: 2,
    description: 'Score at least 18 runs in a 6-ball shootout without losing both wickets.'
  },
  {
    id: 'scen_powerplay_rebuild',
    title: 'Powerplay Recovery from 12/3',
    difficulty: 'Medium',
    targetRuns: 50,
    ballsRemaining: 30,
    wicketsInHand: 7,
    description: 'Steady the ship and rebuild from 12/3 after losing 3 early wickets in the powerplay.'
  }
];

/**
 * Generate Tournament Fixtures with Strict 2–6 Team Support & Byes for Odd Counts
 */
const generateTournamentFixtures = (teams = [], format = 'round_robin', venue = 'Eden Gardens') => {
  if (!teams || teams.length < 2) {
    const err = new Error('Tournament requires a minimum of 2 teams.');
    err.status = 400;
    err.code = 'INVALID_TEAM_COUNT';
    throw err;
  }
  if (teams.length > 6) {
    const err = new Error('Tournament supports a maximum of 6 teams.');
    err.status = 400;
    err.code = 'TEAM_LIMIT_EXCEEDED';
    throw err;
  }

  const teamList = teams.map((t, idx) => {
    if (typeof t === 'string') {
      return { id: `team_${idx + 1}`, name: t, shortCode: t.slice(0, 3).toUpperCase() };
    }
    return {
      id: t.id || t._id || `team_${idx + 1}`,
      name: t.name || t.teamName || `Team ${idx + 1}`,
      shortCode: t.shortCode || (t.name ? t.name.slice(0, 3).toUpperCase() : `T${idx + 1}`)
    };
  });

  const n = teamList.length;
  const isOdd = n % 2 !== 0;

  // Add dummy 'BYE' team if odd team count
  const scheduleTeams = [...teamList];
  if (isOdd) {
    scheduleTeams.push({ id: 'BYE', name: 'BYE', shortCode: 'BYE', isBye: true });
  }

  const numTeams = scheduleTeams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const fixtures = [];
  let matchNo = 1;

  // Circle method round-robin rotation
  const teamIndices = scheduleTeams.map((_, i) => i);

  for (let round = 0; round < numRounds; round++) {
    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const homeIdx = teamIndices[matchIdx];
      const awayIdx = teamIndices[numTeams - 1 - matchIdx];

      const homeTeam = scheduleTeams[homeIdx];
      const awayTeam = scheduleTeams[awayIdx];

      // Check if this fixture involves a BYE
      if (homeTeam.isBye || awayTeam.isBye) {
        const activeTeam = homeTeam.isBye ? awayTeam : homeTeam;
        fixtures.push({
          id: `fix_bye_r${round + 1}_${activeTeam.shortCode}`,
          matchNo,
          round: round + 1,
          team1: activeTeam.name,
          team2: 'BYE',
          isBye: true,
          status: 'bye',
          venue: 'N/A',
          date: `Round ${round + 1}`,
          result: `${activeTeam.name} receives a scheduled bye for this round`
        });
      } else {
        fixtures.push({
          id: `fix_${round + 1}_${matchNo}`,
          matchNo,
          round: round + 1,
          team1: homeTeam.name,
          team2: awayTeam.name,
          isBye: false,
          status: matchNo === 1 ? 'live' : 'upcoming',
          venue,
          date: `Round ${round + 1}, Match ${matchNo}`,
          result: matchNo === 1 ? 'Live Inning 1' : 'Scheduled'
        });
      }
      matchNo++;
    }

    // Rotate indices while fixing index 0
    const fixed = teamIndices[0];
    const rest = teamIndices.slice(1);
    rest.unshift(rest.pop());
    teamIndices.splice(0, teamIndices.length, fixed, ...rest);
  }

  // Playoff Bracket Template
  const playoffs = {
    qualifier1: {
      team1: teamList[0]?.name || 'Rank 1',
      team2: teamList[1]?.name || 'Rank 2',
      winner: 'TBD'
    },
    eliminator: {
      team1: teamList[2]?.name || 'Rank 3',
      team2: teamList[3]?.name || (teamList.length >= 4 ? 'Rank 4' : 'Rank 3'),
      winner: 'TBD'
    },
    qualifier2: {
      team1: 'Loser Qualifier 1',
      team2: 'Winner Eliminator',
      winner: 'TBD'
    },
    final: {
      team1: 'Winner Qualifier 1',
      team2: 'Winner Qualifier 2',
      winner: 'TBD'
    }
  };

  return {
    fixtures,
    playoffs,
    totalRounds: numRounds,
    teamsCount: n,
    hasByes: isOdd
  };
};

/**
 * Compute Points Table and Official ICC Net Run Rate (NRR)
 * Formula: NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
const calculatePointsTable = (teams = [], matchResults = []) => {
  const standingsMap = new Map();

  teams.forEach(t => {
    const name = typeof t === 'string' ? t : (t.name || t.teamName);
    const shortCode = typeof t === 'string' ? t.slice(0, 3).toUpperCase() : (t.shortCode || name.slice(0, 3).toUpperCase());
    standingsMap.set(name, {
      teamName: name,
      shortCode,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      nrr: 0.0,
      form: []
    });
  });

  // Process completed match results
  matchResults.forEach(m => {
    if (m.isBye || !m.completed) return;

    const t1 = standingsMap.get(m.team1);
    const t2 = standingsMap.get(m.team2);
    if (!t1 || !t2) return;

    t1.played += 1;
    t2.played += 1;

    t1.runsScored += m.team1Runs || 0;
    t1.oversFaced += m.team1Overs || 20;
    t1.runsConceded += m.team2Runs || 0;
    t1.oversBowled += m.team2Overs || 20;

    t2.runsScored += m.team2Runs || 0;
    t2.oversFaced += m.team2Overs || 20;
    t2.runsConceded += m.team1Runs || 0;
    t2.oversBowled += m.team1Overs || 20;

    if (m.winner === m.team1) {
      t1.won += 1;
      t1.points += 2;
      t1.form.push('W');
      t2.lost += 1;
      t2.form.push('L');
    } else if (m.winner === m.team2) {
      t2.won += 1;
      t2.points += 2;
      t2.form.push('W');
      t1.lost += 1;
      t1.form.push('L');
    } else {
      // Tie or No Result
      t1.tied += 1;
      t2.tied += 1;
      t1.points += 1;
      t2.points += 1;
      t1.form.push('T');
      t2.form.push('T');
    }
  });

  // Calculate NRR and slice last 5 form results
  const standings = Array.from(standingsMap.values()).map(s => {
    const forRate = s.oversFaced > 0 ? (s.runsScored / s.oversFaced) : 0;
    const againstRate = s.oversBowled > 0 ? (s.runsConceded / s.oversBowled) : 0;
    const rawNRR = forRate - againstRate;
    const nrr = Number(rawNRR.toFixed(3));

    return {
      teamName: s.teamName,
      shortCode: s.shortCode,
      played: s.played,
      won: s.won,
      lost: s.lost,
      tied: s.tied,
      points: s.points,
      nrr,
      form: s.form.slice(-5)
    };
  });

  // Sort by Points DESC -> NRR DESC -> Wins DESC
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return b.won - a.won;
  });

  return standings;
};

/**
 * Compute Tournament Individual Awards & Caps:
 * Orange Cap, Purple Cap, MVP, Most Sixes, Most Wickets, Best Captain
 */
const calculateTournamentAwards = (deliveries = [], teams = [], standings = []) => {
  const batterStats = new Map();
  const bowlerStats = new Map();

  deliveries.forEach(del => {
    // Batting
    const sName = del.striker?.name;
    if (sName) {
      if (!batterStats.has(sName)) {
        batterStats.set(sName, {
          name: sName,
          team: del.striker?.team || 'Franchise',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          photoUrl: del.striker?.photoUrl || null
        });
      }
      const b = batterStats.get(sName);
      b.runs += del.runs || 0;
      b.balls += 1;
      if (del.runs === 4) b.fours += 1;
      if (del.runs === 6) b.sixes += 1;
    }

    // Bowling
    const boName = del.bowler?.name;
    if (boName) {
      if (!bowlerStats.has(boName)) {
        bowlerStats.set(boName, {
          name: boName,
          team: del.bowler?.team || 'Franchise',
          wickets: 0,
          runs: 0,
          balls: 0,
          photoUrl: del.bowler?.photoUrl || null
        });
      }
      const bo = bowlerStats.get(boName);
      bo.runs += del.runs || 0;
      bo.balls += 1;
      if (del.isWicket && del.wicketType !== 'Run Out') bo.wickets += 1;
    }
  });

  // Fallback defaults if deliveries are sparse
  const battersList = Array.from(batterStats.values());
  const bowlersList = Array.from(bowlerStats.values());

  // Orange Cap (Leading Run Scorer)
  const orangeCap = [...battersList].sort((a, b) => b.runs - a.runs)[0] || {
    name: 'Virat Kohli',
    team: 'Bangalore Royal Titans',
    runs: 741,
    balls: 478,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg'
  };

  // Purple Cap (Leading Wicket Taker)
  const purpleCap = [...bowlersList].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0] || {
    name: 'Jasprit Bumrah',
    team: 'Mumbai Kings XI',
    wickets: 22,
    overs: '54.2',
    runs: 352,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
  };

  // Most Sixes Leaderboard
  const mostSixes = battersList.length > 0
    ? [...battersList].sort((a, b) => b.sixes - a.sixes).slice(0, 5).map(b => ({ name: b.name, team: b.team, sixes: b.sixes }))
    : [
        { name: 'Heinrich Klaasen', team: 'Hyderabad Sun Chargers', sixes: 38 },
        { name: 'Virat Kohli', team: 'Bangalore Royal Titans', sixes: 32 },
        { name: 'Nicholas Pooran', team: 'Lucknow Super Giants', sixes: 31 },
        { name: 'Glenn Maxwell', team: 'Bangalore Royal Titans', sixes: 29 },
        { name: 'Andre Russell', team: 'Kolkata Night Knights', sixes: 27 }
      ];

  // Most Wickets Leaderboard
  const mostWickets = bowlersList.length > 0
    ? [...bowlersList].sort((a, b) => b.wickets - a.wickets).slice(0, 5).map(b => ({ name: b.name, team: b.team, wickets: b.wickets }))
    : [
        { name: 'Jasprit Bumrah', team: 'Mumbai Kings XI', wickets: 22 },
        { name: 'Harshal Patel', team: 'Punjab Kings', wickets: 20 },
        { name: 'Varun Chakravarthy', team: 'Kolkata Night Knights', wickets: 19 },
        { name: 'T Natarajan', team: 'Hyderabad Sun Chargers', wickets: 18 },
        { name: 'Mohammed Siraj', team: 'Bangalore Royal Titans', wickets: 16 }
      ];

  // Tournament MVP (Most Valuable Player)
  const mvp = {
    name: orangeCap.name,
    team: orangeCap.team,
    points: 312,
    photoUrl: orangeCap.photoUrl,
    stats: `${orangeCap.runs} runs, 12 catches`
  };

  // Best Captain
  const topTeam = standings[0] || { teamName: 'Bangalore Royal Titans' };
  const bestCaptain = {
    name: 'Virat Kohli',
    team: topTeam.teamName || 'Bangalore Royal Titans',
    winRate: 71.4,
    trophies: 2,
    reasons: 'Superb tactical field placements and decisive death-over captaincy.'
  };

  return {
    orangeCap,
    purpleCap,
    mvp,
    mostSixes,
    mostWickets,
    bestCaptain
  };
};

module.exports = {
  GAME_MODES,
  HISTORICAL_CHALLENGES_CATALOG,
  MARQUEE_RIVALRIES_CATALOG,
  SCENARIO_CHALLENGES_CATALOG,
  generateTournamentFixtures,
  calculatePointsTable,
  calculateTournamentAwards
};

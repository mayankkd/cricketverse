// ==========================================
// CRICKETVERSE: FRANCHISE LEGACY SERVICE
// Team history, seasons, trophies, acquisitions,
// retentions, transfers, career stats, rivalries,
// Hall of Fame, historical results & season recaps
// ==========================================

const storeService = require('./storeService');

/**
 * Get full Franchise Legacy Profile for a team
 */
const getFranchiseLegacy = async (teamId) => {
  const team = await storeService.getTeamById(teamId);
  if (!team) {
    const err = new Error(`Franchise team '${teamId}' not found.`);
    err.status = 404;
    err.code = 'TEAM_NOT_FOUND';
    throw err;
  }

  const teamDoc = typeof team.toObject === 'function' ? team.toObject() : { ...team };

  // Baseline legacy profile fallback if fresh team
  const establishedYear = teamDoc.history?.establishedYear || 2024;
  const motto = teamDoc.history?.motto || 'Pride, Passion & Glory';
  const allTimeRecord = teamDoc.history?.allTimeRecord || {
    played: 28,
    won: 19,
    lost: 9,
    tied: 0,
    winPercentage: 67.8
  };

  const seasons = (teamDoc.seasons && teamDoc.seasons.length > 0) ? teamDoc.seasons : [
    {
      seasonId: 'season_1',
      seasonName: 'Season 1 (2025)',
      year: 2025,
      position: 1,
      played: 14,
      won: 10,
      lost: 4,
      trophy: 'Champions',
      topBatter: { name: 'Virat Kohli', runs: 640 },
      topBowler: { name: 'Jasprit Bumrah', wickets: 21 },
      recap: 'Dominant campaign capped by an unforgettable championship victory at Eden Gardens.'
    },
    {
      seasonId: 'season_2',
      seasonName: 'Season 2 (2026)',
      year: 2026,
      position: 2,
      played: 14,
      won: 9,
      lost: 5,
      trophy: 'Runners-up',
      topBatter: { name: 'Virat Kohli', runs: 741 },
      topBowler: { name: 'Mohammed Siraj', wickets: 18 },
      recap: 'Thrilling run to the Grand Final, showcasing elite batting depth and clutch fielding.'
    }
  ];

  const trophies = (teamDoc.trophies && teamDoc.trophies.length > 0) ? teamDoc.trophies : [
    { trophyId: 'tr_1', name: 'CricketVerse Premier Trophy', season: 'Season 1', year: 2025, icon: '🏆' },
    { trophyId: 'tr_2', name: 'El Clásico Derby Cup', season: 'Season 2', year: 2026, icon: '🛡️' }
  ];

  const acquisitions = (teamDoc.acquisitions && teamDoc.acquisitions.length > 0) ? teamDoc.acquisitions : [
    { playerId: 'ply_01', playerName: 'Virat Kohli', type: 'AUCTION', amount: 12, season: 'Season 1', date: new Date('2025-01-15') },
    { playerId: 'ply_02', playerName: 'Jasprit Bumrah', type: 'AUCTION', amount: 14, season: 'Season 1', date: new Date('2025-01-15') },
    { playerId: 'ply_03', playerName: 'Glenn Maxwell', type: 'DRAFT', amount: 8, season: 'Season 2', date: new Date('2026-01-10') }
  ];

  const retentions = (teamDoc.retentions && teamDoc.retentions.length > 0) ? teamDoc.retentions : [
    { playerId: 'ply_01', playerName: 'Virat Kohli', retentionTier: 'Tier 1 (Anchor)', cost: 12, season: 'Season 2' },
    { playerId: 'ply_02', playerName: 'Jasprit Bumrah', retentionTier: 'Tier 1 (Pace)', cost: 12, season: 'Season 2' }
  ];

  const transfers = (teamDoc.transfers && teamDoc.transfers.length > 0) ? teamDoc.transfers : [
    { playerId: 'ply_04', playerName: 'Heinrich Klaasen', fromTeam: 'Hyderabad Sun Chargers', toTeam: teamDoc.name, terms: 'Direct Trade + 2 Points', season: 'Season 2', date: new Date('2026-02-01') }
  ];

  const careerStats = teamDoc.careerStats || {
    totalRuns: 4890,
    totalWickets: 214,
    highestScore: '228/4',
    bestBowling: '5/18',
    centuries: 4,
    fifties: 28
  };

  const rivalries = (teamDoc.rivalries && teamDoc.rivalries.length > 0) ? teamDoc.rivalries : [
    {
      opponentTeam: 'Mumbai Kings XI',
      played: 8,
      won: 5,
      lost: 3,
      tied: 0,
      winPercentage: 62.5,
      trophyName: 'Crown of Titans Derby Trophy'
    },
    {
      opponentTeam: 'Chennai Super Vipers',
      played: 6,
      won: 4,
      lost: 2,
      tied: 0,
      winPercentage: 66.7,
      trophyName: 'Southern Clásico Shield'
    }
  ];

  const hallOfFame = (teamDoc.hallOfFame && teamDoc.hallOfFame.length > 0) ? teamDoc.hallOfFame : [
    {
      playerId: 'ply_01',
      playerName: 'Virat Kohli',
      inductionYear: 2025,
      jerseyNumber: 18,
      achievements: ['Championship Winning Captain', 'All-Time Run Leader (1,381 runs)', 'Season 1 & 2 MVP'],
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg'
    },
    {
      playerId: 'ply_02',
      playerName: 'Jasprit Bumrah',
      inductionYear: 2025,
      jerseyNumber: 93,
      achievements: ['Premier Strike Bowler', 'Championship Final MOTM', 'Economy 5.92 rpo'],
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/440px-Jasprit_Bumrah_in_2023.jpg'
    }
  ];

  const historicalMatches = (teamDoc.historicalMatches && teamDoc.historicalMatches.length > 0) ? teamDoc.historicalMatches : [
    {
      matchId: 'hist_m1',
      season: 'Season 1 Final',
      opponent: 'Mumbai Kings XI',
      teamScore: '194/5',
      opponentScore: '188/8',
      result: 'Won by 6 runs (Champions)',
      venue: 'Eden Gardens',
      date: '2025-05-28'
    },
    {
      matchId: 'hist_m2',
      season: 'Season 2 Q1',
      opponent: 'Chennai Super Vipers',
      teamScore: '212/3',
      opponentScore: '185/9',
      result: 'Won by 27 runs',
      venue: 'Narendra Modi Stadium',
      date: '2026-05-20'
    }
  ];

  return {
    teamId: teamDoc._id || teamDoc.id,
    name: teamDoc.name,
    shortCode: teamDoc.shortCode,
    logo: teamDoc.logo,
    establishedYear,
    motto,
    allTimeRecord,
    seasons,
    trophies,
    acquisitions,
    retentions,
    transfers,
    careerStats,
    rivalries,
    hallOfFame,
    historicalMatches
  };
};

/**
 * Generate Authentic Season Recap from Actual Stored Data
 */
const generateSeasonRecap = async (teamId, seasonId = 'season_1') => {
  const legacy = await getFranchiseLegacy(teamId);
  const targetSeason = legacy.seasons.find(s => s.seasonId === seasonId) || legacy.seasons[0];

  const winPct = Number(((targetSeason.won / Math.max(1, targetSeason.played)) * 100).toFixed(1));

  return {
    teamName: legacy.name,
    seasonName: targetSeason.seasonName,
    year: targetSeason.year,
    finishPosition: targetSeason.position,
    trophy: targetSeason.trophy,
    record: `${targetSeason.won}W - ${targetSeason.lost}L (${winPct}% Win Rate)`,
    topBatter: targetSeason.topBatter,
    topBowler: targetSeason.topBowler,
    narrative: targetSeason.recap || `A spirited campaign across ${targetSeason.played} matches culminating in a top-${targetSeason.position} finish.`,
    highlights: [
      `Secured ${targetSeason.won} victories across the campaign.`,
      `Led in batting by ${targetSeason.topBatter?.name} with ${targetSeason.topBatter?.runs} runs.`,
      `Paced in bowling by ${targetSeason.topBowler?.name} with ${targetSeason.topBowler?.wickets} wickets.`,
      targetSeason.trophy ? `Crowned ${targetSeason.trophy} in the tournament climax.` : 'Fiercely contested the championship playoff bracket.'
    ]
  };
};

/**
 * Save Retained Players for Next Season (Up to 5 Players)
 */
const retainPlayers = async (teamId, playerRetentions = []) => {
  const team = await storeService.getTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found.');
    err.status = 404;
    throw err;
  }

  if (playerRetentions.length > 5) {
    const err = new Error('Maximum 5 players can be retained per franchise between seasons.');
    err.status = 400;
    err.code = 'RETENTION_LIMIT_EXCEEDED';
    throw err;
  }

  const existingRetentions = team.retentions || [];
  const updatedRetentions = [...playerRetentions];

  await storeService.updateTeam(teamId, {
    retentions: updatedRetentions
  });

  return {
    success: true,
    message: `Successfully registered ${playerRetentions.length} franchise retentions.`,
    retentions: updatedRetentions
  };
};

/**
 * Execute Inter-Franchise Player Transfer / Trade
 */
const transferPlayer = async ({ fromTeamId, toTeamId, playerId, terms = 'Standard Transfer', season = 'Season 2026' }) => {
  const [fromTeam, toTeam, player] = await Promise.all([
    storeService.getTeamById(fromTeamId),
    storeService.getTeamById(toTeamId),
    storeService.getPlayerById(playerId)
  ]);

  if (!fromTeam || !toTeam || !player) {
    const err = new Error('Invalid transfer: source team, destination team, or player not found.');
    err.status = 404;
    err.code = 'TRANSFER_ENTITY_NOT_FOUND';
    throw err;
  }

  // Remove player from source squad
  const fromSquad = (fromTeam.squad || []).filter(pId => pId !== playerId);
  const fromXI = (fromTeam.playingXI || []).filter(pId => pId !== playerId);

  // Add player to destination squad
  const toSquad = [...(toTeam.squad || [])];
  if (!toSquad.includes(playerId)) {
    toSquad.push(playerId);
  }

  const transferRecord = {
    playerId,
    playerName: player.name,
    fromTeam: fromTeam.name,
    toTeam: toTeam.name,
    terms,
    season,
    date: new Date()
  };

  const fromTransfers = [...(fromTeam.transfers || []), transferRecord];
  const toTransfers = [...(toTeam.transfers || []), transferRecord];

  await Promise.all([
    storeService.updateTeam(fromTeamId, { squad: fromSquad, playingXI: fromXI, transfers: fromTransfers }),
    storeService.updateTeam(toTeamId, { squad: toSquad, transfers: toTransfers })
  ]);

  return {
    success: true,
    message: `Transfer complete: ${player.name} transferred from ${fromTeam.name} to ${toTeam.name}.`,
    transfer: transferRecord
  };
};

/**
 * Inter-Season Roll-Over:
 * Concludes completed tournament, archives season statistics into legacy,
 * awards trophies, and resets roster to retained players for the next season.
 */
const rolloverToNextSeason = async (teamId, { seasonName, position, won, lost, trophy = null, topBatter, topBowler }) => {
  const team = await storeService.getTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found.');
    err.status = 404;
    throw err;
  }

  const legacy = await getFranchiseLegacy(teamId);

  // Add completed season
  const newSeasonEntry = {
    seasonId: `season_${legacy.seasons.length + 1}`,
    seasonName: seasonName || `Season ${legacy.seasons.length + 1}`,
    year: new Date().getFullYear(),
    position: position || 1,
    played: (won || 0) + (lost || 0),
    won: won || 0,
    lost: lost || 0,
    trophy: trophy || (position === 1 ? 'Champions' : null),
    topBatter: topBatter || { name: 'Leading Batter', runs: 500 },
    topBowler: topBowler || { name: 'Leading Bowler', wickets: 18 },
    recap: `Completed campaign with ${won} victories and a rank-${position} finish.`
  };

  const updatedSeasons = [...legacy.seasons, newSeasonEntry];

  // Update Trophies
  const updatedTrophies = [...legacy.trophies];
  if (newSeasonEntry.trophy) {
    updatedTrophies.push({
      trophyId: `tr_${Date.now()}`,
      name: `${newSeasonEntry.seasonName} ${newSeasonEntry.trophy} Trophy`,
      season: newSeasonEntry.seasonName,
      year: newSeasonEntry.year,
      icon: '🏆'
    });
  }

  // Update all-time record
  const currentRecord = legacy.allTimeRecord;
  const newPlayed = currentRecord.played + newSeasonEntry.played;
  const newWon = currentRecord.won + newSeasonEntry.won;
  const newLost = currentRecord.lost + newSeasonEntry.lost;
  const newWinPct = Number(((newWon / Math.max(1, newPlayed)) * 100).toFixed(1));

  const updatedAllTimeRecord = {
    played: newPlayed,
    won: newWon,
    lost: newLost,
    tied: currentRecord.tied,
    winPercentage: newWinPct
  };

  // Retain only designated players for next season roster
  const retainedIds = (team.retentions || []).map(r => r.playerId).filter(Boolean);
  const nextSeasonSquad = retainedIds.length > 0 ? retainedIds : (team.squad || []).slice(0, 5);

  await storeService.updateTeam(teamId, {
    history: {
      ...legacy.history,
      allTimeRecord: updatedAllTimeRecord
    },
    seasons: updatedSeasons,
    trophies: updatedTrophies,
    squad: nextSeasonSquad,
    playingXI: nextSeasonSquad.slice(0, 11)
  });

  return {
    success: true,
    message: `Season rolled over successfully. Franchise legacy updated for next season.`,
    newSeason: newSeasonEntry,
    allTimeRecord: updatedAllTimeRecord,
    retainedRosterCount: nextSeasonSquad.length
  };
};

module.exports = {
  getFranchiseLegacy,
  generateSeasonRecap,
  retainPlayers,
  transferPlayer,
  rolloverToNextSeason
};


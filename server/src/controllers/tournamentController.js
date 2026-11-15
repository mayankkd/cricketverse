const storeService = require('../services/storeService');
const {
  GAME_MODES,
  HISTORICAL_CHALLENGES_CATALOG,
  MARQUEE_RIVALRIES_CATALOG,
  SCENARIO_CHALLENGES_CATALOG,
  generateTournamentFixtures,
  calculatePointsTable,
  calculateTournamentAwards
} = require('../services/tournamentService');

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
const getTournaments = async (req, res, next) => {
  try {
    const tournaments = await storeService.getTournaments();
    res.status(200).json({
      success: true,
      tournaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all 10 tournament and career game modes
// @route   GET /api/tournaments/modes
// @access  Public
const getGameModes = (req, res) => {
  res.status(200).json({
    success: true,
    modes: Object.values(GAME_MODES)
  });
};

// @desc    Get Historical Challenges catalog
// @route   GET /api/tournaments/historical-challenges
// @access  Public
const getHistoricalChallenges = (req, res) => {
  res.status(200).json({
    success: true,
    challenges: HISTORICAL_CHALLENGES_CATALOG
  });
};

// @desc    Get Marquee Rivalries catalog
// @route   GET /api/tournaments/rivalries
// @access  Public
const getRivalries = (req, res) => {
  res.status(200).json({
    success: true,
    rivalries: MARQUEE_RIVALRIES_CATALOG
  });
};

// @desc    Get Scenario Challenges catalog
// @route   GET /api/tournaments/scenarios
// @access  Public
const getScenarios = (req, res) => {
  res.status(200).json({
    success: true,
    scenarios: SCENARIO_CHALLENGES_CATALOG
  });
};

// @desc    Get single tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
const getTournamentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await storeService.getTournamentById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found.'
      });
    }
    res.status(200).json({
      success: true,
      tournament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tournament caps and individual awards
// @route   GET /api/tournaments/:id/awards
// @access  Public
const getTournamentAwards = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await storeService.getTournamentById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }
    const awards = calculateTournamentAwards(tournament.deliveries || [], tournament.teams || [], tournament.standings || []);
    res.status(200).json({
      success: true,
      awards: tournament.awards || awards
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a Custom Tournament (2–6 teams with byes for odd team counts)
// @route   POST /api/tournaments/custom
// @access  Public / Private
const createCustomTournament = async (req, res, next) => {
  try {
    const {
      name = 'Custom Championship 2026',
      edition = 'Season 2026',
      gameMode = 'Custom Tournaments',
      format = 'Round Robin + Playoffs',
      teams = [],
      prizePool = 500000000,
      venue = 'Eden Gardens',
      rules = {}
    } = req.body;

    if (!teams || teams.length < 2) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TEAM_COUNT',
        message: 'Tournament requires at least 2 teams.'
      });
    }
    if (teams.length > 6) {
      return res.status(400).json({
        success: false,
        code: 'TEAM_LIMIT_EXCEEDED',
        message: 'Tournament supports a maximum of 6 teams.'
      });
    }

    const { fixtures, playoffs, hasByes } = generateTournamentFixtures(teams, format, venue);
    const standings = calculatePointsTable(teams, []);
    const awards = calculateTournamentAwards([], teams, standings);

    const tournamentId = `tour_custom_${Date.now()}`;
    const newTournament = {
      tournamentId,
      name,
      edition,
      gameMode,
      format,
      maxTeams: teams.length,
      prizePool,
      teams,
      standings,
      fixtures,
      playoffs,
      awards,
      rules: {
        oversPerMatch: rules.oversPerMatch || 20,
        enableByes: hasByes,
        hasPlayoffs: true,
        hasSuperOver: true,
        ...rules
      }
    };

    const saved = await storeService.createTournament(newTournament);

    res.status(201).json({
      success: true,
      message: 'Custom tournament created successfully.',
      tournament: saved,
      hasByes
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Simulate/resolve a tournament match and update Points Table & NRR
// @route   POST /api/tournaments/:id/matches/:fixtureId/simulate
// @access  Public / Private
const simulateTournamentFixture = async (req, res, next) => {
  try {
    const { id, fixtureId } = req.params;
    const tournament = await storeService.getTournamentById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const fixture = (tournament.fixtures || []).find(f => f.id === fixtureId || String(f.matchNo) === fixtureId);
    if (!fixture) {
      return res.status(404).json({ success: false, message: 'Fixture not found in tournament schedule.' });
    }

    if (fixture.isBye) {
      return res.status(200).json({
        success: true,
        message: `${fixture.team1} has a scheduled bye for this round. No match played.`,
        fixture
      });
    }

    // Seeded outcome simulation
    const team1Runs = Math.floor(150 + Math.random() * 60);
    const team2Runs = Math.floor(140 + Math.random() * 65);
    const winner = team1Runs > team2Runs ? fixture.team1 : fixture.team2;
    const margin = Math.abs(team1Runs - team2Runs);

    fixture.status = 'completed';
    fixture.result = `${winner} won by ${margin} run${margin > 1 ? 's' : ''}`;
    fixture.team1Score = `${team1Runs}/5 (20.0)`;
    fixture.team2Score = `${team2Runs}/7 (20.0)`;

    // Recalculate Points Table with official ICC NRR
    const completedMatches = (tournament.fixtures || []).filter(f => f.status === 'completed' && !f.isBye).map(f => ({
      team1: f.team1,
      team2: f.team2,
      team1Runs: team1Runs,
      team1Overs: 20,
      team2Runs: team2Runs,
      team2Overs: 20,
      winner,
      completed: true
    }));

    const updatedStandings = calculatePointsTable(tournament.teams || tournament.standings.map(s => s.teamName), completedMatches);
    tournament.standings = updatedStandings;

    // Update Playoff seeds if group stage completed
    if (updatedStandings.length >= 4 && tournament.playoffs) {
      tournament.playoffs.qualifier1.team1 = updatedStandings[0].teamName;
      tournament.playoffs.qualifier1.team2 = updatedStandings[1].teamName;
      tournament.playoffs.eliminator.team1 = updatedStandings[2].teamName;
      tournament.playoffs.eliminator.team2 = updatedStandings[3].teamName;
    }

    await storeService.updateTournament(tournament.tournamentId, {
      fixtures: tournament.fixtures,
      standings: tournament.standings,
      playoffs: tournament.playoffs
    });

    res.status(200).json({
      success: true,
      message: 'Tournament match simulated successfully.',
      fixture,
      standings: tournament.standings,
      playoffs: tournament.playoffs
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTournaments,
  getTournamentById,
  getGameModes,
  getHistoricalChallenges,
  getRivalries,
  getScenarios,
  getTournamentAwards,
  createCustomTournament,
  simulateTournamentFixture
};

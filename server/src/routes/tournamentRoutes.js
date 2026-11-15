const express = require('express');
const router = express.Router();
const {
  getTournaments,
  getTournamentById,
  getGameModes,
  getHistoricalChallenges,
  getRivalries,
  getScenarios,
  getTournamentAwards,
  createCustomTournament,
  simulateTournamentFixture
} = require('../controllers/tournamentController');

router.get('/', getTournaments);
router.get('/modes', getGameModes);
router.get('/historical-challenges', getHistoricalChallenges);
router.get('/rivalries', getRivalries);
router.get('/scenarios', getScenarios);
router.post('/custom', createCustomTournament);
router.get('/:id', getTournamentById);
router.get('/:id/awards', getTournamentAwards);
router.post('/:id/matches/:fixtureId/simulate', simulateTournamentFixture);

module.exports = router;

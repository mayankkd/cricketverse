const express = require('express');
const router = express.Router();
const { getMatches, getMatchById, simulateBall } = require('../controllers/matchController');

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/:id/simulate-ball', simulateBall);

module.exports = router;


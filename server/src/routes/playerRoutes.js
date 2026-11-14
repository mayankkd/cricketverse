const express = require('express');
const router = express.Router();
const {
  getPlayers,
  getPlayerById,
  comparePlayers,
  getFilterMetadata
} = require('../controllers/playerController');

router.get('/', getPlayers);
router.get('/meta/filters', getFilterMetadata);
router.get('/compare/:id1/:id2', comparePlayers);
router.get('/:id', getPlayerById);

module.exports = router;

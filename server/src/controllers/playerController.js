const storeService = require('../services/storeService');

// @desc    Get all players with filtering & sorting
// @route   GET /api/players
// @access  Public
const getPlayers = async (req, res, next) => {
  try {
    const { role, cardTier, search } = req.query;
    const players = await storeService.getAllPlayers({ role, cardTier, search });
    res.status(200).json({
      success: true,
      count: players.length,
      players
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single player by ID
// @route   GET /api/players/:id
// @access  Public
const getPlayerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await storeService.getPlayerById(id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player card not found.'
      });
    }
    res.status(200).json({
      success: true,
      player
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlayers,
  getPlayerById
};

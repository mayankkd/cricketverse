const storeService = require('../services/storeService');

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

module.exports = {
  getTournaments,
  getTournamentById
};

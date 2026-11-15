const storeService = require('../services/storeService');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
const getMatches = async (req, res, next) => {
  try {
    const matches = await storeService.getMatches();
    res.status(200).json({
      success: true,
      matches
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Public
const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = await storeService.getMatchById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found.'
      });
    }
    res.status(200).json({
      success: true,
      match
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get match tactical state
// @route   GET /api/matches/:id/tactics
// @access  Public / Private
const getMatchTactics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const matchTactics = await storeService.getMatchTactics(id);
    res.status(200).json({
      success: true,
      ...matchTactics
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Update match tactics during tactical break or mid-innings
// @route   PUT /api/matches/:id/tactics
// @access  Private (Authorized participants & host only)
const updateMatchTactics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamKey, tactics, tacticalBreak } = req.body;
    const updated = await storeService.updateMatchTactics(id, req.user ? req.user._id : 'demo_user', {
      teamKey,
      tactics,
      tacticalBreak
    });
    res.status(200).json({
      success: true,
      message: 'Match tactics and tactical break updated successfully.',
      match: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'TACTICS_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Simulate next ball in match center using tactical physics engine
// @route   POST /api/matches/:id/simulate-ball
// @access  Public
const simulateBall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await storeService.simulateTacticalBall(id);

    res.status(200).json({
      success: true,
      outcome: result.outcome,
      match: result.match
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Play authoritative delivery with manual/hybrid/tactical controls
// @route   POST /api/matches/:id/play-delivery
// @access  Public / Private
const playDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryInput = req.body || {};
    const result = await storeService.playAuthoritativeDelivery(id, deliveryInput);

    res.status(200).json({
      success: true,
      outcome: result.outcome,
      match: result.match,
      deliveryData: result.deliveryData
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  getMatchTactics,
  updateMatchTactics,
  simulateBall,
  playDelivery
};


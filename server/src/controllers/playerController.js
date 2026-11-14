const storeService = require('../services/storeService');

// @desc    Get all players with filtering, format eligibility & sorting
// @route   GET /api/players
// @access  Public
const getPlayers = async (req, res, next) => {
  try {
    const { role, cardTier, cardVariant, country, format, search, sortBy } = req.query;
    const players = await storeService.getAllPlayers({
      role,
      cardTier,
      cardVariant,
      country,
      format,
      search,
      sortBy
    });

    res.status(200).json({
      success: true,
      count: players.length,
      players
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single player by ID or slug
// @route   GET /api/players/:id
// @access  Public
const getPlayerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await storeService.getPlayerById(id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: `Player card '${id}' not found.`
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

// @desc    Compare two players across 14 attributes & format OVRs
// @route   GET /api/players/compare/:id1/:id2
// @access  Public
const comparePlayers = async (req, res, next) => {
  try {
    const { id1, id2 } = req.params;
    const { player1, player2 } = await storeService.comparePlayers(id1, id2);

    if (!player1 || !player2) {
      return res.status(404).json({
        success: false,
        message: 'One or both player cards could not be found for comparison.'
      });
    }

    // Compute direct attribute differences
    const attributeKeys = [
      'batting',
      'bowling',
      'fielding',
      'fitness',
      'temperament',
      'consistency',
      'captaincy',
      'powerHitting',
      'strikeRotation',
      'pace',
      'swing',
      'spin',
      'deathBowling',
      'defensiveTechnique'
    ];

    const comparison = attributeKeys.map(attr => {
      const val1 = player1.attributes?.[attr] || 0;
      const val2 = player2.attributes?.[attr] || 0;
      return {
        attribute: attr,
        player1Val: val1,
        player2Val: val2,
        difference: val1 - val2,
        winner: val1 > val2 ? player1.name : val2 > val1 ? player2.name : 'Tied'
      };
    });

    res.status(200).json({
      success: true,
      player1,
      player2,
      comparison,
      ovrComparison: {
        test: {
          p1: player1.ovr?.test || null,
          p2: player2.ovr?.test || null
        },
        odi: {
          p1: player1.ovr?.odi || null,
          p2: player2.ovr?.odi || null
        },
        t20: {
          p1: player1.ovr?.t20 || null,
          p2: player2.ovr?.t20 || null
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get filter metadata (available countries, formats, variants, roles)
// @route   GET /api/players/meta/filters
// @access  Public
const getFilterMetadata = async (req, res, next) => {
  try {
    const metadata = await storeService.getPlayerFilterMetadata();
    res.status(200).json({
      success: true,
      metadata
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlayers,
  getPlayerById,
  comparePlayers,
  getFilterMetadata
};

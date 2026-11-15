const storeService = require('../services/storeService');

// @desc    Get user's active franchise team (supports ?room=CRIC-XXXX)
// @route   GET /api/teams/my
// @access  Private
const getMyTeam = async (req, res, next) => {
  try {
    const { room } = req.query;
    const team = await storeService.getOrCreateUserFranchise(req.user._id, room);
    res.status(200).json({
      success: true,
      team
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Get all franchise teams in a room (accessible to players and spectators)
// @route   GET /api/teams/room/:roomCode
// @access  Private / Public
const getTeamsByRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const teams = await storeService.getFranchiseTeamsByRoom(roomCode);
    res.status(200).json({
      success: true,
      roomCode: roomCode.toUpperCase(),
      count: teams.length,
      teams
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Get specific team by ID
// @route   GET /api/teams/:id
// @access  Public / Private
const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await storeService.getTeamById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Franchise team not found.' });
    }
    const populated = await storeService.populateTeamSquad(team, team.format || 'T20');
    res.status(200).json({
      success: true,
      team: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update team selection, lineup, captaincy, logo, name
// @route   PUT /api/teams/:id
// @access  Private (Owner or Host only, Spectators read-only)
const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await storeService.updateTeamSelection(id, req.user._id, updateData);

    res.status(200).json({
      success: true,
      message: 'Franchise lineup and tactics updated successfully.',
      team: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'TEAM_UPDATE_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Swap player between Playing XI and Bench, or reorder batting order
// @route   POST /api/teams/:id/swap
// @access  Private (Owner or Host only)
const swapPlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { playerInId, playerOutId, newBattingOrder, newBowlingOrder } = req.body;

    const updated = await storeService.swapTeamPlayers(id, req.user._id, {
      playerInId,
      playerOutId,
      newBattingOrder,
      newBowlingOrder
    });

    res.status(200).json({
      success: true,
      message: 'Player swapped successfully.',
      team: updated
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'SWAP_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Configure room squad limits (Host only)
// @route   PUT /api/teams/room/:roomCode/squad-limits
// @access  Private (Host only)
const configureSquadLimits = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const squadLimits = req.body;

    const room = await storeService.updateRoomSquadLimits(roomCode, req.user._id, squadLimits);

    res.status(200).json({
      success: true,
      message: 'Squad limits configured successfully.',
      squadLimits: room.squadLimits,
      room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'LIMITS_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

module.exports = {
  getMyTeam,
  getTeamsByRoom,
  getTeamById,
  updateTeam,
  swapPlayer,
  configureSquadLimits
};

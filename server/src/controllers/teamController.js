const storeService = require('../services/storeService');

// @desc    Get user's active team
// @route   GET /api/teams/my
// @access  Private
const getMyTeam = async (req, res, next) => {
  try {
    const teams = await storeService.getTeams(req.user._id);
    let myTeam = teams[0];
    
    // If user has no team yet, auto-provision one
    if (!myTeam) {
      const allPlayers = await storeService.getAllPlayers();
      const defaultSquad = allPlayers.slice(0, 11).map(p => p._id);
      
      const newTeam = {
        _id: `tm_${Date.now()}`,
        name: `${req.user.username}'s Super XI`,
        shortCode: req.user.username.substring(0, 3).toUpperCase(),
        ownerId: req.user._id,
        ownerUsername: req.user.username,
        primaryColor: '#F59E0B',
        secondaryColor: '#1E293B',
        squad: defaultSquad,
        playingXI: defaultSquad,
        captainId: defaultSquad[0] || null,
        viceCaptainId: defaultSquad[1] || null,
        chemistryScore: 88,
        overallRating: 91
      };
      
      // Save in store
      myTeam = newTeam;
      // Also update in memory store
      const allTeams = await storeService.getTeams();
      allTeams.push(newTeam);
    }

    res.status(200).json({
      success: true,
      team: myTeam
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update team playing XI / captaincy
// @route   PUT /api/teams/my
// @access  Private
const updateMyTeam = async (req, res, next) => {
  try {
    const { name, playingXI, captainId, viceCaptainId, chemistryScore } = req.body;
    const teams = await storeService.getTeams(req.user._id);
    const myTeam = teams[0];

    if (!myTeam) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const updated = await storeService.updateTeam(myTeam._id, {
      ...(name && { name }),
      ...(playingXI && { playingXI }),
      ...(captainId && { captainId }),
      ...(viceCaptainId && { viceCaptainId }),
      ...(chemistryScore && { chemistryScore })
    });

    res.status(200).json({
      success: true,
      message: 'Lineup updated successfully.',
      team: updated
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTeam,
  updateMyTeam
};


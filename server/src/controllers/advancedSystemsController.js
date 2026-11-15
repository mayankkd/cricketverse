const storeService = require('../services/storeService');
const {
  trainPlayer,
  performPlayerRecovery,
  calculatePartnershipChemistry,
  calculateTeamChemistry,
  generateScoutingReport,
  evaluateAuctionAwards,
  generateMatchDocumentary,
  SPECIAL_ABILITIES,
  HISTORICAL_PARTNERSHIPS
} = require('../services/advancedGameSystemService');

// @desc    Train Player in one of 6 drills (Batting, Bowling, Fielding, Fitness, Mental Strength, Captaincy)
// @route   POST /api/advanced/players/:id/train
// @access  Public / Private
const trainPlayerController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { drillType = 'Batting' } = req.body;

    const player = await storeService.getPlayerById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: `Player '${id}' not found.` });
    }

    const playerObj = typeof player.toObject === 'function' ? player.toObject() : { ...player };
    const result = trainPlayer(playerObj, drillType);

    // Persist updated player development & attributes
    await storeService.updatePlayer(id, {
      development: result.player.development,
      attributes: result.player.attributes
    });

    res.status(200).json({
      success: true,
      message: `Training completed: +${result.xpAwarded} XP in ${drillType}. Boosted ${result.statBoosted}!`,
      drillType: result.drillType,
      statBoosted: result.statBoosted,
      boostAmount: result.boostAmount,
      xpAwarded: result.xpAwarded,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      player: result.player
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Perform Player Recovery & Physio (physio, ice_bath, rest_cycle, rehab)
// @route   POST /api/advanced/players/:id/recover
// @access  Public / Private
const recoverPlayerController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { method = 'physio' } = req.body;

    const player = await storeService.getPlayerById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: `Player '${id}' not found.` });
    }

    const playerObj = typeof player.toObject === 'function' ? player.toObject() : { ...player };
    const result = performPlayerRecovery(playerObj, method);

    await storeService.updatePlayer(id, {
      development: result.development
    });

    res.status(200).json({
      success: true,
      method: result.method,
      message: result.message,
      development: result.development
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Player Development Status & Special Abilities
// @route   GET /api/advanced/players/:id/development
// @access  Public
const getPlayerDevelopment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await storeService.getPlayerById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: `Player '${id}' not found.` });
    }

    const dev = player.development || {
      form: 85, confidence: 80, fitness: 92, fatigue: 10,
      injury: { status: 'healthy', matchesOut: 0, recoveryProgress: 100, injuryRisk: 8 },
      training: { battingXP: 100, bowlingXP: 50, fieldingXP: 100, fitnessXP: 100, mentalXP: 100, captaincyXP: 100, level: 3 },
      availability: 'available'
    };

    res.status(200).json({
      success: true,
      playerId: player._id || player.playerId,
      name: player.name,
      development: dev,
      specialAbilities: player.specialAbilities || ['Big Match Player'],
      chemistryTags: player.chemistryTags || [player.country || 'India']
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Team Chemistry Synergy & Historical Partnerships Matrix
// @route   GET /api/advanced/teams/:id/chemistry
// @access  Public
const getTeamChemistry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await storeService.getTeamById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: `Franchise '${id}' not found.` });
    }

    const populatedTeam = await storeService.populateTeamSquad(team);
    const chemistryData = calculateTeamChemistry(populatedTeam?.populatedSquad || []);

    res.status(200).json({
      success: true,
      teamId: id,
      teamName: team.name,
      ...chemistryData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate In-Depth Scouting Report on Opponent Franchise
// @route   GET /api/advanced/teams/:id/scouting/:opponentId
// @access  Public
const getOpponentScouting = async (req, res, next) => {
  try {
    const { id, opponentId } = req.params;
    const opponent = await storeService.getTeamById(opponentId);
    if (!opponent) {
      return res.status(404).json({ success: false, message: `Opponent franchise '${opponentId}' not found.` });
    }

    const populatedOpponent = await storeService.populateTeamSquad(opponent);
    const opponentObj = typeof opponent.toObject === 'function' ? opponent.toObject() : opponent;
    const scoutingReport = generateScoutingReport({
      ...opponentObj,
      populatedSquad: populatedOpponent?.populatedSquad || []
    });

    res.status(200).json({
      success: true,
      scoutingReport
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate 5-Act Cinematic Match Documentary
// @route   GET /api/advanced/matches/:id/documentary
// @access  Public
const getMatchDocumentary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = await storeService.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: `Match '${id}' not found.` });
    }

    const documentary = generateMatchDocumentary(match);
    res.status(200).json({
      success: true,
      documentary
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger UltraEdge Snickometer / DRS Review Simulation
// @route   GET /api/advanced/matches/:id/drs-review
// @access  Public
const getDrsReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSpike = Math.random() < 0.65;
    const drsReview = {
      matchId: id,
      reviewId: `drs_${Date.now()}`,
      appealType: 'Caught Behind / LBW Appeal',
      ultraEdgeSpike: isSpike,
      snickometerDecibels: isSpike ? 94.2 : 12.1,
      waveformSamples: Array.from({ length: 32 }, (_, i) =>
        isSpike && (i >= 14 && i <= 18) ? Math.floor(60 + Math.random() * 38) : Math.floor(5 + Math.random() * 10)
      ),
      ballTracking: {
        pitching: 'In Line',
        impact: 'In Line',
        wickets: isSpike ? 'Hitting Middle & Leg' : 'Missing Leg Stump',
        projectedPathAngle: '12.4 degrees'
      },
      originalDecision: 'Not Out',
      finalDecision: isSpike ? 'OUT' : 'NOT OUT',
      umpireRecommendation: isSpike
        ? 'Clear noise on UltraEdge. Rock and roll please. Pitching in line, impact in line, wickets hitting. I recommend changing your on-field decision to OUT.'
        : 'Flat line through the bat contact zone. No deviation. Decision remains NOT OUT.'
    };

    res.status(200).json({
      success: true,
      drsReview
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Evaluate Analytical Post-Auction Awards (Best Value, Steal, Marquee, Master Tactician)
// @route   GET /api/advanced/auction/:roomCode/awards
// @access  Public
const getAuctionAwards = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    let room = null;
    let teams = [];
    try {
      room = await storeService.getRoomByCode(roomCode);
      if (room) {
        teams = await storeService.getFranchiseTeamsByRoom(roomCode);
      }
    } catch {}

    const auctionState = room?.auctionState || {};
    const awards = evaluateAuctionAwards(auctionState.auctionHistory || [], teams || []);
    res.status(200).json({
      success: true,
      roomCode,
      awards
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate WebRTC Voice Chat Room Token & Signaling Status
// @route   POST /api/advanced/matches/:id/voice/token
// @access  Public
const getVoiceChatToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId = 'guest_user', username = 'Cricket Fan' } = req.body;

    res.status(200).json({
      success: true,
      channel: `voice_room_${id}`,
      token: `rtc_token_${Date.now()}_${id}`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ],
      user: {
        userId,
        username,
        muted: false,
        deafened: false,
        speaking: false
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  trainPlayerController,
  recoverPlayerController,
  getPlayerDevelopment,
  getTeamChemistry,
  getOpponentScouting,
  getMatchDocumentary,
  getDrsReview,
  getAuctionAwards,
  getVoiceChatToken
};

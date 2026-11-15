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

const matchEngineService = require('../services/matchEngineService');

// @desc    Join a multiplayer match as Player or Spectator
// @route   POST /api/matches/:id/join
// @access  Public / Private
const joinMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role = 'player', teamKey = 'teamA' } = req.body || {};
    const userId = req.user?._id || req.body.userId || `usr_${Date.now()}`;
    const username = req.user?.username || req.body.username || (role === 'player' ? 'Player' : 'Spectator');

    const result = await matchEngineService.joinMatch(id, {
      userId,
      username,
      role,
      teamKey
    });

    res.status(200).json({
      success: true,
      participantRole: result.participantRole,
      snapshot: result.snapshot,
      event: result.event
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Get Authoritative Match Snapshot
// @route   GET /api/matches/:id/snapshot
// @access  Public
const getMatchSnapshot = async (req, res, next) => {
  try {
    const { id } = req.params;
    await matchEngineService.getOrCreateMatchEngine(id);
    const snapshot = matchEngineService.getMatchSnapshot(id);

    if (!snapshot) {
      return res.status(404).json({ success: false, code: 'MATCH_NOT_FOUND', message: 'Match snapshot not found.' });
    }

    res.status(200).json({
      success: true,
      snapshot
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Sync Match Events or Reconnection Recovery
// @route   GET /api/matches/:id/sync
// @access  Public
const syncMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fromSeq = Number(req.query.fromSeq || 0);
    const userId = req.user?._id || req.query.userId;

    const result = await matchEngineService.syncMatch(id, { fromSeq, userId });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Submit Bowling Decision
// @route   POST /api/matches/:id/bowling-decision
// @access  Public / Private
const submitBowlingDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || 'bowler_usr';
    const result = await matchEngineService.submitBowlingDecision(id, userId, req.body || {});

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Submit Batting Decision
// @route   POST /api/matches/:id/batting-decision
// @access  Public / Private
const submitBattingDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || 'striker_usr';
    const result = await matchEngineService.submitBattingDecision(id, userId, req.body || {});

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Declare Innings in Test Match
// @route   POST /api/matches/:id/declare
// @access  Public / Private
const declareInnings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || 'captain_usr';
    const result = await matchEngineService.declareInnings(id, userId);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Enforce Follow-On in Test Match
// @route   POST /api/matches/:id/follow-on
// @access  Public / Private
const enforceFollowOn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || 'captain_usr';
    const result = await matchEngineService.enforceFollowOn(id, userId);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Call Tactical Timeout in T20
// @route   POST /api/matches/:id/timeout
// @access  Public / Private
const callTacticalTimeout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId || 'tactician_usr';
    const result = await matchEngineService.callTacticalTimeout(id, userId);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Resume from Tactical Timeout
// @route   POST /api/matches/:id/timeout/resume
// @access  Public / Private
const resumeTacticalTimeout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await matchEngineService.resumeTacticalTimeout(id);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Apply DLS Revision for Limited Overs
// @route   POST /api/matches/:id/dls
// @access  Public / Private
const applyDLSRevision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await matchEngineService.applyDLSRevision(id, req.body || {});
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Set Stadium & Weather Conditions
// @route   POST /api/matches/:id/conditions
// @access  Public / Private
const setStadiumAndConditions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await matchEngineService.setStadiumAndConditions(id, req.body || {});
    res.status(200).json({
      success: true,
      ...result
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
  playDelivery,
  joinMatch,
  getMatchSnapshot,
  syncMatch,
  submitBowlingDecision,
  submitBattingDecision,
  declareInnings,
  enforceFollowOn,
  callTacticalTimeout,
  resumeTacticalTimeout,
  applyDLSRevision,
  setStadiumAndConditions
};


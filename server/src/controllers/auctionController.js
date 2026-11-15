const storeService = require('../services/storeService');

// @desc    Get live auction state for room
// @route   GET /api/auction/:roomCode/state
// @access  Public / Private
const getAuctionState = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const state = await storeService.getAuctionState(roomCode);
    res.status(200).json({
      success: true,
      auctionState: state
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Initialize / Start live auction (Host only)
// @route   POST /api/auction/:roomCode/init
// @access  Private (Host only)
const initAuction = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { bidIncrement, nominationMode } = req.body;
    const room = await storeService.initAuctionForRoom(roomCode, req.user._id, {
      bidIncrement,
      nominationMode
    });
    res.status(200).json({
      success: true,
      message: 'Live Auction arena initialized.',
      room,
      auctionState: room.auctionState
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
};

// @desc    Nominate player card for auction
// @route   POST /api/auction/:roomCode/nominate
// @access  Private (Active franchise managers only)
const nominatePlayer = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { cardId, playerId } = req.body;

    const room = await storeService.nominatePlayerForAuction(roomCode, req.user._id, {
      cardId,
      playerId
    });

    res.status(200).json({
      success: true,
      message: `Player nominated successfully. Starting price: 1 point.`,
      currentLot: room.auctionState?.currentLot,
      room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'NOMINATION_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Nominate random available player card
// @route   POST /api/auction/:roomCode/nominate-random
// @access  Private
const nominateRandom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await storeService.nominateRandomPlayer(roomCode, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Random player nominated successfully.',
      currentLot: room.auctionState?.currentLot,
      room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'NOMINATION_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Place bid on nominated lot
// @route   POST /api/auction/:roomCode/bid
// @access  Private (Active franchise managers only)
const placeBid = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { amount } = req.body;

    const room = await storeService.placeAuctionBid(roomCode, req.user._id, { amount });

    res.status(200).json({
      success: true,
      message: 'Bid placed successfully.',
      currentLot: room.auctionState?.currentLot,
      bidHistory: room.auctionState?.bidHistory,
      room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'BID_ERROR',
        message: err.message,
        minBid: err.minBid,
        budgetRemaining: err.budgetRemaining
      });
    }
    next(err);
  }
};

// @desc    Use T2 Veto on active nominated lot
// @route   POST /api/auction/:roomCode/veto
// @access  Private (Active franchise managers only)
const useT2Veto = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await storeService.useT2Veto(roomCode, req.user._id);

    const participant = (room.participants || []).find(p => p.userId === req.user._id);

    res.status(200).json({
      success: true,
      message: 'T2 Veto executed successfully! Cricketer eliminated from auction.',
      remainingTokens: participant?.t2VetoTokens,
      room,
      auctionState: room.auctionState
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'VETO_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Hammer sold / unsold resolution
// @route   POST /api/auction/:roomCode/hammer
// @access  Private (Host or system)
const hammerLot = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await storeService.hammerCurrentLot(roomCode, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Gavel hammer resolved.',
      currentLot: room.auctionState?.currentLot,
      soldLots: room.auctionState?.soldLots,
      unsoldLots: room.auctionState?.unsoldLots,
      room
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'HAMMER_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Start Unsold Round (Host only)
// @route   POST /api/auction/:roomCode/unsold-round
// @access  Private (Host only)
const startUnsoldRound = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const room = await storeService.startUnsoldRound(roomCode, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Unsold round started. Eligible unsold cricketers re-activated.',
      room,
      auctionState: room.auctionState
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'UNSOLD_ROUND_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

// @desc    Update auction settings (host only)
// @route   PUT /api/auction/:roomCode/settings
// @access  Private (Host only)
const updateSettings = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { bidIncrement, nominationMode } = req.body;
    const room = await storeService.updateAuctionSettings(roomCode, req.user._id, {
      bidIncrement,
      nominationMode
    });

    res.status(200).json({
      success: true,
      message: 'Auction settings updated.',
      auctionState: room.auctionState
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || 'SETTINGS_ERROR',
        message: err.message
      });
    }
    next(err);
  }
};

module.exports = {
  getAuctionState,
  initAuction,
  nominatePlayer,
  nominateRandom,
  placeBid,
  useT2Veto,
  hammerLot,
  startUnsoldRound,
  updateSettings
};

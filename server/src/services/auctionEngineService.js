/**
 * CRICKETVERSE AUTOMATIC RANDOM AUCTION ENGINE SERVICE
 * 
 * Authoritative Server-Side Auction State Machine & Timer Progression:
 * WAITING -> PLAYER_NOMINATED -> BIDDING -> SOLD / UNSOLD / VETOED -> NEXT_PLAYER -> AUCTION_COMPLETED
 * 
 * - Automates countdown timers with anti-sniping extensions.
 * - Resolves lots automatically on countdown expiration.
 * - Automatically advances to the next random cricketer from the persisted auction queue.
 * - Emits Socket.IO broadcasts for every state transition.
 */

let ioInstance = null;

// In-Memory Timers Cache (Keyed by upper-cased roomCode)
const auctionTimers = new Map();

/**
 * Bind Socket.IO server instance to auction engine
 */
const bindSocketIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

/**
 * Stop active timers for a room
 */
const stopAuctionTimer = (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  const entry = auctionTimers.get(code);
  if (entry) {
    if (entry.interval) clearInterval(entry.interval);
    if (entry.advanceTimeout) clearTimeout(entry.advanceTimeout);
    auctionTimers.delete(code);
  }
};

/**
 * Start 15s server-side countdown timer for the active lot in a room
 */
const startAuctionTimer = (roomCode, durationSeconds = 15) => {
  const code = (roomCode || '').toUpperCase();
  stopAuctionTimer(code);

  const expiresAt = Date.now() + durationSeconds * 1000;

  const interval = setInterval(async () => {
    const now = Date.now();
    const remaining = Math.max(0, Math.round((expiresAt - now) / 1000));

    if (ioInstance) {
      ioInstance.to(code).emit('auction_timer_tick', {
        roomCode: code,
        timerRemaining: remaining
      });
    }

    if (now >= expiresAt) {
      clearInterval(interval);
      auctionTimers.delete(code);
      await handleTimerExpired(code);
    }
  }, 1000);

  auctionTimers.set(code, {
    interval,
    expiresAt,
    advanceTimeout: null
  });
};

/**
 * Handle timer expiration: automatically hammer lot down (sold or unsold)
 */
const handleTimerExpired = async (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  try {
    const storeService = require('./storeService');
    const updatedRoom = await storeService.hammerCurrentLot(code, 'SYSTEM');

    if (ioInstance) {
      ioInstance.to(code).emit('lot_hammered', {
        lot: updatedRoom.auctionState?.currentLot,
        soldLots: updatedRoom.auctionState?.soldLots,
        unsoldLots: updatedRoom.auctionState?.unsoldLots
      });
      ioInstance.to(code).emit('auction_state', updatedRoom.auctionState);
      ioInstance.to(code).emit('room_state', updatedRoom);
    }

    // Automatically schedule advancement to next cricketer from queue after 3s celebration
    scheduleNextLot(code, 3000);
  } catch (err) {
    console.error(`[AuctionEngine] Error resolving expired timer for room ${code}:`, err.message);
  }
};

/**
 * Reset/extend timer on incoming valid bid (anti-sniping)
 */
const onBidPlaced = (roomCode, newDurationSeconds = 15) => {
  const code = (roomCode || '').toUpperCase();
  startAuctionTimer(code, newDurationSeconds);
};

/**
 * Handle T2 Veto activation: clear countdown and schedule next cricketer
 */
const onVetoPlayed = (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  stopAuctionTimer(code);
  scheduleNextLot(code, 3000);
};

/**
 * Handle manual or external hammer resolution
 */
const onLotHammered = (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  stopAuctionTimer(code);
  scheduleNextLot(code, 3000);
};

/**
 * Schedule automatic progression to the next random player in the queue
 */
const scheduleNextLot = (roomCode, delayMs = 3000) => {
  const code = (roomCode || '').toUpperCase();
  let entry = auctionTimers.get(code);

  if (entry?.advanceTimeout) {
    clearTimeout(entry.advanceTimeout);
  }

  const advanceTimeout = setTimeout(async () => {
    await advanceToNextPlayer(code);
  }, delayMs);

  if (entry) {
    entry.advanceTimeout = advanceTimeout;
  } else {
    auctionTimers.set(code, {
      interval: null,
      expiresAt: 0,
      advanceTimeout
    });
  }
};

/**
 * Advance to next player in queue
 */
const advanceToNextPlayer = async (roomCode) => {
  const code = (roomCode || '').toUpperCase();
  try {
    const storeService = require('./storeService');
    const result = await storeService.advanceToNextAuctionPlayer(code);

    if (!result) return;

    if (result.completed) {
      if (ioInstance) {
        ioInstance.to(code).emit('auction_completed', {
          roomCode: code,
          message: 'Mega Auction Completed! All franchise rosters finalized.',
          auctionState: result.room?.auctionState
        });
        ioInstance.to(code).emit('auction_state', result.room?.auctionState);
        ioInstance.to(code).emit('room_state', result.room);
      }
      stopAuctionTimer(code);
    } else {
      if (ioInstance) {
        ioInstance.to(code).emit('player_nominated', result.currentLot);
        ioInstance.to(code).emit('auction_state', result.room?.auctionState);
        ioInstance.to(code).emit('room_state', result.room);
      }
      // Start 15s timer for the newly presented cricketer
      startAuctionTimer(code, 15);
    }
  } catch (err) {
    console.error(`[AuctionEngine] Error advancing to next player in room ${code}:`, err.message);
  }
};

module.exports = {
  bindSocketIO,
  getIO,
  startAuctionTimer,
  stopAuctionTimer,
  onBidPlaced,
  onVetoPlayed,
  onLotHammered,
  scheduleNextLot,
  advanceToNextPlayer,
  handleTimerExpired
};


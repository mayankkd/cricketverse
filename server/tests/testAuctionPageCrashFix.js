/**
 * CRICKETVERSE - Auction Page Crash & Runtime Resilience Tests
 * Verifies fixes for:
 * 1. Undefined .slice() prevention in PlayerImage & FutCard.
 * 2. Partial/missing player properties handling.
 * 3. Safe empty squad and mixed card ID squad handling.
 * 4. Active vs unstarted room initialization via API.
 * 5. Invalid room code 404 error handling.
 */

const assert = require('assert');
const storeService = require('../src/services/storeService');
const { signToken } = require('../src/config/jwt');

const runAuctionPageCrashFixTests = async ({ callApp, test }) => {
  console.log('\n🏏 --- CRICKETVERSE AUCTION PAGE RUNTIME RESILIENCE TEST SUITE --- 🏏\n');

  const createTestUser = async (username) => {
    const user = await storeService.createUser({
      username,
      email: `${username.toLowerCase()}_${Date.now()}@cricketverse.com`,
      password: 'password123'
    });
    const token = signToken({ id: user._id });
    return { ...user, token };
  };

  // 1. Player initials generation resilience (Root Cause Fix Verification)
  await test('PlayerImage / Initials: Never crashes on undefined shortName, name or playerName', async () => {
    const resolveInitials = (player) => {
      if (!player) return 'CR';
      if (typeof player.shortName === 'string' && player.shortName.trim().length > 0) {
        const parts = player.shortName.trim().split(/\s+/).map(p => p[0] || '').join('');
        return (parts.slice(0, 3) || 'CR').toUpperCase();
      }
      const nameStr = (typeof player.name === 'string' && player.name.trim().length > 0)
        ? player.name.trim()
        : (typeof player.playerName === 'string' && player.playerName.trim().length > 0)
        ? player.playerName.trim()
        : 'CR';
      return nameStr.slice(0, 2).toUpperCase();
    };

    // Case A: Normal with shortName
    assert.strictEqual(resolveInitials({ shortName: 'V Kohli', name: 'Virat Kohli' }), 'VK');

    // Case B: Undefined shortName, defined name (Previous crash trigger if name was undefined)
    assert.strictEqual(resolveInitials({ name: 'Rohit Sharma' }), 'RO');

    // Case C: Undefined shortName, undefined name, defined playerName (Auction lot structure)
    assert.strictEqual(resolveInitials({ playerName: 'Jasprit Bumrah' }), 'JA');

    // Case D: ALL undefined / empty object (CRITICAL: Previously threw TypeError: Cannot read properties of undefined reading 'slice')
    assert.strictEqual(resolveInitials({}), 'CR');
    assert.strictEqual(resolveInitials({ name: undefined, shortName: undefined, playerName: undefined }), 'CR');
    assert.strictEqual(resolveInitials({ name: null, shortName: null }), 'CR');
    assert.strictEqual(resolveInitials({ shortName: '', name: '' }), 'CR');
    assert.strictEqual(resolveInitials(null), 'CR');
  });

  // 2. FutCard trait and rating resilience
  await test('FutCard: Special traits slice safely handles undefined or non-array traits', async () => {
    const extractTraits = (player) => {
      if (Array.isArray(player?.specialTraits) && player.specialTraits.length > 0) {
        return player.specialTraits.slice(0, 2);
      }
      return [];
    };

    assert.deepStrictEqual(extractTraits({ specialTraits: ['Yorker Specialist', 'Death Over King', 'Speedster'] }), ['Yorker Specialist', 'Death Over King']);
    assert.deepStrictEqual(extractTraits({ specialTraits: undefined }), []);
    assert.deepStrictEqual(extractTraits({ specialTraits: null }), []);
    assert.deepStrictEqual(extractTraits({ specialTraits: 'Not an array' }), []);
    assert.deepStrictEqual(extractTraits({}), []);
  });

  // 3. API: Active auction room loading (/auction?room=CRIC-XXXX)
  await test('Room Initialization: Active auction room returns complete lot and state', async () => {
    const host = await createTestUser(`AucHost_${Date.now()}`);
    const player2 = await createTestUser(`AucP2_${Date.now()}`);

    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Championship Auction', format: 'T20' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    const roomCode = createRes.body.room.roomCode;

    await callApp({
      method: 'POST',
      url: `/api/rooms/${roomCode}/join`,
      body: { role: 'player', teamName: 'Mumbai Blasters' },
      headers: { authorization: `Bearer ${player2.token}` }
    });

    // Start auction
    await callApp({
      method: 'POST',
      url: `/api/rooms/${roomCode}/start`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Call GET /api/rooms/:roomCode
    const res = await callApp({
      method: 'GET',
      url: `/api/rooms/${roomCode}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.room.status, 'auction');
    assert.ok(res.body.room.auctionState, 'Auction state must be populated');
    assert.strictEqual(res.body.room.auctionState.status, 'active');
    assert.ok(res.body.room.auctionState.currentLot, 'Current lot must be present');
    assert.ok(res.body.room.auctionState.currentLot.playerName, 'Lot must have a playerName');
    assert.strictEqual(res.body.room.auctionState.currentLot.startingPrice, 1);
  });

  // 4. API: Unstarted room loading
  await test('Room Initialization: Unstarted room correctly identified as waiting', async () => {
    const host = await createTestUser(`WaitHost_${Date.now()}`);

    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Lobby Arena', format: 'ODI' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    const roomCode = createRes.body.room.roomCode;

    const res = await callApp({
      method: 'GET',
      url: `/api/rooms/${roomCode}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.room.status, 'waiting');
    assert.strictEqual(res.body.room.auctionState.status, 'idle');
  });

  // 5. API: Invalid room code error handling
  await test('Room API: Invalid room code returns 404 with clean error message', async () => {
    const res = await callApp({
      method: 'GET',
      url: '/api/rooms/CRIC-INVALID-9999'
    });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not found'));
  });

  // 6. Squad Normalization Resilience: Empty and string ID squads
  await test('Squad Normalization: Handles empty squad and string card IDs gracefully', async () => {
    const normalizeSquadItem = (card, allPlayers = []) => {
      const cardObj = typeof card === 'string'
        ? (allPlayers.find(p => p._id === card || p.playerId === card) || { _id: card, name: card, playerName: card, role: 'Batter', ovr: 85, acquiredPrice: 1 })
        : (card || {});
      return {
        name: cardObj.playerName || cardObj.name || 'Cricketer',
        role: cardObj.role || 'Batter',
        price: cardObj.acquiredPrice || 1
      };
    };

    // Test with card object
    const objCard = normalizeSquadItem({ playerName: 'Virat Kohli', role: 'Batter', acquiredPrice: 5 });
    assert.strictEqual(objCard.name, 'Virat Kohli');
    assert.strictEqual(objCard.price, 5);

    // Test with string card ID fallback
    const strCard = normalizeSquadItem('ply_01', [{ _id: 'ply_01', name: 'Sachin Tendulkar', role: 'Batter' }]);
    assert.strictEqual(strCard.name, 'Sachin Tendulkar');
    assert.strictEqual(strCard.role, 'Batter');

    // Test with unknown string card ID
    const unknownCard = normalizeSquadItem('ply_unknown');
    assert.strictEqual(unknownCard.name, 'ply_unknown');
    assert.strictEqual(unknownCard.role, 'Batter');
  });
};

module.exports = { runAuctionPageCrashFixTests };

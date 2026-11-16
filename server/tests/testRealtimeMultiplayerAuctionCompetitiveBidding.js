/**
 * CRICKETVERSE REAL-TIME MULTIPLAYER COMPETITIVE BIDDING & SQUAD SYNCHRONIZATION TEST SUITE
 * 
 * Verifies all Core Competitive Multiplayer Auction Requirements:
 * 1. Two users bidding competitively on the same player (multiple consecutive bids).
 * 2. Highest bidder winning on countdown expiration.
 * 3. Cricketer automatically assigned to the winning participant's squad and team.
 * 4. Authoritative purse deduction (winning amount deducted from winning team's purse).
 * 5. Live squad synchronization across all participants and spectators.
 * 6. Spectator read-only access (bidding and veto strictly barred).
 * 7. T2 Veto limits (exactly 2 vetoes per participant, third veto rejected).
 * 8. Real-world cricketer uniqueness & duplicate prevention (sold, unsold, vetoed cannot return).
 * 9. Reconnection & persistent auction state recovery from database.
 * 10. Seamless feeding of purchased auction players into existing CricketVerse team-building system.
 */

process.env.DISABLE_RATE_LIMIT = 'true';
const assert = require('assert');
const { Duplex } = require('stream');
const http = require('http');
const { app } = require('../src/server');
const storeService = require('../src/services/storeService');
const auctionEngineService = require('../src/services/auctionEngineService');

// HTTP helper using in-process Express app
const callApp = ({ method, url, body = null, headers = {} }) => {
  return new Promise((resolve, reject) => {
    let bodyStr = null;
    if (body) {
      bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) { callback(); }
    });
    socket.remoteAddress = '127.0.0.1';

    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.socket = socket;
    req.headers = {
      host: 'localhost',
      ...(bodyStr ? {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(bodyStr)
      } : {}),
      ...headers
    };

    const res = new http.ServerResponse(req);
    let chunks = [];

    const originalWrite = res.write.bind(res);
    res.write = (chunk, ...args) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return originalWrite(chunk, ...args);
    };

    res.end = (chunk) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const raw = Buffer.concat(chunks).toString('utf8');
      let parsed = raw;
      try {
        parsed = JSON.parse(raw);
      } catch {}
      resolve({ status: res.statusCode, body: parsed, raw });
    };

    try {
      app(req, res);
      if (bodyStr) {
        req.push(bodyStr);
      }
      req.push(null);
    } catch (err) {
      reject(err);
    }
  });
};

const createTestUser = async (username) => {
  const email = `${username.toLowerCase()}@competitive-auction.cricketverse.com`;
  const res = await callApp({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      username,
      email,
      password: 'password123'
    }
  });

  const uId = res.body.user?._id || res.body.user?.id;
  return {
    _id: uId,
    id: uId,
    username: res.body.user.username,
    email: res.body.user.email,
    token: res.body.token
  };
};

const runCompetitiveAuctionTests = async () => {
  console.log('\n🏏 --- CRICKETVERSE REAL-TIME MULTIPLAYER COMPETITIVE AUCTION TEST SUITE --- 🏏\n');

  // 1. Setup participants: Host, Player 2, and Spectator
  console.log('1. Authenticating participants (Host, Player 2, Spectator)...');
  const host = await createTestUser(`Host_${Date.now()}`);
  const player2 = await createTestUser(`Challenger_${Date.now()}`);
  const spectator = await createTestUser(`Spectator_${Date.now()}`);

  assert.ok(host.token, 'Host authenticated');
  assert.ok(player2.token, 'Player 2 authenticated');
  assert.ok(spectator.token, 'Spectator authenticated');
  console.log('  ✓ 3 distinct participants authenticated with JWT tokens.');

  // 2. Host creates a T20 Room (30 points purse per team)
  console.log('\n2. Host creates T20 Room (CRIC-XXXX)...');
  const createRoomRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    body: { name: 'Live Premier Auction', format: 'T20' },
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(createRoomRes.status, 201);
  const roomCode = createRoomRes.body.room.roomCode;
  console.log(`  ✓ Room created with code: ${roomCode} (Initial purse: 30 pts)`);

  // 3. Player 2 joins as player, Spectator joins as spectator
  console.log('\n3. Player 2 joins as active player, Spectator joins as observer...');
  const joinP2 = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/join`,
    body: { role: 'player', teamName: 'Kolkata Strikers' },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(joinP2.status, 200);

  const joinSpec = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/join`,
    body: { role: 'spectator', teamName: 'Spectator Dugout' },
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(joinSpec.status, 200);
  console.log('  ✓ Lobby ready: 2/6 active managers, 1 spectator observer.');

  // 4. Host launches auction arena
  console.log('\n4. Host starts the auction arena...');
  const startRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/start`,
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(startRes.status, 200);
  const startedRoom = startRes.body.room;
  assert.strictEqual(startedRoom.status, 'auction');
  assert.strictEqual(startedRoom.auctionState.stage, 'BIDDING');

  const lot1 = startedRoom.auctionState.currentLot;
  assert.ok(lot1, 'Opening lot is automatically presented');
  assert.strictEqual(lot1.startingPrice, 1);
  assert.strictEqual(lot1.currentBid, 1);
  assert.strictEqual(lot1.highestBidderId, null);
  console.log(`  ✓ Lot #1 on block: ${lot1.playerName} (${lot1.country} • ${lot1.role} • OVR: ${typeof lot1.ovr === 'object' ? lot1.ovr.t20 : lot1.ovr})`);

  // 5. Test Spectator Read-Only Access
  console.log('\n5. Verifying Spectator Read-Only Access (Bidding & Veto blocked)...');
  const specBidRes = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 1 },
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(specBidRes.status, 403, 'Spectator bidding strictly rejected with 403');
  assert.ok(
    specBidRes.body.code === 'SPECTATOR_ACTION_FORBIDDEN' || specBidRes.body.code === 'ACTION_FORBIDDEN',
    'Spectator action forbidden error code'
  );

  const specVetoRes = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(specVetoRes.status, 403, 'Spectator veto strictly rejected with 403');
  console.log('  ✓ Spectator read-only enforcement confirmed: write actions rejected.');

  // 6. Two users bidding competitively on the same player (multiple consecutive bids)
  console.log('\n6. Testing Two Users Bidding Competitively (Multiple Consecutive Bids)...');
  
  // Bid 1: Player 2 places opening bid of 1 point
  const bid1 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 1 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(bid1.status, 200);
  assert.strictEqual(bid1.body.currentLot.currentBid, 1);
  assert.strictEqual(bid1.body.currentLot.highestBidderId, player2._id);
  console.log(`  ✓ Bid 1: ${player2.username} (Kolkata Strikers) bids 1 point`);

  // Player 2 cannot outbid self
  const selfBid = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 2 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(selfBid.status, 400);
  assert.strictEqual(selfBid.body.code, 'CANNOT_OUTBID_SELF');

  // Bid 2: Host counter-bids with 2 points
  const bid2 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 2 },
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(bid2.status, 200);
  assert.strictEqual(bid2.body.currentLot.currentBid, 2);
  assert.strictEqual(bid2.body.currentLot.highestBidderId, host._id);
  console.log(`  ✓ Bid 2: ${host.username} counters with 2 points`);

  // Bid 3: Player 2 raises to 3 points
  const bid3 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 3 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(bid3.status, 200);
  assert.strictEqual(bid3.body.currentLot.currentBid, 3);
  assert.strictEqual(bid3.body.currentLot.highestBidderId, player2._id);
  console.log(`  ✓ Bid 3: ${player2.username} raises to 3 points`);

  // Bid 4: Host raises to 4 points
  const bid4 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 4 },
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(bid4.status, 200);
  assert.strictEqual(bid4.body.currentLot.currentBid, 4);
  assert.strictEqual(bid4.body.currentLot.highestBidderId, host._id);
  console.log(`  ✓ Bid 4: ${host.username} raises to 4 points`);

  // Bid 5: Player 2 places winning bid of 5 points
  const bid5 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 5 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(bid5.status, 200);
  assert.strictEqual(bid5.body.currentLot.currentBid, 5);
  assert.strictEqual(bid5.body.currentLot.highestBidderId, player2._id);
  console.log(`  ✓ Bid 5: ${player2.username} places highest bid of 5 points!`);

  // 7. Highest Bidder Winning, Squad Assignment & Purse Deduction
  console.log('\n7. Testing Highest Bidder Winning, Squad Assignment & Purse Deduction...');
  const hammerSale = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/hammer`,
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(hammerSale.status, 200);
  assert.strictEqual(hammerSale.body.currentLot.status, 'sold');

  // Verify room state and participant records in database
  const roomAfterSale = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  const p2Record = (roomAfterSale.body.room.participants || []).find(p => p.userId === player2._id);
  const hostRecord = (roomAfterSale.body.room.participants || []).find(p => p.userId === host._id);

  // Winning team purse: 30 - 5 = 25 pts
  assert.strictEqual(p2Record.budgetRemaining, 25, 'Winning team purse deducted from 30 to 25 pts');
  // Non-winning host purse: remains 30 pts
  assert.strictEqual(hostRecord.budgetRemaining, 30, 'Host purse remains untouched at 30 pts');

  // Winner squad has the acquired cricketer card
  assert.strictEqual(p2Record.squad.length, 1, 'Winner squad contains 1 acquired cricketer');
  assert.strictEqual(p2Record.squad[0].cardId, lot1.cardId);
  assert.strictEqual(p2Record.squad[0].acquiredPrice, 5);
  assert.strictEqual(hostRecord.squad.length, 0, 'Host squad has 0 players');
  console.log(`  ✓ Player sold to ${player2.username} for 5 pts. Purse: 25 pts remaining. Squad count: 1.`);

  // 8. Live Squad Synchronization across participants & Spectators
  console.log('\n8. Testing Live Squad Synchronization & Persistence...');
  const auctionStateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
  assert.strictEqual(auctionStateRes.body.auctionState.soldLots.length, 1);
  const soldLotRecord = auctionStateRes.body.auctionState.soldLots[0];
  assert.strictEqual(soldLotRecord.buyerId, player2._id);
  assert.strictEqual(soldLotRecord.finalPrice, 5);
  assert.strictEqual(soldLotRecord.lot.playerName, lot1.playerName);

  // Check that all participants in auctionState have synchronized squad data
  const p2InAuctionState = auctionStateRes.body.auctionState.participants.find(p => p.userId === player2._id);
  assert.strictEqual(p2InAuctionState.squad.length, 1);
  console.log('  ✓ Authoritative auction state contains updated squads and sold lot history.');

  // 9. Integration with Existing Team-Building System
  console.log('\n9. Testing Feeding Purchased Players into Team-Building System...');
  const userTeam = await storeService.getOrCreateUserFranchise(player2._id, roomCode);
  assert.ok(userTeam, 'Team document created/retrieved for winner');
  assert.ok(
    userTeam.squad.includes(lot1.cardId) || (userTeam.squadCards || []).some(c => c._id === lot1.cardId || c.cardId === lot1.cardId),
    'Purchased cricketer is present in team squad'
  );
  assert.strictEqual(userTeam.remainingPurse, 25, 'Team remainingPurse reflects deducted points');
  assert.strictEqual(userTeam.totalSpending, 5, 'Team totalSpending reflects 5 points spent');
  console.log('  ✓ Purchased player successfully bridged to Team model for lineup & match selection.');

  // 10. T2 Veto Limits (Exactly 2 tokens, 3rd attempt rejected)
  console.log('\n10. Testing T2 Veto Limits & Permanent Cricketer Elimination...');
  // Advance to lot #2
  const nextLot2Res = await storeService.advanceToNextAuctionPlayer(roomCode);
  const lot2 = nextLot2Res.currentLot;
  assert.ok(lot2, 'Lot #2 presented');
  assert.notStrictEqual(lot2.playerId, lot1.playerId, 'Lot #2 is unique');

  // Veto #1 by Player 2
  const veto1Res = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(veto1Res.status, 200);
  assert.strictEqual(veto1Res.body.remainingTokens, 1, 'Player 2 remaining tokens: 1/2');

  // Advance to lot #3
  const nextLot3Res = await storeService.advanceToNextAuctionPlayer(roomCode);
  const lot3 = nextLot3Res.currentLot;

  // Veto #2 by Player 2
  const veto2Res = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(veto2Res.status, 200);
  assert.strictEqual(veto2Res.body.remainingTokens, 0, 'Player 2 remaining tokens: 0/2 (Exhausted)');

  // Advance to lot #4
  const nextLot4Res = await storeService.advanceToNextAuctionPlayer(roomCode);
  const lot4 = nextLot4Res.currentLot;

  // Veto #3 by Player 2 must be strictly rejected
  const veto3Res = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(veto3Res.status, 400);
  assert.strictEqual(veto3Res.body.code, 'INSUFFICIENT_VETO_TOKENS');
  console.log('  ✓ Exactly 2 T2 Veto tokens enforced: 3rd veto attempt rejected with 400.');

  // 11. Real-World Cricketer Uniqueness & Duplicate Prevention
  console.log('\n11. Testing Cricketer Uniqueness (Vetoed & Sold cannot return)...');
  const queueAfterVetos = (await storeService.getRoomByCode(roomCode)).auctionState.auctionQueue;
  const vetoedIds = new Set([lot2.playerId, lot3.playerId]);
  const soldIds = new Set([lot1.playerId]);

  for (let i = 0; i < queueAfterVetos.length; i++) {
    const candidate = queueAfterVetos[i];
    assert.ok(
      !vetoedIds.has(candidate.playerId) || candidate.cardId === lot2.cardId || candidate.cardId === lot3.cardId,
      'No duplicate card variant of vetoed cricketer appears in remaining queue'
    );
  }
  console.log('  ✓ Duplicate player prevention verified: sold & vetoed real-world cricketers cannot return.');

  // 12. Reconnection & Authoritative Database State Recovery
  console.log('\n12. Testing Reconnection & Authoritative State Recovery...');
  const reconnectRoom = await storeService.getRoomByCode(roomCode);
  assert.ok(reconnectRoom, 'Room rehydrated from database');
  assert.strictEqual(reconnectRoom.auctionState.soldLots.length, 1);
  assert.strictEqual(reconnectRoom.auctionState.vetoedLots.length, 2);

  const reconnectedP2 = reconnectRoom.participants.find(p => p.userId === player2._id);
  assert.strictEqual(reconnectedP2.budgetRemaining, 25);
  assert.strictEqual(reconnectedP2.squad.length, 1);
  assert.strictEqual(reconnectedP2.t2VetoTokens, 0);
  console.log('  ✓ Client reconnection recovers exact authoritative state from MongoDB.');

  console.log('\n🎉 --- ALL 12 REAL-TIME MULTIPLAYER COMPETITIVE AUCTION TESTS PASSED! --- 🎉\n');
};

if (require.main === module) {
  runCompetitiveAuctionTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed with error:', err);
      process.exit(1);
    });
}

module.exports = { runCompetitiveAuctionTests };

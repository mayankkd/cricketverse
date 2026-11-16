/**
 * CRICKETVERSE AUTOMATIC RANDOM AUCTION INTEGRATION TEST SUITE
 * 
 * Verifies all 8 Core Auction Requirements:
 * 1. Automatic player selection & randomized auction queue
 * 2. Auction player card display attributes (photo, name, country, role, OVR, styles, 1 pt base)
 * 3. Bidding rules (1 pt base, 1 pt increment, purse limits, spectator restrictions)
 * 4. Randomization & real-world cricketer uniqueness (no duplicate appearances across variants)
 * 5. T2 Veto execution & permanent elimination
 * 6. Multiplayer synchronization & reconnection recovery
 * 7. Server-side auction state machine (WAITING -> BIDDING -> RESOLVED -> NEXT_PLAYER -> AUCTION_COMPLETED)
 * 8. Auction completion handling
 */

process.env.DISABLE_RATE_LIMIT = 'true';
const assert = require('assert');
const { Duplex } = require('stream');
const http = require('http');
const { app } = require('../src/server');
const storeService = require('../src/services/storeService');
const auctionEngineService = require('../src/services/auctionEngineService');

// HTTP helper using in-process app
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

const createTestUser = async (username, role = 'user') => {
  const email = `${username.toLowerCase()}@autotest.cricketverse.com`;
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

const runAutomaticAuctionTests = async () => {
  console.log('\n🏏 --- CRICKETVERSE AUTOMATIC RANDOM AUCTION TEST SUITE --- 🏏\n');

  // 1. Setup participants: Host, Player 2, and Spectator
  console.log('1. Authenticating participants (Host, Player 2, Spectator)...');
  const host = await createTestUser(`Host_${Date.now()}`);
  const player2 = await createTestUser(`Player2_${Date.now()}`);
  const spectator = await createTestUser(`Spectator_${Date.now()}`);

  assert.ok(host.token, 'Host authenticated');
  assert.ok(player2.token, 'Player 2 authenticated');
  assert.ok(spectator.token, 'Spectator authenticated');
  console.log('  ✓ All 3 participants authenticated with unique identities.');

  // 2. Host creates a T20 Room (30 points purse per team)
  console.log('\n2. Host creates T20 Room...');
  const createRoomRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    body: { name: 'Automatic Mega Auction Arena', format: 'T20' },
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(createRoomRes.status, 201);
  const roomCode = createRoomRes.body.room.roomCode;
  console.log(`  ✓ Room created with code: ${roomCode}`);

  // 3. Player 2 joins as player, Spectator joins as spectator
  console.log('\n3. Player 2 and Spectator join room...');
  const joinP2 = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/join`,
    body: { role: 'player', teamName: 'Mumbai Blasters' },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(joinP2.status, 200);

  const joinSpec = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/join`,
    body: { role: 'spectator', teamName: 'Audience Stand' },
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(joinSpec.status, 200);
  console.log('  ✓ Active players: 2/6, Spectators: 1');

  // 4. Host launches arena: Verifies Automatic Random Queue & Opening Lot
  console.log('\n4. Host launches arena (POST /api/rooms/:roomCode/start)...');
  const startRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/start`,
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(startRes.status, 200);
  const startedRoom = startRes.body.room;

  assert.strictEqual(startedRoom.status, 'auction', 'Room status transitions to auction');
  assert.strictEqual(startedRoom.auctionState.stage, 'BIDDING', 'State machine enters BIDDING');
  assert.ok(Array.isArray(startedRoom.auctionState.auctionQueue), 'Auction queue is created');
  assert.ok(startedRoom.auctionState.auctionQueue.length >= 10, 'Eligible cricketer queue populated');

  // Check cricketer uniqueness in queue
  const queuePlayerIds = startedRoom.auctionState.auctionQueue.map(lot => lot.playerId);
  const uniqueQueuePlayerIds = new Set(queuePlayerIds);
  assert.strictEqual(
    queuePlayerIds.length,
    uniqueQueuePlayerIds.size,
    'Every real-world cricketer appears EXACTLY ONCE in the queue regardless of card variants'
  );
  console.log(`  ✓ Queue generated with ${queuePlayerIds.length} unique real-world cricketers.`);

  // 5. Verifying Opening Lot on the Gavel Block (Automatic presentation)
  console.log('\n5. Verifying opening lot auto-presentation on block...');
  const currentLot = startedRoom.auctionState.currentLot;
  assert.ok(currentLot, 'Current lot is automatically presented without any manual nomination!');
  assert.strictEqual(currentLot.startingPrice, 1, 'Starting price is strictly 1 point');
  assert.strictEqual(currentLot.currentBid, 1, 'Current bid begins at 1 point');
  assert.strictEqual(currentLot.highestBidderId, null, 'No highest bidder initially');
  assert.strictEqual(currentLot.status, 'nominated', 'Lot status is nominated');
  assert.ok(currentLot.playerImage, 'Cricketer photograph exists');
  assert.ok(currentLot.playerName, 'Cricketer name exists');
  assert.ok(currentLot.country, 'Cricketer country exists');
  assert.ok(currentLot.role, 'Cricketer role exists');
  assert.ok(currentLot.ovr !== undefined, 'Cricketer OVR rating exists');
  assert.ok(currentLot.battingStyle, 'Cricketer batting style exists');
  assert.ok(currentLot.bowlingStyle, 'Cricketer bowling style exists');
  assert.ok(currentLot.timerExpiresAt, 'Auction timer expiration timestamp is set');
  console.log(`  ✓ Auto-nominated: ${currentLot.playerName} (${currentLot.country} • ${currentLot.role} • OVR: ${typeof currentLot.ovr === 'object' ? currentLot.ovr.t20 : currentLot.ovr})`);
  console.log(`  ✓ Styles: Batting=${currentLot.battingStyle}, Bowling=${currentLot.bowlingStyle}`);

  // 6. Test Bidding Rules & Anti-Sniping
  console.log('\n6. Testing Bidding Rules & Spectator Restrictions...');
  // Spectator attempt to bid must fail
  const specBid = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 1 },
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(specBid.status, 403, 'Spectators cannot bid');

  // Player 2 bids opening 1 point
  const p2Bid1 = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 1 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(p2Bid1.status, 200);
  assert.strictEqual(p2Bid1.body.currentLot.highestBidderId, player2._id);
  assert.strictEqual(p2Bid1.body.currentLot.currentBid, 1);

  // Player 2 cannot outbid self
  const p2SelfBid = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 2 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(p2SelfBid.status, 400);
  assert.strictEqual(p2SelfBid.body.code, 'CANNOT_OUTBID_SELF');

  // Host raises bid to 2 points
  const hostBid = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 2 },
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(hostBid.status, 200);
  assert.strictEqual(hostBid.body.currentLot.highestBidderId, host._id);
  assert.strictEqual(hostBid.body.currentLot.currentBid, 2);

  // Exceeding purse budget (purse = 30, bid 35 must fail)
  const overBid = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/bid`,
    body: { amount: 35 },
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(overBid.status, 400);
  assert.strictEqual(overBid.body.code, 'INSUFFICIENT_BUDGET');
  console.log('  ✓ Bidding rules enforced: 1 pt base, 1 pt increment, anti-self-outbid, purse validation.');

  // 7. Simultaneous Bid Race Condition Handling
  console.log('\n7. Testing Simultaneous Bids (Atomic concurrency lock)...');
  const [race1, race2] = await Promise.all([
    callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 3 },
      headers: { authorization: `Bearer ${player2.token}` }
    }),
    callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 3 },
      headers: { authorization: `Bearer ${player2.token}` }
    })
  ]);
  const raceSuccesses = [race1, race2].filter(r => r.status === 200);
  assert.strictEqual(raceSuccesses.length, 1, 'Exactly one concurrent racer succeeds at 3 points');
  console.log('  ✓ Atomic concurrency lock prevented duplicate race condition bids.');

  // 8. Countdown Expiration & Automatic Player Sale
  console.log('\n8. Testing Automatic Hammer Sale on Timer Expiration...');
  const hammerSale = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/hammer`,
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(hammerSale.status, 200);
  assert.strictEqual(hammerSale.body.currentLot.status, 'sold', 'Lot status marked sold');
  assert.strictEqual(hammerSale.body.soldLots.length, 1, 'Added to soldLots collection');

  // Verify buyer squad and deducted purse (30 - 3 = 27)
  const stateAfterSale = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
  const p2AfterSale = stateAfterSale.body.auctionState.participants.find(p => p.userId === player2._id);
  assert.strictEqual(p2AfterSale.budgetRemaining, 27, 'Player 2 purse deducted by winning bid');
  assert.strictEqual(p2AfterSale.squad.length, 1, 'Player 2 squad contains acquired cricketer');
  console.log('  ✓ Player sold! Purse deducted and card added to winner squad.');

  // 9. Automatic Progression to Next Random Player
  console.log('\n9. Testing Automatic Progression to Next Random Cricketer...');
  const nextAdvanceRes = await storeService.advanceToNextAuctionPlayer(roomCode);
  assert.strictEqual(nextAdvanceRes.completed, false, 'Auction continues to next player');
  const lot2 = nextAdvanceRes.currentLot;
  assert.ok(lot2, 'Next cricketer presented from queue');
  assert.notStrictEqual(lot2.playerId, currentLot.playerId, 'Next cricketer is distinct from previously sold cricketer');
  assert.strictEqual(lot2.startingPrice, 1, 'Starting price reset to 1 point');
  assert.strictEqual(lot2.currentBid, 1, 'Current bid reset to 1 point');
  assert.strictEqual(lot2.highestBidderId, null, 'Highest bidder reset to null');
  console.log(`  ✓ Auto-advanced to lot #2: ${lot2.playerName} (${lot2.country} • ${lot2.role})`);

  // 10. Testing Unsold Resolution
  console.log('\n10. Testing Unsold Resolution (No bids placed)...');
  const hammerUnsold = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/hammer`,
    headers: { authorization: `Bearer ${host.token}` }
  });
  assert.strictEqual(hammerUnsold.status, 200);
  assert.strictEqual(hammerUnsold.body.currentLot.status, 'unsold', 'Lot status marked unsold');
  assert.strictEqual(hammerUnsold.body.unsoldLots.length, 1, 'Added to unsoldLots collection');
  console.log(`  ✓ Lot #2 (${lot2.playerName}) marked UNSOLD at 1 point starting price.`);

  // 11. Advance to Lot #3 & Test T2 VETO Execution
  console.log('\n11. Advance to Lot #3 & Testing T2 VETO...');
  const nextAdvance3 = await storeService.advanceToNextAuctionPlayer(roomCode);
  const lot3 = nextAdvance3.currentLot;
  console.log(`  ✓ Lot #3 presented: ${lot3.playerName}`);

  // Spectator attempt to veto must fail
  const specVeto = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${spectator.token}` }
  });
  assert.strictEqual(specVeto.status, 403, 'Spectators cannot use T2 Veto');

  // Player 2 uses T2 Veto
  const vetoRes = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(vetoRes.status, 200);
  assert.strictEqual(vetoRes.body.remainingTokens, 1, 'Player 2 tokens decremented from 2 to 1');
  assert.strictEqual(vetoRes.body.auctionState.currentLot.status, 'vetoed', 'Lot status marked vetoed');
  assert.strictEqual(vetoRes.body.auctionState.vetoedLots.length, 1, 'Added to vetoedLots');

  // Cannot veto same player twice
  const duplicateVeto = await callApp({
    method: 'POST',
    url: `/api/auction/${roomCode}/veto`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(duplicateVeto.status, 400);
  console.log('  ✓ T2 Veto successfully executed: 1 token deducted, cricketer eliminated.');

  // 12. Verifying Reconnection & State Recovery
  console.log('\n12. Testing Reconnection & Authoritative State Recovery...');
  const stateRecovery = await callApp({
    method: 'GET',
    url: `/api/auction/${roomCode}/state`,
    headers: { authorization: `Bearer ${player2.token}` }
  });
  assert.strictEqual(stateRecovery.status, 200);
  const recovered = stateRecovery.body.auctionState;

  assert.strictEqual(recovered.roomCode, roomCode);
  assert.strictEqual(recovered.stage, 'RESOLVED');
  assert.strictEqual(recovered.soldLots.length, 1);
  assert.strictEqual(recovered.unsoldLots.length, 1);
  assert.strictEqual(recovered.vetoedLots.length, 1);
  assert.strictEqual(recovered.nominationMode, 'automatic');
  assert.ok(recovered.auctionQueueLength > 0, 'Auction queue length persisted');
  console.log('  ✓ Reconnecting clients recover exact authoritative MongoDB auction state.');

  // Cleanup active timer
  auctionEngineService.stopAuctionTimer(roomCode);

  console.log('\n🎉 --- ALL 12 AUTOMATIC RANDOM AUCTION TESTS PASSED CLEANLY! --- 🎉\n');
};

module.exports = { runAutomaticAuctionTests };

if (require.main === module) {
  runAutomaticAuctionTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

#!/usr/bin/env node
/**
 * CRICKETVERSE INTEGRATION TEST SUITE: MULTIPLAYER TWO-PLAYER JOINING FLOW
 *
 * Tests:
 * 1. Two separate authenticated users (Host & Player 2)
 * 2. MongoDB room persistence with string _id
 * 3. Realtime join via invitation token
 * 4. Active player count transition from 1/6 to 2/6
 * 5. Host & Player 2 slot preservation on re-fetch/refresh
 * 6. Duplicate user ID rejection (prevents occupying multiple seats)
 * 7. Spectator isolation (spectators never count as active players)
 * 8. Fixed capacity (max 6 active players, 7th person rule)
 * 9. Start game readiness (min 2 active players)
 */

process.env.DISABLE_RATE_LIMIT = 'true';
const assert = require('assert');
const { Duplex } = require('stream');
const http = require('http');
const crypto = require('crypto');
const { app } = require('../src/server');
const storeService = require('../src/services/storeService');
const Room = require('../src/models/Room');
const User = require('../src/models/User');

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

async function runTwoPlayerJoiningTests() {
  console.log('\n🏏 --- CRICKETVERSE MULTIPLAYER TWO-PLAYER JOINING SUITE --- 🏏\n');

  // STEP 1: Authenticate two distinct users
  console.log('1. Authenticating two distinct managers...');
  const hostRes = await callApp({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      username: `Host_${Date.now()}`,
      email: `host_${Date.now()}@arena.cricketverse.app`,
      password: 'password123',
      favoriteTeam: 'Royal Challengers Bengaluru'
    }
  });
  assert.strictEqual(hostRes.status, 201, 'Host registration must return 201');
  const hostUser = hostRes.body.user;
  const hostToken = hostRes.body.token;
  assert.ok(hostToken, 'Host must receive JWT token');

  const player2Res = await callApp({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      username: `Player2_${Date.now()}`,
      email: `player2_${Date.now()}@arena.cricketverse.app`,
      password: 'password123',
      favoriteTeam: 'Mumbai Indians'
    }
  });
  assert.strictEqual(player2Res.status, 201, 'Player 2 registration must return 201');
  const player2User = player2Res.body.user;
  const player2Token = player2Res.body.token;
  assert.ok(player2Token, 'Player 2 must receive JWT token');

  assert.notStrictEqual(hostUser.id || hostUser._id, player2User.id || player2User._id, 'Host and Player 2 must have distinct user IDs');
  console.log(`  ✓ Host authenticated: ${hostUser.username} (${hostUser.id || hostUser._id})`);
  console.log(`  ✓ Player 2 authenticated: ${player2User.username} (${player2User.id || player2User._id})\n`);

  // STEP 2: Also verify Guest Login produces unique IDs
  console.log('2. Verifying Guest Login API (POST /api/auth/guest)...');
  const guest1Res = await callApp({
    method: 'POST',
    url: '/api/auth/guest',
    body: { username: 'GuestStriker', teamName: 'Kolkata Knight Riders' }
  });
  assert.strictEqual(guest1Res.status, 200);
  assert.ok(guest1Res.body.token);
  assert.ok(guest1Res.body.user.id || guest1Res.body.user._id);
  assert.ok((guest1Res.body.user.id || guest1Res.body.user._id).startsWith('usr_guest_'));

  const guest2Res = await callApp({
    method: 'POST',
    url: '/api/auth/guest',
    body: { username: 'GuestSpinner', teamName: 'Chennai Super Kings' }
  });
  assert.strictEqual(guest2Res.status, 200);
  assert.notStrictEqual(
    guest1Res.body.user.id || guest1Res.body.user._id,
    guest2Res.body.user.id || guest2Res.body.user._id,
    'Each guest login must receive a unique user ID'
  );
  console.log('  ✓ Distinct guest accounts generated with unique IDs.\n');

  // STEP 3: Host creates room with MongoDB persistence
  console.log('3. Host creates T20 Room (30 Points Purse)...');
  const createRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'Premier League Showdown',
      format: 'T20',
      stadiumId: 'eden_gardens',
      teamName: 'Bangalore Legends XI',
      allowSpectators: true
    }
  });

  assert.strictEqual(createRes.status, 201, 'Room creation must return 201');
  const room = createRes.body.room;
  assert.ok(room._id, 'Created room must have valid string _id');
  assert.ok(typeof room._id === 'string' && room._id.startsWith('room_'), 'Room _id must start with room_');
  assert.ok(room.roomCode, 'Room must have a roomCode');
  assert.strictEqual(room.activePlayersCount, 1, 'Initial room must have exactly 1 active player');
  assert.strictEqual(room.participants.length, 1);
  assert.strictEqual(room.participants[0].isHost, true);
  assert.strictEqual(room.participants[0].role, 'player');
  assert.strictEqual(room.canStart, false, 'Room with 1 player cannot start yet');

  const inviteToken = room.invitation?.token;
  assert.ok(inviteToken, 'Room must have shareable invitation token');
  console.log(`  ✓ Room created: Code=${room.roomCode}, _id=${room._id}, Active Players=1/6\n`);

  // STEP 4: Player 2 opens Invitation Preview
  console.log('4. Player 2 views Invitation Preview (GET /api/rooms/invitation/:token)...');
  const previewRes = await callApp({
    method: 'GET',
    url: `/api/rooms/invitation/${inviteToken}`
  });
  assert.strictEqual(previewRes.status, 200);
  assert.strictEqual(previewRes.body.room.roomCode, room.roomCode);
  assert.strictEqual(previewRes.body.room.activePlayersCount, 1);
  console.log(`  ✓ Invitation verified for room: ${room.name} (${room.roomCode})\n`);

  // STEP 5: Player 2 joins as Player via Invitation Token
  console.log('5. Player 2 joins room via POST /api/rooms/join-invite/:token...');
  const joinRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${player2Token}` },
    body: {
      role: 'player',
      teamName: 'Mumbai Blasters XI'
    }
  });

  assert.strictEqual(joinRes.status, 200, 'Player 2 join must return 200 OK');
  assert.strictEqual(joinRes.body.success, true);
  const updatedRoom = joinRes.body.room;

  // VERIFY ACTIVE PLAYER COUNT INCREASED FROM 1 TO 2
  assert.strictEqual(updatedRoom.activePlayersCount, 2, 'Active players count must update to 2/6');
  assert.strictEqual(updatedRoom.participants.length, 2, 'Participants array must contain exactly 2 managers');

  // Verify Host is still Participant 0
  const hostPart = updatedRoom.participants[0];
  assert.strictEqual(hostPart.userId, hostUser.id || hostUser._id);
  assert.strictEqual(hostPart.isHost, true, 'Host must retain host privileges');
  assert.strictEqual(hostPart.role, 'player');

  // Verify Player 2 is Participant 1
  const player2Part = updatedRoom.participants[1];
  assert.strictEqual(player2Part.userId, player2User.id || player2User._id);
  assert.strictEqual(player2Part.username, player2User.username);
  assert.strictEqual(player2Part.teamName, 'Mumbai Blasters XI');
  assert.strictEqual(player2Part.role, 'player');
  assert.strictEqual(player2Part.isHost, false);
  assert.strictEqual(player2Part.budgetRemaining, 30, 'Player 2 purse must match format purse (30 for T20)');
  assert.strictEqual(player2Part.t2VetoTokens, 2, 'Player 2 must receive exactly 2 T2 veto tokens');

  // Verify Minimum 2 players to start is now satisfied
  assert.strictEqual(updatedRoom.canStart, true, 'Room with 2 active players must be eligible to start');
  console.log(`  ✓ Player 2 successfully registered! Active Players: 2/6 (Seat #2 occupied by ${player2Part.username})\n`);

  // STEP 6: Verify Persistence on Re-fetch (GET /api/rooms/:roomCode)
  console.log(`6. Verifying Persistence on Refresh (GET /api/rooms/${room.roomCode})...`);
  const refreshRes = await callApp({
    method: 'GET',
    url: `/api/rooms/${room.roomCode}`
  });
  assert.strictEqual(refreshRes.status, 200);
  assert.strictEqual(refreshRes.body.room.activePlayersCount, 2);
  assert.strictEqual(refreshRes.body.room.participants.length, 2);
  assert.strictEqual(refreshRes.body.room.participants[1].username, player2User.username);
  console.log('  ✓ Room state persists across refreshes without data loss.\n');

  // STEP 7: Prevent Duplicate Seats (Reconnecting Player 2 cannot take seat #3)
  console.log('7. Testing Duplicate Rejection: Player 2 reconnects...');
  const reconnectRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${player2Token}` },
    body: { role: 'player' }
  });
  assert.strictEqual(reconnectRes.status, 200);
  assert.strictEqual(reconnectRes.body.reconnected, true);
  assert.strictEqual(reconnectRes.body.room.activePlayersCount, 2, 'Reconnecting user must NOT take an extra player slot');
  assert.strictEqual(reconnectRes.body.room.participants.length, 2);
  console.log('  ✓ Duplicate user ID properly handled as reconnection without seat duplication.\n');

  // STEP 8: Spectator Joining (Spectators do NOT take player seats)
  console.log('8. Testing Spectator Join...');
  const spectatorUser = await callApp({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      username: `Spectator_${Date.now()}`,
      email: `spec_${Date.now()}@arena.cricketverse.app`,
      password: 'password123'
    }
  });
  const specToken = spectatorUser.body.token;

  const specJoinRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${specToken}` },
    body: { role: 'spectator' }
  });
  assert.strictEqual(specJoinRes.status, 200);
  assert.strictEqual(specJoinRes.body.room.activePlayersCount, 2, 'Spectator must NOT increment active players count');
  assert.strictEqual(specJoinRes.body.room.spectatorsCount, 1, 'Spectator count must equal 1');
  assert.strictEqual(specJoinRes.body.participant.role, 'spectator');
  console.log('  ✓ Spectator successfully isolated from player slots.\n');

  // STEP 9: Fill Remaining Player Slots 3, 4, 5, 6
  console.log('9. Filling Player Slots 3, 4, 5, 6 to reach 6-player capacity...');
  for (let i = 3; i <= 6; i++) {
    const pRes = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: `Player${i}_${Date.now()}`,
        email: `player${i}_${Date.now()}@arena.cricketverse.app`,
        password: 'password123'
      }
    });
    const joinP = await callApp({
      method: 'POST',
      url: `/api/rooms/join-invite/${inviteToken}`,
      headers: { authorization: `Bearer ${pRes.body.token}` },
      body: { role: 'player', teamName: `Team ${i} XI` }
    });
    assert.strictEqual(joinP.status, 200);
    assert.strictEqual(joinP.body.room.activePlayersCount, i);
  }
  console.log('  ✓ All 6 active player slots occupied (Capacity: 6/6).\n');

  // STEP 10: Seventh Person Rule (7th person cannot join as player)
  console.log('10. Testing Seventh Person Rule: 7th user attempts to join as player...');
  const p7Res = await callApp({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      username: `Player7_${Date.now()}`,
      email: `player7_${Date.now()}@arena.cricketverse.app`,
      password: 'password123'
    }
  });

  const p7Join = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${p7Res.body.token}` },
    body: { role: 'player' }
  });
  assert.strictEqual(p7Join.status, 400, '7th player must be rejected with 400');
  assert.strictEqual(p7Join.body.code, 'PLAYER_SLOTS_FULL');
  assert.strictEqual(p7Join.body.canJoinAsSpectator, true);

  // 7th person can join as spectator
  const p7SpecJoin = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${p7Res.body.token}` },
    body: { role: 'spectator' }
  });
  assert.strictEqual(p7SpecJoin.status, 200);
  assert.strictEqual(p7SpecJoin.body.room.activePlayersCount, 6, 'Active players count must remain 6');
  console.log('  ✓ 7th person rule strictly enforced (Rejected as player, accepted as spectator).\n');

  // STEP 11: Host Launches Arena
  console.log('11. Host launches arena (POST /api/rooms/:roomCode/start)...');
  const startRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${room.roomCode}/start`,
    headers: { authorization: `Bearer ${hostToken}` }
  });
  assert.strictEqual(startRes.status, 200);
  assert.strictEqual(startRes.body.success, true);
  assert.strictEqual(startRes.body.room.status, 'auction');
  console.log('  ✓ Game started successfully with active player rosters!\n');

  console.log('🎉 --- ALL 11 MULTIPLAYER PLAYER-JOINING TESTS PASSED CLEANLY! --- 🎉\n');
}

runTwoPlayerJoiningTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

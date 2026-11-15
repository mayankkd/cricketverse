const assert = require('assert');
const { Readable, Duplex } = require('stream');
const http = require('http');
const jwt = require('jsonwebtoken');
const { app } = require('../src/server');

// In-process HTTP request mock dispatcher for Express in Node v24
const callApp = ({ method, url, body = null, headers = {} }) => {
  return new Promise((resolve, reject) => {
    let bodyStr = null;
    if (body) {
      bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) {
        callback();
      }
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

    // Capture response data
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

const runAllTests = async () => {
  console.log('\n🏏 --- CRICKETVERSE IN-PROCESS BACKEND TEST SUITE --- 🏏\n');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  };

  // 1. Healthcheck
  await test('GET /api/health should return ONLINE status', async () => {
    const res = await callApp({ method: 'GET', url: '/api/health' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ONLINE');
    assert.ok(res.body.service.includes('CRICKETVERSE'));
  });

  // 2. Register Validation
  await test('POST /api/auth/register fails with invalid email or short password', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: { username: 'ab', email: 'invalid-email', password: '123' }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  });

  // 3. Register Success
  let authToken;
  const testUsername = `manager_${Date.now().toString().slice(-4)}`;
  const testEmail = `${testUsername}@cricketverse.com`;

  await test('POST /api/auth/register successfully creates user & issues JWT', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: testUsername,
        email: testEmail,
        password: 'password123',
        favoriteTeam: 'Mumbai Indians'
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.username, testUsername);
    authToken = res.body.token;
  });

  // 4. Duplicate Registration
  await test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: `diff_${Date.now()}`,
        email: testEmail,
        password: 'password123'
      }
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  // 5. Login Success
  await test('POST /api/auth/login authenticates registered user', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: testEmail, password: 'password123' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testEmail);
  });

  // 6. Login Failure
  await test('POST /api/auth/login rejects incorrect password', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: testEmail, password: 'wrong_password_999' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // 7. Demo Login
  await test('POST /api/auth/demo provides 1-click test login', async () => {
    const res = await callApp({ method: 'POST', url: '/api/auth/demo' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.username, 'cricket_legend');
  });

  // 8. Protected Route with and without token
  await test('GET /api/auth/me rejects request without Bearer token (401)', async () => {
    const res = await callApp({ method: 'GET', url: '/api/auth/me' });
    assert.strictEqual(res.status, 401);
  });

  await test('GET /api/auth/me succeeds with valid Bearer token', async () => {
    const res = await callApp({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.username, testUsername);
  });

  // 9. Players Database & Phase 2 System
  await test('GET /api/players returns seeded cricket player cards with legal photo attribution', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.players.length >= 10);
    const kohli = res.body.players.find(p => p.name === 'Virat Kohli');
    assert.ok(kohli, 'Virat Kohli must exist in player database');
    assert.ok(kohli.imageUrl, 'Player must have recognizable photograph URL');
    assert.ok(kohli.imageSource, 'Image must have documented source');
    assert.ok(kohli.attribution, 'Image must have documented photographer attribution');
    assert.ok(kohli.licenceInfo, 'Image must have documented licence information');
    assert.strictEqual(kohli.ovr.odi, 120, 'OVR scale must support 1-120 range (Kohli Peak ODI OVR = 120)');
  });

  await test('GET /api/players?role=Bowler filters by bowling role', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?role=Bowler' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.role === 'Bowler'));
  });

  await test('GET /api/players?format=Test strictly filters by Test match eligibility', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?format=Test' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.formatEligibility && p.formatEligibility.test === true));
    const bradman = res.body.players.find(p => p.name.includes('Bradman'));
    assert.ok(bradman, 'Don Bradman must be in Test format');
  });

  await test('GET /api/players?format=T20 strictly excludes players without official T20 appearance', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?format=T20' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.formatEligibility && p.formatEligibility.t20 === true));
    const bradmanInT20 = res.body.players.find(p => p.name.includes('Bradman'));
    assert.strictEqual(bradmanInT20, undefined, 'Bradman never appeared in official T20 and must be excluded');
  });

  await test('GET /api/players?country=Australia filters by country', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?country=Australia' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.country === 'Australia'));
  });

  await test('GET /api/players?cardVariant=Peak filters by card variant', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?cardVariant=Peak' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.cardVariant === 'Peak'));
  });

  await test('GET /api/players/meta/filters returns all filtering metadata', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players/meta/filters' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.metadata.countries.includes('India'));
    assert.ok(res.body.metadata.countries.includes('Australia'));
    assert.ok(res.body.metadata.variants.includes('Peak'));
    assert.ok(res.body.metadata.variants.includes('All-Time Great'));
  });

  await test('GET /api/players/compare/ply_01/ply_02 compares 14 attributes & format OVRs', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players/compare/ply_01/ply_02' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.player1.name, 'Virat Kohli');
    assert.strictEqual(res.body.player2.name, 'Jasprit Bumrah');
    assert.strictEqual(res.body.comparison.length, 14, 'Must compare all 14 specified cricket attributes');
    assert.ok(res.body.ovrComparison.test, 'Must include Test OVR comparison');
    assert.ok(res.body.ovrComparison.odi, 'Must include ODI OVR comparison');
    assert.ok(res.body.ovrComparison.t20, 'Must include T20 OVR comparison');
  });

  // 10. Rooms (Create & Join)
  // ==========================================
  // PHASE 3: MULTIPLAYER ROOMS & SPECTATORS
  // ==========================================
  console.log('\n--- PHASE 3: MULTIPLAYER ROOMS & SPECTATOR TESTS ---');

  const { signToken } = require('../src/config/jwt');
  const storeService = require('../src/services/storeService');

  const createTestUser = async (username) => {
    const user = await storeService.createUser({
      username,
      email: `${username.toLowerCase()}_${Date.now()}@cricketverse.com`,
      password: 'password123'
    });
    const token = signToken({ id: user._id });
    return { ...user, token };
  };

  const uHost = await createTestUser('HostCaptain');
  const uPlayer2 = await createTestUser('PlayerTwo');
  const uPlayer3 = await createTestUser('PlayerThree');
  const uPlayer4 = await createTestUser('PlayerFour');
  const uPlayer5 = await createTestUser('PlayerFive');
  const uPlayer6 = await createTestUser('PlayerSix');
  const uCandidate7 = await createTestUser('PersonSeven');
  const uSpectator8 = await createTestUser('ScoutEight');
  const uSpectator9 = await createTestUser('ScoutNine');

  let testRoomCode;
  let testInviteToken;

  // 1. First player joins
  await test('Phase 3 - 1. First player joins: room initializes with host and 1 active player', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: {
        name: 'Phase 3 Arena Challenge',
        format: 'T20',
        teamName: 'Host Strikers XI'
      },
      headers: { authorization: `Bearer ${uHost.token}` }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.room.roomCode);
    testRoomCode = res.body.room.roomCode;
    testInviteToken = res.body.room.invitation?.token;

    assert.strictEqual(res.body.room.activePlayersCount, 1);
    assert.strictEqual(res.body.room.spectatorsCount, 0);
    assert.strictEqual(res.body.room.availablePlayerSlots, 5);
    assert.strictEqual(res.body.room.participants[0].role, 'player');
    assert.strictEqual(res.body.room.participants[0].isHost, true);
  });

  // 2. Game cannot start with one player
  await test('Phase 3 - 2. Game cannot start with one player (1 player + 100 spectators = cannot start)', async () => {
    const res = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/start`,
      headers: { authorization: `Bearer ${uHost.token}` }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'INSUFFICIENT_PLAYERS');
    assert.ok(res.body.message.includes('Minimum 2 active players'));

    const roomDetails = await callApp({ method: 'GET', url: `/api/rooms/${testRoomCode}` });
    assert.strictEqual(roomDetails.body.room.canStart, false);
  });

  // 3. Second player joins
  await test('Phase 3 - 3. Second player joins: capacity reaches 2 active players', async () => {
    const res = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/join`,
      body: { role: 'player', teamName: 'Warriors XI' },
      headers: { authorization: `Bearer ${uPlayer2.token}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.participant.role, 'player');
    assert.strictEqual(res.body.room.activePlayersCount, 2);
  });

  // 4. Game becomes eligible to start
  await test('Phase 3 - 4. Game becomes eligible to start once 2 active players have joined', async () => {
    const roomDetails = await callApp({ method: 'GET', url: `/api/rooms/${testRoomCode}` });
    assert.strictEqual(roomDetails.status, 200);
    assert.strictEqual(roomDetails.body.room.canStart, true);
    assert.strictEqual(roomDetails.body.room.activePlayersCount, 2);

    // Host can now successfully launch the room
    const res = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/start`,
      headers: { authorization: `Bearer ${uHost.token}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.room.status, 'auction');
  });

  // 5. Six players join
  await test('Phase 3 - 5. Six players join: fills all 6 active player slots', async () => {
    // Add Players 3, 4, 5, 6
    for (const player of [uPlayer3, uPlayer4, uPlayer5, uPlayer6]) {
      const res = await callApp({
        method: 'POST',
        url: `/api/rooms/${testRoomCode}/join`,
        body: { role: 'player', teamName: `${player.username}'s XI` },
        headers: { authorization: `Bearer ${player.token}` }
      });
      assert.strictEqual(res.status, 200);
    }

    const roomDetails = await callApp({ method: 'GET', url: `/api/rooms/${testRoomCode}` });
    assert.strictEqual(roomDetails.body.room.activePlayersCount, 6);
    assert.strictEqual(roomDetails.body.room.availablePlayerSlots, 0);
    assert.strictEqual(roomDetails.body.room.canJoinAsPlayer, false);
  });

  // 6. Seventh person cannot join as player
  await test('Phase 3 - 6. Seventh person cannot join as player (Fixed capacity 6 enforced)', async () => {
    const res = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/join`,
      body: { role: 'player', teamName: 'Seventh Challengers' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'PLAYER_SLOTS_FULL');
    assert.strictEqual(res.body.canJoinAsSpectator, true);
    assert.ok(res.body.message.includes('All 6 player slots are occupied'));
  });

  // 7. Seventh person can join as spectator
  await test('Phase 3 - 7. Seventh person can join as spectator (Seventh Person Rule)', async () => {
    const res = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/join`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.participant.role, 'spectator');
    assert.strictEqual(res.body.room.activePlayersCount, 6, 'Active players must remain strictly 6');
    assert.strictEqual(res.body.room.spectatorsCount, 1);
  });

  // 8. More spectators join
  await test('Phase 3 - 8. More spectators join: spectator count scales without taking player slots', async () => {
    for (const spec of [uSpectator8, uSpectator9]) {
      const res = await callApp({
        method: 'POST',
        url: `/api/rooms/${testRoomCode}/join`,
        body: { role: 'spectator' },
        headers: { authorization: `Bearer ${spec.token}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.participant.role, 'spectator');
    }

    const roomDetails = await callApp({ method: 'GET', url: `/api/rooms/${testRoomCode}` });
    assert.strictEqual(roomDetails.body.room.activePlayersCount, 6);
    assert.strictEqual(roomDetails.body.room.spectatorsCount, 3);
  });

  // 9. Spectators cannot perform player actions
  await test('Phase 3 - 9. Spectators cannot perform player actions (bid, nominate, lineup, ready rejected)', async () => {
    // Attempt bid as spectator
    const bidRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/bid`,
      body: { amount: 50000000, playerId: 'ply_01' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(bidRes.status, 403);
    assert.strictEqual(bidRes.body.code, 'SPECTATOR_ACTION_FORBIDDEN');

    // Attempt nominate as spectator
    const nomRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/nominate`,
      body: { playerId: 'ply_02' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(nomRes.status, 403);
    assert.strictEqual(nomRes.body.code, 'SPECTATOR_ACTION_FORBIDDEN');

    // Attempt modify lineup as spectator
    const lineupRes = await callApp({
      method: 'PUT',
      url: `/api/rooms/${testRoomCode}/lineup`,
      body: { playingXI: ['ply_01'], captainId: 'ply_01' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(lineupRes.status, 403);
    assert.strictEqual(lineupRes.body.code, 'SPECTATOR_ACTION_FORBIDDEN');

    // Attempt toggle ready as spectator
    const readyRes = await callApp({
      method: 'PUT',
      url: `/api/rooms/${testRoomCode}/ready`,
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(readyRes.status, 403);
    assert.strictEqual(readyRes.body.code, 'SPECTATOR_ACTION_FORBIDDEN');
  });

  // 10. Invitation links work
  let freshInviteToken;
  await test('Phase 3 - 10. Invitation links work: valid token allows preview and joining', async () => {
    const invRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/invitations`,
      body: { expiresInHours: 24 },
      headers: { authorization: `Bearer ${uHost.token}` }
    });
    assert.strictEqual(invRes.status, 200);
    assert.ok(invRes.body.invitation.token);
    freshInviteToken = invRes.body.invitation.token;

    // Public preview endpoint
    const previewRes = await callApp({
      method: 'GET',
      url: `/api/rooms/invitation/${freshInviteToken}`
    });
    assert.strictEqual(previewRes.status, 200);
    assert.strictEqual(previewRes.body.room.roomCode, testRoomCode);
    assert.strictEqual(previewRes.body.room.canJoinAsSpectator, true);

    // Join via invitation
    const uInvGuest = await createTestUser('InviteGuest');
    const joinInvRes = await callApp({
      method: 'POST',
      url: `/api/rooms/join-invite/${freshInviteToken}`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${uInvGuest.token}` }
    });
    assert.strictEqual(joinInvRes.status, 200);
    assert.strictEqual(joinInvRes.body.participant.role, 'spectator');
  });

  // 11. Revoked invitations fail
  await test('Phase 3 - 11. Revoked invitations fail: host revocation blocks invite link', async () => {
    const revokeRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/invitations/revoke`,
      headers: { authorization: `Bearer ${uHost.token}` }
    });
    assert.strictEqual(revokeRes.status, 200);

    // Calling preview on revoked token fails
    const previewRes = await callApp({
      method: 'GET',
      url: `/api/rooms/invitation/${freshInviteToken}`
    });
    assert.strictEqual(previewRes.status, 410);
    assert.strictEqual(previewRes.body.code, 'INVITE_REVOKED');

    // Attempting to join on revoked token fails
    const uRevGuest = await createTestUser('RevokedGuest');
    const joinRes = await callApp({
      method: 'POST',
      url: `/api/rooms/join-invite/${freshInviteToken}`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${uRevGuest.token}` }
    });
    assert.strictEqual(joinRes.status, 410);
    assert.strictEqual(joinRes.body.code, 'INVITE_REVOKED');
  });

  // 12. Reconnection restores the original role
  await test('Phase 3 - 12. Reconnection restores original role without duplicating slots', async () => {
    // Player 2 reconnects
    const reconPlayer = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/join`,
      body: { role: 'player' },
      headers: { authorization: `Bearer ${uPlayer2.token}` }
    });
    assert.strictEqual(reconPlayer.status, 200);
    assert.strictEqual(reconPlayer.body.reconnected, true);
    assert.strictEqual(reconPlayer.body.participant.role, 'player');

    // Spectator User 7 reconnects
    const reconSpectator = await callApp({
      method: 'POST',
      url: `/api/rooms/${testRoomCode}/join`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${uCandidate7.token}` }
    });
    assert.strictEqual(reconSpectator.status, 200);
    assert.strictEqual(reconSpectator.body.reconnected, true);
    assert.strictEqual(reconSpectator.body.participant.role, 'spectator');

    // Verify room has no duplicate participant slots
    const roomDetails = await callApp({ method: 'GET', url: `/api/rooms/${testRoomCode}` });
    const p2Count = roomDetails.body.room.participants.filter(p => p.userId === uPlayer2._id).length;
    const c7Count = roomDetails.body.room.participants.filter(p => p.userId === uCandidate7._id).length;
    assert.strictEqual(p2Count, 1, 'Player 2 must not have duplicate slot');
    assert.strictEqual(c7Count, 1, 'Spectator 7 must not have duplicate slot');
    assert.strictEqual(roomDetails.body.room.activePlayersCount, 6);
  });

  // 13. Concurrent joins cannot exceed six active players
  await test('Phase 3 - 13. Concurrent joins cannot exceed six active players (Atomic lock)', async () => {
    // Create new room with 5 active players (1 slot remaining)
    const hostInit = await createTestUser('ConcHost');
    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Concurrency Arena', format: 'T20' },
      headers: { authorization: `Bearer ${hostInit.token}` }
    });
    assert.strictEqual(createRes.status, 201);
    const concCode = createRes.body.room.roomCode;

    // Add 4 more players so exactly 5 active players exist (1 slot left)
    for (let i = 2; i <= 5; i++) {
      const uTok = await createTestUser(`ConcPlayer${i}`);
      await callApp({
        method: 'POST',
        url: `/api/rooms/${concCode}/join`,
        body: { role: 'player' },
        headers: { authorization: `Bearer ${uTok.token}` }
      });
    }

    const stateBefore = await callApp({ method: 'GET', url: `/api/rooms/${concCode}` });
    assert.strictEqual(stateBefore.body.room.activePlayersCount, 5);
    assert.strictEqual(stateBefore.body.room.availablePlayerSlots, 1);

    // Now fire 5 SIMULTANEOUS concurrent join requests as 'player'
    const concurrentUsers = await Promise.all(
      [6, 7, 8, 9, 10].map(idx => createTestUser(`Racer${idx}`))
    );

    const results = await Promise.all(
      concurrentUsers.map(u =>
        callApp({
          method: 'POST',
          url: `/api/rooms/${concCode}/join`,
          body: { role: 'player', teamName: `Racer XI` },
          headers: { authorization: `Bearer ${u.token}` }
        })
      )
    );

    const successfulJoins = results.filter(r => r.status === 200);
    const rejectedJoins = results.filter(r => r.status === 400 && r.body.code === 'PLAYER_SLOTS_FULL');

    assert.strictEqual(successfulJoins.length, 1, 'Exactly one concurrent racer must succeed as the 6th player');
    assert.strictEqual(rejectedJoins.length, 4, 'All excess concurrent racers must be rejected with 400 PLAYER_SLOTS_FULL');

    const stateAfter = await callApp({ method: 'GET', url: `/api/rooms/${concCode}` });
    assert.strictEqual(stateAfter.body.room.activePlayersCount, 6, 'Active players must strictly not exceed 6');
  });

  // ==========================================
  // PHASE 4: LIVE AUCTION SYSTEM TESTS
  // ==========================================
  console.log('\n--- PHASE 4: LIVE AUCTION SYSTEM TESTS ---');

  // Helper setup for fresh test auction room
  const setupAuctionRoom = async (format = 'T20', playerCount = 2) => {
    const host = await createTestUser(`AucHost_${format}_${Date.now()}`);
    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: `${format} Arena`, format },
      headers: { authorization: `Bearer ${host.token}` }
    });
    const roomCode = createRes.body.room.roomCode;
    const players = [host];

    for (let i = 2; i <= playerCount; i++) {
      const p = await createTestUser(`AucPlayer_${i}_${Date.now()}`);
      await callApp({
        method: 'POST',
        url: `/api/rooms/${roomCode}/join`,
        body: { role: 'player', teamName: `Franchise ${i}` },
        headers: { authorization: `Bearer ${p.token}` }
      });
      players.push(p);
    }

    // Launch game into auction status
    await callApp({
      method: 'POST',
      url: `/api/rooms/${roomCode}/start`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    return { host, players, roomCode };
  };

  // 1. Base price = 1 point
  await test('Phase 4 - 1. Base price = 1 point (regardless of OVR, variant, popularity)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);
    // Nominate Peak Virat Kohli (ply_01, T20 OVR: 115)
    const nomRes = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_01' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nomRes.status, 200);
    assert.strictEqual(nomRes.body.currentLot.startingPrice, 1, 'Starting price must strictly be 1 point');
    assert.strictEqual(nomRes.body.currentLot.currentBid, 1, 'Initial opening bid must strictly be 1 point');
    assert.strictEqual(nomRes.body.currentLot.ovr, 115, 'High tier OVR is 115, but starting price remains 1 point');
  });

  // 2. Test purse = 50 points
  await test('Phase 4 - 2. Test purse = 50 points per team', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('Test', 2);
    const stateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
    assert.strictEqual(stateRes.status, 200);
    assert.strictEqual(stateRes.body.auctionState.initialPurse, 50, 'Test format purse must be 50 points');
    const p1 = stateRes.body.auctionState.participants.find(p => p.userId === host._id);
    assert.strictEqual(p1.budgetRemaining, 50, 'Test team budget must be initialized to 50 points');
  });

  // 3. ODI purse = 40 points
  await test('Phase 4 - 3. ODI purse = 40 points per team', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('ODI', 2);
    const stateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
    assert.strictEqual(stateRes.status, 200);
    assert.strictEqual(stateRes.body.auctionState.initialPurse, 40, 'ODI format purse must be 40 points');
    const p1 = stateRes.body.auctionState.participants.find(p => p.userId === host._id);
    assert.strictEqual(p1.budgetRemaining, 40, 'ODI team budget must be initialized to 40 points');
  });

  // 4. T20 purse = 30 points
  await test('Phase 4 - 4. T20 purse = 30 points per team', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const stateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
    assert.strictEqual(stateRes.status, 200);
    assert.strictEqual(stateRes.body.auctionState.initialPurse, 30, 'T20 format purse must be 30 points');
    const p1 = stateRes.body.auctionState.participants.find(p => p.userId === host._id);
    assert.strictEqual(p1.budgetRemaining, 30, 'T20 team budget must be initialized to 30 points');
  });

  // 5. Bid increments
  await test('Phase 4 - 5. Bid increments enforced (bids below required increment rejected)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Nominate player (ply_02, Jasprit Bumrah)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_02' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Opening bid at 1 point by Player 2
    const bid1 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 1 },
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(bid1.status, 200);
    assert.strictEqual(bid1.body.currentLot.currentBid, 1);

    // Host attempts to bid 1 point again (must fail because increment is 1 -> min bid is 2)
    const bidFail = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 1 },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(bidFail.status, 400);
    assert.strictEqual(bidFail.body.code, 'BID_TOO_LOW');

    // Host bids 2 points (succeeds)
    const bid2 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 2 },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(bid2.status, 200);
    assert.strictEqual(bid2.body.currentLot.currentBid, 2);
  });

  // 6. Budget validation
  await test('Phase 4 - 6. Budget validation (bids exceeding remaining purse rejected)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Nominate player
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_03' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // p2 has 30 points purse. Attempt to bid 35 points:
    const overBid = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 35 },
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(overBid.status, 400);
    assert.strictEqual(overBid.body.code, 'INSUFFICIENT_BUDGET');
  });

  // 7. Concurrent bidding (atomic handling under race conditions)
  await test('Phase 4 - 7. Concurrent bidding (atomic handling under race condition)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 3);
    const p2 = players[1];
    const p3 = players[2];

    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_04' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Two players submit bid for 5 points at the exact same millisecond
    const [res1, res2] = await Promise.all([
      callApp({
        method: 'POST',
        url: `/api/auction/${roomCode}/bid`,
        body: { amount: 5 },
        headers: { authorization: `Bearer ${p2.token}` }
      }),
      callApp({
        method: 'POST',
        url: `/api/auction/${roomCode}/bid`,
        body: { amount: 5 },
        headers: { authorization: `Bearer ${p3.token}` }
      })
    ]);

    const successes = [res1, res2].filter(r => r.status === 200);
    const failures = [res1, res2].filter(r => r.status === 400);

    assert.strictEqual(successes.length, 1, 'Only one racer can place the bid at 5 points');
    assert.strictEqual(failures.length, 1, 'Second racer must fail with BID_TOO_LOW');
  });

  // 8. Player ownership & atomic sale
  await test('Phase 4 - 8. Player ownership & atomic sale (points deducted, card added to winner squad)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Nominate ply_05 (Shane Warne)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_05' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // P2 bids 4 points
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 4 },
      headers: { authorization: `Bearer ${p2.token}` }
    });

    // Hammer down sold!
    const hammerRes = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(hammerRes.status, 200);
    assert.strictEqual(hammerRes.body.currentLot.status, 'sold');

    // Verify P2 squad and budget
    const stateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
    const p2State = stateRes.body.auctionState.participants.find(p => p.userId === p2._id);
    assert.strictEqual(p2State.budgetRemaining, 26, 'P2 purse must be 30 - 4 = 26 points');
    assert.strictEqual(p2State.squad.length, 1, 'P2 squad must now have acquired player');
    assert.strictEqual(p2State.squad[0].cardId, 'ply_05');
    assert.strictEqual(p2State.squad[0].acquiredPrice, 4);
  });

  // 9. Unique player nomination (one cricketer only once per auction)
  await test('Phase 4 - 9. Unique player nomination (same cricketer cannot be nominated twice)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);

    // Nominate ply_06 (Sir Viv Richards)
    const nom1 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_06' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nom1.status, 200);

    // Resolve lot (sold or hammer)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Attempt to nominate ply_06 again in same auction:
    const nom2 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_06' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nom2.status, 400);
    assert.strictEqual(nom2.body.code, 'CRICKETER_ALREADY_NOMINATED');
  });

  // 10. Different OVR duplicate rejection
  await test('Phase 4 - 10. Different OVR duplicate rejection (Peak 120 OVR nominated -> Best 105 OVR rejected)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);

    // 1. Nominate Virat Kohli Peak 120 OVR (ply_01, playerId: 'cric_virat_kohli')
    const nomPeak = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_01' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nomPeak.status, 200);

    // Hammer down
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // 2. Attempt to nominate Virat Kohli Best 105 OVR (ply_01_best, playerId: 'cric_virat_kohli')
    const nomBest = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_01_best' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nomBest.status, 400);
    assert.strictEqual(nomBest.body.code, 'CRICKETER_ALREADY_NOMINATED');
    assert.ok(nomBest.body.message.includes('already been nominated'));
  });

  // 11. Different card variant duplicate rejection
  await test('Phase 4 - 11. Different card variant duplicate rejection (Peak nominated -> Average rejected)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);

    // 1. Nominate Virat Kohli Peak (ply_01)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_01' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Hammer down
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // 2. Attempt to nominate Virat Kohli Average variant (ply_01_avg)
    const nomAvg = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_01_avg' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nomAvg.status, 400);
    assert.strictEqual(nomAvg.body.code, 'CRICKETER_ALREADY_NOMINATED');
  });

  // 12. Sold duplicate rejection
  await test('Phase 4 - 12. Sold duplicate rejection (if card was sold, same cricketer cannot return)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Nominate ply_02 (Jasprit Bumrah Peak)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_02' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // P2 bids and wins
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 3 },
      headers: { authorization: `Bearer ${p2.token}` }
    });

    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Attempt to nominate Clutch variant ply_02_clutch (same cricketer)
    const nomClutch = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_02_clutch' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(nomClutch.status, 400);
    assert.strictEqual(nomClutch.body.code, 'CRICKETER_ALREADY_NOMINATED');
  });

  // 13. Unsold duplicate rejection
  await test('Phase 4 - 13. Unsold duplicate rejection (cannot re-nominate before unsold round)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);

    // Nominate ply_07 (Wasim Akram)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_07' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // No bids placed -> hammer down as unsold
    const unsoldHam = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/hammer`,
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(unsoldHam.body.currentLot.status, 'unsold');

    // Try immediately to nominate again before unsold round:
    const reNom = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_07' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(reNom.status, 400);
    assert.strictEqual(reNom.body.code, 'CRICKETER_ALREADY_NOMINATED');

    // Now host starts Unsold Round
    const roundRes = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/unsold-round`,
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(roundRes.status, 200);

    // Now ply_07 (which was unsold, not vetoed) CAN be nominated in unsold round!
    const reNomAllowed = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_07' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(reNomAllowed.status, 200);
    assert.strictEqual(reNomAllowed.body.currentLot.cardId, 'ply_07');
  });

  // 14. Vetoed duplicate rejection
  await test('Phase 4 - 14. Vetoed duplicate rejection (vetoed cricketer can NEVER return, even in unsold round)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Nominate ply_08 (Ben Stokes)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_08' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // P2 uses T2 Veto!
    const vetoRes = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/veto`,
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(vetoRes.status, 200);
    assert.strictEqual(vetoRes.body.remainingTokens, 1);

    // Try immediately to nominate Ben Stokes: rejected!
    const reNom1 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_08' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(reNom1.status, 400);

    // Host starts unsold round
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/unsold-round`,
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Ben Stokes must STILL be permanently barred!
    const reNom2 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_08' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    assert.strictEqual(reNom2.status, 400);
    assert.ok(reNom2.body.code === 'CRICKETER_ALREADY_NOMINATED' || reNom2.body.code === 'VETOED_PLAYER_CANNOT_RETURN');
  });

  // 15. Exactly 2 T2 Veto tokens
  await test('Phase 4 - 15. Exactly 2 T2 Veto tokens (third veto attempt rejected)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 2);
    const p2 = players[1];

    // Veto 1: Nominate ply_09 (Pat Cummins) and veto
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_09' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    const v1 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/veto`,
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(v1.status, 200);
    assert.strictEqual(v1.body.remainingTokens, 1);

    // Veto 2: Nominate ply_10 (Rashid Khan) and veto
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_10' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    const v2 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/veto`,
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(v2.status, 200);
    assert.strictEqual(v2.body.remainingTokens, 0);

    // Veto 3: Nominate ply_11 (AB de Villiers) and attempt 3rd veto
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_11' },
      headers: { authorization: `Bearer ${host.token}` }
    });
    const v3 = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/veto`,
      headers: { authorization: `Bearer ${p2.token}` }
    });
    assert.strictEqual(v3.status, 400);
    assert.strictEqual(v3.body.code, 'INSUFFICIENT_VETO_TOKENS');
  });

  // 16. Simultaneous veto attempts
  await test('Phase 4 - 16. Simultaneous veto attempts (second one does not lose token, returns error)', async () => {
    const { host, players, roomCode } = await setupAuctionRoom('T20', 3);
    const p2 = players[1];
    const p3 = players[2];

    // Nominate ply_12 (Glenn Maxwell)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_12' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // P2 and P3 hit Veto at the exact same millisecond
    const [vRes2, vRes3] = await Promise.all([
      callApp({
        method: 'POST',
        url: `/api/auction/${roomCode}/veto`,
        headers: { authorization: `Bearer ${p2.token}` }
      }),
      callApp({
        method: 'POST',
        url: `/api/auction/${roomCode}/veto`,
        headers: { authorization: `Bearer ${p3.token}` }
      })
    ]);

    const successes = [vRes2, vRes3].filter(r => r.status === 200);
    const failures = [vRes2, vRes3].filter(r => r.status === 400);

    assert.strictEqual(successes.length, 1, 'Only first veto request succeeds');
    assert.strictEqual(failures.length, 1, 'Second veto request rejected');

    // Check tokens of the one who failed: MUST STILL HAVE 2 TOKENS!
    const failedUser = (vRes2.status === 400) ? p2 : p3;
    const stateRes = await callApp({ method: 'GET', url: `/api/auction/${roomCode}/state` });
    const failedParticipant = stateRes.body.auctionState.participants.find(p => p.userId === failedUser._id);
    assert.strictEqual(failedParticipant.t2VetoTokens, 2, 'Failed racer must NOT lose their token');
  });

  // 17. Spectator permissions in auction
  await test('Phase 4 - 17. Spectator permissions (cannot bid, nominate, or veto)', async () => {
    const { host, roomCode } = await setupAuctionRoom('T20', 2);
    const spectator = await createTestUser(`Spectator_${Date.now()}`);

    // Join room as spectator
    const specJoin = await callApp({
      method: 'POST',
      url: `/api/rooms/${roomCode}/join`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${spectator.token}` }
    });
    assert.strictEqual(specJoin.status, 200);
    assert.strictEqual(specJoin.body.participant.role, 'spectator');

    // Attempt to nominate as spectator -> 403
    const specNom = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_13' },
      headers: { authorization: `Bearer ${spectator.token}` }
    });
    assert.strictEqual(specNom.status, 403);

    // Host nominates ply_13 (Dale Steyn)
    await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/nominate`,
      body: { cardId: 'ply_13' },
      headers: { authorization: `Bearer ${host.token}` }
    });

    // Attempt to bid as spectator -> 403
    const specBid = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/bid`,
      body: { amount: 2 },
      headers: { authorization: `Bearer ${spectator.token}` }
    });
    assert.strictEqual(specBid.status, 403);

    // Attempt to veto as spectator -> 403
    const specVeto = await callApp({
      method: 'POST',
      url: `/api/auction/${roomCode}/veto`,
      headers: { authorization: `Bearer ${spectator.token}` }
    });
    assert.strictEqual(specVeto.status, 403);
  });

  // Match Center & Simulation
  await test('GET /api/matches returns live match data', async () => {
    const res = await callApp({ method: 'GET', url: '/api/matches' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.matches.length > 0);
  });

  await test('POST /api/matches/LIVE-IPL-FINAL/simulate-ball generates commentary & updates score', async () => {
    const res = await callApp({ method: 'POST', url: '/api/matches/LIVE-IPL-FINAL/simulate-ball' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.outcome);
    assert.ok(res.body.match.teamA.score > 0);
  });

  // Tournaments & Standings
  await test('GET /api/tournaments returns tournament standings & fixtures', async () => {
    const res = await callApp({ method: 'GET', url: '/api/tournaments' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.tournaments.length > 0);
    assert.ok(res.body.tournaments[0].standings.length > 0);
    assert.ok(res.body.tournaments[0].fixtures.length > 0);
  });

  console.log(`\n🎯 --- ALL TESTS PASSED: ${passed} PASSED, ${failed} FAILED --- 🎯\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

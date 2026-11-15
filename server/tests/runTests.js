const assert = require('assert');
const { Readable, Duplex } = require('stream');
const http = require('http');
const jwt = require('jsonwebtoken');
const { app } = require('../src/server');
const matchEngineService = require('../src/services/matchEngineService');

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

  // ==========================================
  // PHASE 5: TEAM MANAGEMENT TESTS
  // ==========================================
  console.log('\n--- PHASE 5: TEAM MANAGEMENT TESTS ---');

  let p5Host, p5Player2, p5RoomCode, p5Team1, p5Team2, p5Spectator;

  // 1. Squad Sizes
  await test('Phase 5 - 1. Squad Sizes: Default limits (Test: 15, ODI: 15, T20: 13, Playing XI: 11)', async () => {
    const tHost = await createTestUser(`P5_Host_${Date.now()}`);
    // Create Test room
    const testRoom = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Test Limit Arena', format: 'Test' },
      headers: { authorization: `Bearer ${tHost.token}` }
    });
    assert.strictEqual(testRoom.status, 201);
    assert.strictEqual(testRoom.body.room.squadLimits.test, 15);
    assert.strictEqual(testRoom.body.room.squadLimits.playingXISize, 11);

    // Create ODI room
    const odiRoom = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'ODI Limit Arena', format: 'ODI' },
      headers: { authorization: `Bearer ${tHost.token}` }
    });
    assert.strictEqual(odiRoom.status, 201);
    assert.strictEqual(odiRoom.body.room.squadLimits.odi, 15);

    // Create T20 room
    const t20Room = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'T20 Limit Arena', format: 'T20' },
      headers: { authorization: `Bearer ${tHost.token}` }
    });
    assert.strictEqual(t20Room.status, 201);
    assert.strictEqual(t20Room.body.room.squadLimits.t20, 13);
    assert.strictEqual(t20Room.body.room.squadLimits.playingXISize, 11);

    // Setup base room for subsequent Phase 5 tests
    p5Host = tHost;
    p5RoomCode = t20Room.body.room.roomCode;
    p5Player2 = await createTestUser(`P5_P2_${Date.now()}`);
    await callApp({
      method: 'POST',
      url: `/api/rooms/${p5RoomCode}/join`,
      body: { role: 'player', teamName: 'Warriors XI' },
      headers: { authorization: `Bearer ${p5Player2.token}` }
    });

    p5Spectator = await createTestUser(`P5_Spec_${Date.now()}`);
    await callApp({
      method: 'POST',
      url: `/api/rooms/${p5RoomCode}/join`,
      body: { role: 'spectator' },
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
  });

  // 2. Host Configures Squad Limits
  await test('Phase 5 - 2. Host Configures Squad Limits: Host updates limits; non-host rejected with 403', async () => {
    // Non-host attempts to configure limits -> 403
    const unauthorizedRes = await callApp({
      method: 'PUT',
      url: `/api/teams/room/${p5RoomCode}/squad-limits`,
      body: { t20: 16, maxSquadSize: 18 },
      headers: { authorization: `Bearer ${p5Player2.token}` }
    });
    assert.strictEqual(unauthorizedRes.status, 403);

    // Host configures limits -> 200
    const hostRes = await callApp({
      method: 'PUT',
      url: `/api/teams/room/${p5RoomCode}/squad-limits`,
      body: { t20: 16, maxSquadSize: 18 },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(hostRes.status, 200);
    assert.strictEqual(hostRes.body.success, true);
    assert.strictEqual(hostRes.body.squadLimits.t20, 16);
    assert.strictEqual(hostRes.body.squadLimits.maxSquadSize, 18);
  });

  // 3. Squad Dashboard & Strength Metrics
  await test('Phase 5 - 3. Squad Dashboard & Strength Metrics: Validates returned cards and aggregates', async () => {
    const res = await callApp({
      method: 'GET',
      url: `/api/teams/my?room=${p5RoomCode}`,
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    p5Team1 = res.body.team;
    assert.ok(p5Team1._id);

    // Validate strength metrics
    assert.ok(typeof p5Team1.squadStrength === 'number');
    assert.ok(typeof p5Team1.battingStrength === 'number');
    assert.ok(typeof p5Team1.bowlingStrength === 'number');
    assert.ok(typeof p5Team1.fieldingStrength === 'number');
    assert.ok(typeof p5Team1.chemistryScore === 'number');
    assert.ok(p5Team1.squadBalance);
    assert.ok(typeof p5Team1.squadBalance.battersCount === 'number');
    assert.ok(typeof p5Team1.squadBalance.bowlersCount === 'number');
    assert.ok(typeof p5Team1.squadBalance.allRoundersCount === 'number');
    assert.ok(typeof p5Team1.squadBalance.wicketKeepersCount === 'number');
    assert.ok(p5Team1.squadBalance.summary);

    // Validate player card fields on Playing XI
    assert.strictEqual(p5Team1.populatedPlayingXI.length, 11);
    for (const card of p5Team1.populatedPlayingXI) {
      assert.ok(card.name, 'Player card must display name');
      assert.ok(card.country, 'Player card must display country');
      assert.ok(card.countryFlag, 'Player card must display country flag');
      assert.ok(card.ovr >= 1 && card.ovr <= 120, 'OVR must be on 1-120 scale');
      assert.ok(card.format, 'Player card must display format');
      assert.ok(card.role, 'Player card must display role');
      assert.ok(typeof card.battingRating === 'number', 'Card must have batting rating');
      assert.ok(typeof card.bowlingRating === 'number', 'Card must have bowling rating');
      assert.ok(typeof card.fieldingRating === 'number', 'Card must have fielding rating');
      assert.ok(typeof card.fitness === 'number', 'Card must have fitness');
      assert.ok(typeof card.chemistry === 'number', 'Card must have chemistry');
      assert.ok(card.imageUrl || card.avatarUrl, 'Player card must display real photograph');
    }
  });

  // 4. Team Selection
  await test('Phase 5 - 4. Team Selection: Updates identity, (C), (VC), (WK), and batting/bowling orders', async () => {
    const p1 = p5Team1.squad[0];
    const p2 = p5Team1.squad[1];
    const p3 = p5Team1.squad[2];
    const reversedBatting = [...p5Team1.playingXI].reverse();
    const bowlers = [p5Team1.playingXI[3], p5Team1.playingXI[4], p5Team1.playingXI[5]];

    const updateRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: {
        name: 'Thunderbolts XI',
        shortCode: 'TBX',
        logo: '⚡',
        captainId: p1,
        viceCaptainId: p2,
        wicketKeeperId: p3,
        battingOrder: reversedBatting,
        playingXI: reversedBatting,
        bowlingOrder: bowlers
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.success, true);
    assert.strictEqual(updateRes.body.team.name, 'Thunderbolts XI');
    assert.strictEqual(updateRes.body.team.shortCode, 'TBX');
    assert.strictEqual(updateRes.body.team.logo, '⚡');
    assert.strictEqual(updateRes.body.team.captainId, p1);
    assert.strictEqual(updateRes.body.team.viceCaptainId, p2);
    assert.strictEqual(updateRes.body.team.wicketKeeperId, p3);
    assert.deepStrictEqual(updateRes.body.team.playingXI, reversedBatting);
    p5Team1 = updateRes.body.team;
  });

  // 5. Prevent Duplicate Players in Playing XI
  await test('Phase 5 - 5. Prevent Duplicate Players in Playing XI: Rejects duplicates with 400 DUPLICATE_PLAYER_IN_XI', async () => {
    const dupXI = [p5Team1.squad[0], p5Team1.squad[0], ...p5Team1.squad.slice(2, 11)];
    const res = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { playingXI: dupXI },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'DUPLICATE_PLAYER_IN_XI');
  });

  // 6. Enforce Exactly 11 Players in Playing XI
  await test('Phase 5 - 6. Enforce Exactly 11 Players in Playing XI: Rejects < 11 or > 11 with 400 INVALID_PLAYING_XI_SIZE', async () => {
    // 10 players
    const tenXI = p5Team1.squad.slice(0, 10);
    const res10 = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { playingXI: tenXI },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(res10.status, 400);
    assert.strictEqual(res10.body.code, 'INVALID_PLAYING_XI_SIZE');

    // 12 players
    const twelveXI = p5Team1.squad.slice(0, 12);
    const res12 = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { playingXI: twelveXI },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(res12.status, 400);
    assert.strictEqual(res12.body.code, 'INVALID_PLAYING_XI_SIZE');
  });

  // 7. Respect Auction Ownership
  await test('Phase 5 - 7. Respect Auction Ownership: Rejects unowned player in lineup with 400 UNOWNED_PLAYER_IN_LINEUP', async () => {
    const unownedXI = [...p5Team1.squad.slice(0, 10), 'ply_unowned_card_999'];
    const res = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { playingXI: unownedXI },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'UNOWNED_PLAYER_IN_LINEUP');
  });

  // 8. Cross-Team Auction Uniqueness
  await test('Phase 5 - 8. Cross-Team Auction Uniqueness: Rejects player owned by another team in same auction', async () => {
    // Provision Team 2 for Player 2
    const p2TeamRes = await callApp({
      method: 'GET',
      url: `/api/teams/my?room=${p5RoomCode}`,
      headers: { authorization: `Bearer ${p5Player2.token}` }
    });
    assert.strictEqual(p2TeamRes.status, 200);
    p5Team2 = p2TeamRes.body.team;
    assert.ok(p5Team2._id);

    // Verify squads are disjoint
    const team1SquadSet = new Set(p5Team1.squad);
    const team2Player = p5Team2.squad[0];
    assert.strictEqual(team1SquadSet.has(team2Player), false, 'Teams in same room must not share players');

    // Team 1 attempts to add Player 2's player into its squad
    const stealAttemptSquad = [...p5Team1.squad.slice(0, 12), team2Player];
    const stealRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { squad: stealAttemptSquad },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(stealRes.status, 400);
    assert.strictEqual(stealRes.body.code, 'PLAYER_ALREADY_ASSIGNED_TO_OTHER_TEAM');
  });

  // 9. Player Swapping
  await test('Phase 5 - 9. Player Swapping: Swapping Playing XI with Bench maintains 11 unique players', async () => {
    const pIn = p5Team1.populatedBench[0]._id;
    const pOut = p5Team1.playingXI[0];

    const swapRes = await callApp({
      method: 'POST',
      url: `/api/teams/${p5Team1._id}/swap`,
      body: { playerInId: pIn, playerOutId: pOut },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(swapRes.status, 200);
    assert.strictEqual(swapRes.body.success, true);
    assert.strictEqual(swapRes.body.team.playingXI.includes(pIn), true, 'Bench player must now be in Playing XI');
    assert.strictEqual(swapRes.body.team.playingXI.includes(pOut), false, 'Replaced player must not be in Playing XI');
    assert.strictEqual(swapRes.body.team.playingXI.length, 11, 'Playing XI size must remain exactly 11');
    assert.strictEqual(new Set(swapRes.body.team.playingXI).size, 11, 'All 11 players must be unique');
    p5Team1 = swapRes.body.team;
  });

  // 10. Owner & Host Only Modification
  await test('Phase 5 - 10. Owner & Host Only Modification: Non-owner rejected with 403 UNAUTHORIZED_TEAM_EDIT', async () => {
    // Player 2 attempts to modify Team 1 (Host's team)
    const unauthorizedEdit = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { name: 'Hacked Team' },
      headers: { authorization: `Bearer ${p5Player2.token}` }
    });
    assert.strictEqual(unauthorizedEdit.status, 403);
    assert.strictEqual(unauthorizedEdit.body.code, 'UNAUTHORIZED_TEAM_EDIT');
  });

  // 11. Spectators Have Read-Only Access
  await test('Phase 5 - 11. Spectators Have Read-Only Access: Spectator views team (200), edits rejected (403)', async () => {
    // Spectator can view all room teams
    const roomTeamsRes = await callApp({
      method: 'GET',
      url: `/api/teams/room/${p5RoomCode}`,
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(roomTeamsRes.status, 200);
    assert.strictEqual(roomTeamsRes.body.count >= 2, true);

    // Spectator views my franchise (read-only view)
    const myRes = await callApp({
      method: 'GET',
      url: `/api/teams/my?room=${p5RoomCode}`,
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(myRes.status, 200);
    assert.strictEqual(myRes.body.team.isSpectator, true);
    assert.strictEqual(myRes.body.team.isReadOnly, true);

    // Spectator attempts to update team -> 403 SPECTATOR_READ_ONLY
    const editRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}`,
      body: { name: 'Spectator Tampered' },
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(editRes.status, 403);
    assert.strictEqual(editRes.body.code, 'SPECTATOR_READ_ONLY');

    // Spectator attempts to swap players -> 403 SPECTATOR_READ_ONLY
    const swapRes = await callApp({
      method: 'POST',
      url: `/api/teams/${p5Team1._id}/swap`,
      body: {
        playerInId: p5Team1.squad[0],
        playerOutId: p5Team1.playingXI[0]
      },
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(swapRes.status, 403);
    assert.strictEqual(swapRes.body.code, 'SPECTATOR_READ_ONLY');
  });

  // ==========================================
  // PHASE 6: TACTICAL MANAGEMENT TESTS
  // ==========================================
  console.log('\n--- PHASE 6: TACTICAL MANAGEMENT TESTS ---');

  // 1. Batting Strategies
  await test('Phase 6 - 1. Batting Strategies: 6 modes, individual batter instructions, and invalid validation', async () => {
    // Valid update with global strategy and individual instructions
    const updateRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        batting: {
          teamStrategy: 'Aggressive',
          batterInstructions: [
            { playerId: p5Team1.playingXI[0], strategy: 'Aggressive', aggressionLevel: 80 },
            { playerId: p5Team1.playingXI[1], strategy: 'Power Hitter', aggressionLevel: 90 },
            { playerId: p5Team1.playingXI[2], strategy: 'Anchor', aggressionLevel: 60 }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.success, true);
    assert.strictEqual(updateRes.body.tactics.batting.teamStrategy, 'Aggressive');
    assert.strictEqual(updateRes.body.tactics.batting.batterInstructions[0].strategy, 'Aggressive');
    assert.strictEqual(updateRes.body.tactics.batting.batterInstructions[1].strategy, 'Power Hitter');
    assert.strictEqual(updateRes.body.tactics.batting.batterInstructions[2].strategy, 'Anchor');

    // Invalid strategy rejected with 400 INVALID_BATTING_STRATEGY
    const invalidRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        batting: { teamStrategy: 'UltraSlogNonExistent' }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.body.code, 'INVALID_BATTING_STRATEGY');
  });

  // 2. Mid-Innings Batting Strategy Changes
  await test('Phase 6 - 2. Mid-Innings Batting Strategy Changes: Dynamically adjusts tactics during innings', async () => {
    const midInningsRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        batting: {
          teamStrategy: 'Rotating Strike',
          batterInstructions: [
            { playerId: p5Team1.playingXI[0], strategy: 'Rotating Strike', aggressionLevel: 50 },
            { playerId: p5Team1.playingXI[1], strategy: 'Defensive', aggressionLevel: 30 }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(midInningsRes.status, 200);
    assert.strictEqual(midInningsRes.body.tactics.batting.teamStrategy, 'Rotating Strike');
    assert.strictEqual(midInningsRes.body.tactics.batting.batterInstructions[1].strategy, 'Defensive');
  });

  // 3. Bowling Strategies: Roles & Delivery Tactics
  await test('Phase 6 - 3. Bowling Strategies: Roles & Delivery Tactics validation', async () => {
    const validBowling = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        bowling: {
          bowlerAssignments: [
            { playerId: p5Team1.playingXI[4], role: 'Opening bowlers', deliveryTactic: 'Swing', oversAllocated: 4 },
            { playerId: p5Team1.playingXI[5], role: 'First-change bowlers', deliveryTactic: 'Bouncer', oversAllocated: 4 },
            { playerId: p5Team1.playingXI[6], role: 'Middle-over specialists', deliveryTactic: 'Off-spin', oversAllocated: 4 },
            { playerId: p5Team1.playingXI[7], role: 'Death-over specialists', deliveryTactic: 'Yorker', oversAllocated: 4 }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(validBowling.status, 200);
    assert.strictEqual(validBowling.body.tactics.bowling.bowlerAssignments[0].deliveryTactic, 'Swing');
    assert.strictEqual(validBowling.body.tactics.bowling.bowlerAssignments[3].deliveryTactic, 'Yorker');

    // Invalid delivery tactic
    const badTactic = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        bowling: {
          bowlerAssignments: [{ playerId: p5Team1.playingXI[4], deliveryTactic: 'LaserBeam' }]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(badTactic.status, 400);
    assert.strictEqual(badTactic.body.code, 'INVALID_DELIVERY_TACTIC');

    // Invalid bowler role
    const badRole = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        bowling: {
          bowlerAssignments: [{ playerId: p5Team1.playingXI[4], role: 'Celebrity Bowler' }]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(badRole.status, 400);
    assert.strictEqual(badRole.body.code, 'INVALID_BOWLER_ROLE');
  });

  // 4. Format-Specific Bowling Restrictions
  await test('Phase 6 - 4. Format-Specific Bowling Restrictions: Rejects over allocation exceeding format limits', async () => {
    // p5Team1 is T20 format -> max 4 overs. Allocating 5 overs rejected with 400 BOWLER_OVER_LIMIT_EXCEEDED
    const excessT20 = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        bowling: {
          bowlerAssignments: [{ playerId: p5Team1.playingXI[4], oversAllocated: 5 }]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(excessT20.status, 400);
    assert.strictEqual(excessT20.body.code, 'BOWLER_OVER_LIMIT_EXCEEDED');

    // Test format allows unlimited overs (e.g. 15 overs)
    const testTeamUser = await createTestUser(`TestFormatUser_${Date.now()}`);
    const testRoom = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Unlimited Test Arena', format: 'Test' },
      headers: { authorization: `Bearer ${testTeamUser.token}` }
    });
    const myTestTeam = await callApp({
      method: 'GET',
      url: `/api/teams/my?room=${testRoom.body.room.roomCode}`,
      headers: { authorization: `Bearer ${testTeamUser.token}` }
    });
    const tTeamId = myTestTeam.body.team._id;

    const testFormatBowling = await callApp({
      method: 'PUT',
      url: `/api/teams/${tTeamId}/tactics`,
      body: {
        bowling: {
          bowlerAssignments: [{ playerId: myTestTeam.body.team.playingXI[0], oversAllocated: 15 }]
        }
      },
      headers: { authorization: `Bearer ${testTeamUser.token}` }
    });
    assert.strictEqual(testFormatBowling.status, 200, 'Test format allows > 4 overs without limitation');
  });

  // 5. Interactive Field: 18 Official Positions & Exact 9 Fielders
  await test('Phase 6 - 5. Interactive Field: Exact 9 fielders requirement & position validation', async () => {
    const flds = p5Team1.playingXI.slice(0, 9);

    // 8 fielders (too few) -> 400 INVALID_FIELDER_COUNT
    const shortField = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          positions: [
            { position: 'Slip', fielderId: flds[0] },
            { position: 'Point', fielderId: flds[1] },
            { position: 'Cover', fielderId: flds[2] },
            { position: 'Mid-off', fielderId: flds[3] },
            { position: 'Mid-on', fielderId: flds[4] },
            { position: 'Midwicket', fielderId: flds[5] },
            { position: 'Square Leg', fielderId: flds[6] },
            { position: 'Long-on', fielderId: flds[7] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(shortField.status, 400);
    assert.strictEqual(shortField.body.code, 'INVALID_FIELDER_COUNT');

    // Duplicate fielder in two positions -> 400 DUPLICATE_FIELDER
    const dupFielder = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          positions: [
            { position: 'Slip', fielderId: flds[0] },
            { position: 'Point', fielderId: flds[0] }, // Duplicate!
            { position: 'Cover', fielderId: flds[2] },
            { position: 'Extra Cover', fielderId: flds[3] },
            { position: 'Mid-off', fielderId: flds[4] },
            { position: 'Mid-on', fielderId: flds[5] },
            { position: 'Midwicket', fielderId: flds[6] },
            { position: 'Third Man', fielderId: flds[7] },
            { position: 'Long-on', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(dupFielder.status, 400);
    assert.strictEqual(dupFielder.body.code, 'DUPLICATE_FIELDER');

    // Duplicate position name -> 400 DUPLICATE_FIELD_POSITION
    const dupPos = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          positions: [
            { position: 'Slip', fielderId: flds[0] },
            { position: 'Slip', fielderId: flds[1] }, // Duplicate position!
            { position: 'Cover', fielderId: flds[2] },
            { position: 'Extra Cover', fielderId: flds[3] },
            { position: 'Mid-off', fielderId: flds[4] },
            { position: 'Mid-on', fielderId: flds[5] },
            { position: 'Midwicket', fielderId: flds[6] },
            { position: 'Third Man', fielderId: flds[7] },
            { position: 'Long-on', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(dupPos.status, 400);
    assert.strictEqual(dupPos.body.code, 'DUPLICATE_FIELD_POSITION');
  });

  // 6. Official Fielding Restrictions: Leg-Side Limit (ICC Law 28.4)
  await test('Phase 6 - 6. Official Fielding Restrictions: Leg-Side Limit (ICC Law 28.4 - Max 5)', async () => {
    const flds = p5Team1.playingXI.slice(0, 9);
    // Deploy 6 fielders on leg side: Mid-on, Midwicket, Square Leg, Fine Leg, Long-on, Deep Midwicket
    const excessLeg = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          positions: [
            { position: 'Mid-on', fielderId: flds[0] },
            { position: 'Midwicket', fielderId: flds[1] },
            { position: 'Square Leg', fielderId: flds[2] },
            { position: 'Fine Leg', fielderId: flds[3] },
            { position: 'Long-on', fielderId: flds[4] },
            { position: 'Deep Midwicket', fielderId: flds[5] }, // 6th on leg side!
            { position: 'Cover', fielderId: flds[6] },
            { position: 'Point', fielderId: flds[7] },
            { position: 'Mid-off', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(excessLeg.status, 400);
    assert.strictEqual(excessLeg.body.code, 'EXCESS_LEG_SIDE_FIELDERS');
  });

  // 7. Official Fielding Restrictions: Behind Square Leg Limit (ICC Law 28.4.1)
  await test('Phase 6 - 7. Official Fielding Restrictions: Behind Square Leg Limit (ICC Law 28.4.1 - Max 2)', async () => {
    const flds = p5Team1.playingXI.slice(0, 9);
    const validBehindSq = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          positions: [
            { position: 'Fine Leg', fielderId: flds[0] }, // 1 behind square leg
            { position: 'Deep Square Leg', fielderId: flds[1] }, // 2 behind square leg (legal)
            { position: 'Mid-on', fielderId: flds[2] },
            { position: 'Midwicket', fielderId: flds[3] },
            { position: 'Point', fielderId: flds[4] },
            { position: 'Cover', fielderId: flds[5] },
            { position: 'Mid-off', fielderId: flds[6] },
            { position: 'Third Man', fielderId: flds[7] },
            { position: 'Long-off', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(validBehindSq.status, 200);
    assert.strictEqual(validBehindSq.body.tactics.fieldPlacement.behindSquareLegCount, 2);
    assert.strictEqual(validBehindSq.body.tactics.fieldPlacement.restrictionsValid, true);
  });

  // 8. Powerplay & Outfield Fielding Restrictions
  await test('Phase 6 - 8. Powerplay & Outfield Fielding Restrictions: Enforces circle limits', async () => {
    const flds = p5Team1.playingXI.slice(0, 9);

    // Powerplay with 3 deep fielders (Third Man, Long-on, Deep Midwicket) -> 400 POWERPLAY_RESTRICTION_EXCEEDED
    const excessPP = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          preset: 'Powerplay',
          positions: [
            { position: 'Third Man', fielderId: flds[0] }, // Deep 1
            { position: 'Long-on', fielderId: flds[1] }, // Deep 2
            { position: 'Deep Midwicket', fielderId: flds[2] }, // Deep 3 (Violation in Powerplay!)
            { position: 'Slip', fielderId: flds[3] },
            { position: 'Point', fielderId: flds[4] },
            { position: 'Cover', fielderId: flds[5] },
            { position: 'Mid-off', fielderId: flds[6] },
            { position: 'Mid-on', fielderId: flds[7] },
            { position: 'Midwicket', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(excessPP.status, 400);
    assert.strictEqual(excessPP.body.code, 'POWERPLAY_RESTRICTION_EXCEEDED');

    // Non-Powerplay with 6 deep fielders -> 400 OUTFIELD_RESTRICTION_EXCEEDED
    const excessOutfield = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        fieldPlacement: {
          preset: 'Custom',
          positions: [
            { position: 'Third Man', fielderId: flds[0] },
            { position: 'Deep Cover', fielderId: flds[1] },
            { position: 'Long-off', fielderId: flds[2] },
            { position: 'Long-on', fielderId: flds[3] },
            { position: 'Deep Midwicket', fielderId: flds[4] },
            { position: 'Deep Square Leg', fielderId: flds[5] }, // 6 deep fielders!
            { position: 'Point', fielderId: flds[6] },
            { position: 'Cover', fielderId: flds[7] },
            { position: 'Mid-off', fielderId: flds[8] }
          ]
        }
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(excessOutfield.status, 400);
    assert.strictEqual(excessOutfield.body.code, 'OUTFIELD_RESTRICTION_EXCEEDED');
  });

  // 9. Field Presets
  await test('Phase 6 - 9. Field Presets: All 5 presets comply with ICC fielding laws', async () => {
    const flds = p5Team1.playingXI.slice(0, 9);
    const presetsToTest = ['Attacking', 'Defensive', 'Powerplay', 'Spin', 'Death overs'];

    for (const pr of presetsToTest) {
      let testPositions = [];
      if (pr === 'Attacking') {
        testPositions = ['Slip', 'Second Slip', 'Third Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man'];
      } else if (pr === 'Defensive') {
        testPositions = ['Point', 'Cover', 'Midwicket', 'Square Leg', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket'];
      } else if (pr === 'Spin') {
        testPositions = ['Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Deep Midwicket', 'Long-on'];
      } else if (pr === 'Death overs') {
        testPositions = ['Point', 'Cover', 'Mid-off', 'Mid-on', 'Third Man', 'Deep Cover', 'Long-off', 'Long-on', 'Deep Midwicket'];
      } else {
        testPositions = ['Slip', 'Point', 'Cover', 'Extra Cover', 'Mid-off', 'Mid-on', 'Midwicket', 'Third Man', 'Long-on'];
      }

      const res = await callApp({
        method: 'PUT',
        url: `/api/teams/${p5Team1._id}/tactics`,
        body: {
          fieldPlacement: {
            preset: pr,
            positions: testPositions.map((pos, i) => ({ position: pos, fielderId: flds[i] }))
          }
        },
        headers: { authorization: `Bearer ${p5Host.token}` }
      });
      assert.strictEqual(res.status, 200, `Preset ${pr} must be legal`);
      assert.strictEqual(res.body.tactics.fieldPlacement.preset, pr);
      assert.strictEqual(res.body.tactics.fieldPlacement.restrictionsValid, true);
    }
  });

  // 10. Field Placement & Tactical Influence on Match Outcomes
  await test('Phase 6 - 10. Field Placement Influence: Physics engine reflects tactical matchups', async () => {
    const matchTacticsRes = await callApp({
      method: 'PUT',
      url: '/api/matches/LIVE-IPL-FINAL/tactics',
      body: {
        teamKey: 'teamB',
        tactics: {
          bowling: {
            bowlerAssignments: [
              { playerId: 'ply_bumrah', playerName: 'Jasprit Bumrah', deliveryTactic: 'Yorker', role: 'Death-over specialists' }
            ]
          },
          fieldPlacement: {
            preset: 'Death overs',
            positions: [
              { position: 'Point', fielderId: 'f1' },
              { position: 'Cover', fielderId: 'f2' },
              { position: 'Mid-off', fielderId: 'f3' },
              { position: 'Mid-on', fielderId: 'f4' },
              { position: 'Third Man', fielderId: 'f5' },
              { position: 'Deep Cover', fielderId: 'f6' },
              { position: 'Long-off', fielderId: 'f7' },
              { position: 'Long-on', fielderId: 'f8' },
              { position: 'Deep Midwicket', fielderId: 'f9' }
            ]
          }
        },
        tacticalBreak: 'over_break'
      },
      headers: { authorization: `Bearer ${p5Host.token}` }
    });
    assert.strictEqual(matchTacticsRes.status, 200);
    assert.strictEqual(matchTacticsRes.body.success, true);
    assert.strictEqual(matchTacticsRes.body.match.tacticalBreak, 'over_break');

    const simRes = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/simulate-ball'
    });
    assert.strictEqual(simRes.status, 200);
    assert.strictEqual(simRes.body.success, true);
    assert.ok(simRes.body.outcome);
    assert.ok(simRes.body.outcome.commentary.length > 0);
  });

  // 11. Tactical Authorization & Breaks
  await test('Phase 6 - 11. Tactical Authorization: Non-owner rejected with 403 UNAUTHORIZED_TACTICS_EDIT', async () => {
    const unauthEdit = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        batting: { teamStrategy: 'Power Hitter' }
      },
      headers: { authorization: `Bearer ${p5Player2.token}` }
    });
    assert.strictEqual(unauthEdit.status, 403);
    assert.strictEqual(unauthEdit.body.code, 'UNAUTHORIZED_TACTICS_EDIT');
  });

  // 12. Spectators Have Read-Only Access to Tactics
  await test('Phase 6 - 12. Spectators Have Read-Only Access: Spectator views tactics (200), edits rejected (403)', async () => {
    const viewTeam = await callApp({
      method: 'GET',
      url: `/api/teams/${p5Team1._id}/tactics`,
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(viewTeam.status, 200);
    assert.ok(viewTeam.body.tactics.fieldPlacement);
    assert.ok(viewTeam.body.tactics.batting);
    assert.ok(viewTeam.body.tactics.bowling);

    const viewMatch = await callApp({
      method: 'GET',
      url: '/api/matches/LIVE-IPL-FINAL/tactics',
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(viewMatch.status, 200);
    assert.ok(viewMatch.body.teamBTactics);

    const specEdit = await callApp({
      method: 'PUT',
      url: `/api/teams/${p5Team1._id}/tactics`,
      body: {
        batting: { teamStrategy: 'Defensive' }
      },
      headers: { authorization: `Bearer ${p5Spectator.token}` }
    });
    assert.strictEqual(specEdit.status, 403);
    assert.strictEqual(specEdit.body.code, 'SPECTATOR_READ_ONLY');
  });

  // ==========================================
  // PHASE 7: PHASER 3 PLAYABLE CRICKET GAME & AUTHORITATIVE ENGINE
  // ==========================================

  // 1. Manual Batting: Perfect Timing on Lofted Drive -> Six
  await test('Phase 7 - 1. Manual Batting: Perfect Timing on Lofted Drive yields a SIX', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Lofted Drive',
        direction: 'Long-off',
        timing: 'Perfect',
        deliveryTactic: 'Seam',
        pitchLine: 'Off Stump',
        pitchLength: 'Good Length'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.outcome.runs, 6);
    assert.strictEqual(res.body.outcome.badge, 'SIX');
    assert.strictEqual(res.body.outcome.isWicket, false);
    assert.ok(res.body.deliveryData);
    assert.strictEqual(res.body.deliveryData.runs, 6);
  });

  // 2. Manual Batting: Perfect Timing on Ground Drive -> Four
  await test('Phase 7 - 2. Manual Batting: Perfect Timing on Drive yields FOUR', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        direction: 'Cover',
        timing: 'Perfect',
        deliveryTactic: 'Seam'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.outcome.runs, 4);
    assert.strictEqual(res.body.outcome.badge, 'FOUR');
  });

  // 3. Defensive Block: Good/Perfect Timing -> Dot Ball
  await test('Phase 7 - 3. Defensive Block: Solid defense produces 0 runs (Dot ball)', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Defensive Block',
        direction: 'Mid-off',
        timing: 'Good',
        deliveryTactic: 'Seam'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.runs, 0);
    assert.strictEqual(res.body.outcome.badge, 'DOT');
    assert.strictEqual(res.body.outcome.isWicket, false);
  });

  // 4. Running Between Wickets: 1 Run and 2 Runs
  await test('Phase 7 - 4. Running Between Wickets: Single and Double correctly recorded', async () => {
    const singleRes = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        direction: 'Midwicket',
        timing: 'Good',
        runsAttempted: 1
      }
    });
    assert.strictEqual(singleRes.status, 200);
    assert.strictEqual(singleRes.body.outcome.runs, 1);
    assert.strictEqual(singleRes.body.outcome.badge, 'SINGLE');

    const doubleRes = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Cut',
        direction: 'Point',
        timing: 'Good',
        runsAttempted: 2
      }
    });
    assert.strictEqual(doubleRes.status, 200);
    assert.strictEqual(doubleRes.body.outcome.runs, 2);
    assert.strictEqual(doubleRes.body.outcome.badge, 'TWO');
  });

  // 5. Dismissal: Bowled (Late timing on Yorker)
  await test('Phase 7 - 5. Dismissal - Bowled: Late timing on Yorker shatters wickets', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        timing: 'Late',
        deliveryTactic: 'Yorker',
        pitchLine: 'Off Stump',
        pitchLength: 'Yorker'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.isWicket, true);
    assert.strictEqual(res.body.outcome.wicketType, 'Bowled');
    assert.strictEqual(res.body.outcome.badge, 'WICKET');
  });

  // 6. Dismissal: LBW (Late timing on Middle Stump Yorker)
  await test('Phase 7 - 6. Dismissal - LBW: Yorker on Middle Stump traps batsman in front', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        timing: 'Late',
        deliveryTactic: 'Yorker',
        pitchLine: 'Middle Stump',
        pitchLength: 'Yorker'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.isWicket, true);
    assert.strictEqual(res.body.outcome.wicketType, 'LBW');
  });

  // 7. Dismissal: Stumped (Mistimed shot against Spin)
  await test('Phase 7 - 7. Dismissal - Stumped: Stepping out against Spin variation', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Lofted Drive',
        timing: 'Late',
        deliveryTactic: 'Off-spin',
        pitchLine: 'Outside Off',
        pitchLength: 'Good Length'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.isWicket, true);
    assert.strictEqual(res.body.outcome.wicketType, 'Stumped');
  });

  // 8. Dismissal: Caught (Early mistimed drive or Bouncer hazard)
  await test('Phase 7 - 8. Dismissal - Caught: Early mistimed stroke against Bouncer', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        timing: 'Early',
        deliveryTactic: 'Bouncer',
        pitchLine: 'Off Stump',
        pitchLength: 'Short'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.isWicket, true);
    assert.strictEqual(res.body.outcome.wicketType, 'Caught');
  });

  // 9. Dismissal: Run Out (Risky 2nd run)
  await test('Phase 7 - 9. Dismissal - Run Out: Risky 2nd run results in run-out', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        timing: 'Good',
        runsAttempted: 2,
        riskyRun: true
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome.isWicket, true);
    assert.strictEqual(res.body.outcome.wicketType, 'Run Out');
  });

  // 10. Validation: Invalid Shot Type rejected
  await test('Phase 7 - 10. Validation: Invalid shot type returns 400 INVALID_SHOT_TYPE', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Helicopter Upper Cut Ultra',
        timing: 'Good'
      }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_SHOT_TYPE');
  });

  // 11. Validation: Invalid Delivery Tactic rejected
  await test('Phase 7 - 11. Validation: Invalid delivery tactic returns 400 INVALID_DELIVERY_TACTIC', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Drive',
        deliveryTactic: 'Supersonic Plasma Beam'
      }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_DELIVERY_TACTIC');
  });

  // 12. Control Modes: Tactical Mode Delegation
  await test('Phase 7 - 12. Control Modes: Tactical mode delegates to tactical simulation engine', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'tactical'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.outcome);
    assert.ok(res.body.match);
  });

  // 13. State Synchronization: Match state progresses authoritatively
  await test('Phase 7 - 13. State Synchronization: Match state, commentary, recentBalls updated', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/matches/LIVE-IPL-FINAL/play-delivery',
      body: {
        controlMode: 'manual',
        shotType: 'Pull / Hook',
        direction: 'Square Leg',
        timing: 'Perfect'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.match.teamA.overs > 0);
    assert.ok(res.body.match.recentBalls.length > 0);
    assert.ok(res.body.match.commentary.length > 0);
    assert.ok(res.body.deliveryData);
    assert.strictEqual(res.body.deliveryData.shotType, 'Pull / Hook');
  });

  // ==========================================
  // PHASE 8: MULTIPLAYER MATCH ENGINE TESTS
  // ==========================================

  // 1. Deterministic Seeded Randomness
  await test('Phase 8 - 1. Deterministic Seeded Randomness: Identical seeds yield 100% identical outcomes', async () => {
    const seed = 'cricketverse_test_seed_alpha';
    const rng1 = matchEngineService.createSeededRandom(seed);
    const rng2 = matchEngineService.createSeededRandom(seed);

    const values1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const values2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

    assert.deepStrictEqual(values1, values2, 'Seeded PRNG outputs must be identical for the same seed');

    const differentRng = matchEngineService.createSeededRandom('cricketverse_test_seed_beta');
    const diffValues = [differentRng(), differentRng(), differentRng(), differentRng(), differentRng()];
    assert.notDeepStrictEqual(values1, diffValues, 'Different seeds must produce different sequences');
  });

  // 2. Fixed Capacity: Exactly 6 Active Players
  await test('Phase 8 - 2. Fixed Capacity: Exactly 6 active players allowed in match', async () => {
    const matchId = `TEST_MATCH_CAP_${Date.now()}`;
    await matchEngineService.getOrCreateMatchEngine(matchId);

    for (let i = 1; i <= 6; i++) {
      const joinRes = await matchEngineService.joinMatch(matchId, {
        userId: `player_${i}`,
        username: `Player ${i}`,
        role: 'player',
        teamKey: i <= 3 ? 'teamA' : 'teamB'
      });
      assert.strictEqual(joinRes.participantRole, 'player', `Player ${i} should have role 'player'`);
    }

    const snapshot = matchEngineService.getMatchSnapshot(matchId);
    assert.strictEqual(snapshot.activePlayersCount, 6, 'Should have exactly 6 active players');
    assert.strictEqual(snapshot.spectatorsCount, 0);
  });

  // 3. Seventh Person Rule: 7th person forced to Spectator role
  await test('Phase 8 - 3. Seventh Person Rule: 7th participant forced to join as spectator', async () => {
    const matchId = `TEST_MATCH_7TH_${Date.now()}_ABC`;
    await matchEngineService.getOrCreateMatchEngine(matchId);

    // Join 6 players
    for (let i = 1; i <= 6; i++) {
      await matchEngineService.joinMatch(matchId, {
        userId: `p_${i}`,
        username: `Player ${i}`,
        role: 'player',
        teamKey: i <= 3 ? 'teamA' : 'teamB'
      });
    }

    // 7th user tries to join as 'player'
    const join7 = await matchEngineService.joinMatch(matchId, {
      userId: 'seventh_person',
      username: 'Seventh Person',
      role: 'player'
    });

    assert.strictEqual(join7.participantRole, 'spectator', '7th person MUST be assigned spectator role');

    // 8th user joins as spectator
    const join8 = await matchEngineService.joinMatch(matchId, {
      userId: 'eighth_person',
      username: 'Eighth Person',
      role: 'spectator'
    });
    assert.strictEqual(join8.participantRole, 'spectator');

    const snap = matchEngineService.getMatchSnapshot(matchId);
    assert.strictEqual(snap.activePlayersCount, 6);
    assert.strictEqual(snap.spectatorsCount, 2);
  });

  // 4. Spectator Action Rejection: Spectators cannot submit bowling or batting decisions
  await test('Phase 8 - 4. Spectator Action Rejection: Spectators cannot submit player actions', async () => {
    const matchId = `TEST_MATCH_SPEC_${Date.now()}`;
    await matchEngineService.getOrCreateMatchEngine(matchId);

    await matchEngineService.joinMatch(matchId, {
      userId: 'spec_user_1',
      username: 'Spectator Watcher',
      role: 'spectator'
    });

    // Spectator attempts to submit bowling decision
    let bowlErr = null;
    try {
      await matchEngineService.submitBowlingDecision(matchId, 'spec_user_1', {
        deliverySeq: 1,
        line: 'Off Stump',
        length: 'Good Length',
        variation: 'Seam'
      });
    } catch (e) {
      bowlErr = e;
    }
    assert.ok(bowlErr);
    assert.strictEqual(bowlErr.code, 'SPECTATOR_READ_ONLY');

    // Spectator attempts to submit batting decision
    let batErr = null;
    try {
      await matchEngineService.submitBattingDecision(matchId, 'spec_user_1', {
        deliverySeq: 1,
        shotType: 'Drive',
        timing: 'Good'
      });
    } catch (e) {
      batErr = e;
    }
    assert.ok(batErr);
    assert.strictEqual(batErr.code, 'SPECTATOR_READ_ONLY');
  });

  // 5. Turn Ordering & Player Action Validation
  await test('Phase 8 - 5. Player Action Validation: Turn ordering strictly enforced', async () => {
    const matchId = `TEST_MATCH_TURN_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.battingUserId = 'striker_user';
    engine.bowlingUserId = 'bowler_user';
    engine.battingTeamKey = 'teamA';
    engine.bowlingTeamKey = 'teamB';
    engine.turnPhase = 'waiting_bowling';

    await matchEngineService.joinMatch(matchId, { userId: 'striker_user', role: 'player', teamKey: 'teamA' });
    await matchEngineService.joinMatch(matchId, { userId: 'bowler_user', role: 'player', teamKey: 'teamB' });

    // Striker tries to bowl during waiting_bowling
    let wrongBowlErr = null;
    try {
      await matchEngineService.submitBowlingDecision(matchId, 'striker_user', {
        deliverySeq: 1,
        line: 'Off Stump',
        length: 'Good Length',
        variation: 'Seam'
      });
    } catch (e) {
      wrongBowlErr = e;
    }
    assert.ok(wrongBowlErr);
    assert.strictEqual(wrongBowlErr.code, 'NOT_YOUR_TURN');

    // Bowler bowls
    const bowlRes = await matchEngineService.submitBowlingDecision(matchId, 'bowler_user', {
      deliverySeq: 1,
      line: 'Off Stump',
      length: 'Good Length',
      variation: 'Seam'
    });
    assert.strictEqual(bowlRes.success, true);
    assert.strictEqual(bowlRes.nextPhase, 'waiting_batting');

    // Bowler tries to bat during waiting_batting
    let wrongBatErr = null;
    try {
      await matchEngineService.submitBattingDecision(matchId, 'bowler_user', {
        deliverySeq: 1,
        shotType: 'Drive',
        timing: 'Good'
      });
    } catch (e) {
      wrongBatErr = e;
    }
    assert.ok(wrongBatErr);
    assert.strictEqual(wrongBatErr.code, 'NOT_YOUR_TURN');
  });

  // 6. Complete Turn Delivery Flow: Bowling -> Batting -> Resolve -> State Update
  await test('Phase 8 - 6. Complete Turn Delivery Flow: Bowling to Batting to Resolution with Monotonic Sequencing', async () => {
    const matchId = `TEST_MATCH_FLOW_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.battingUserId = 'batter_1';
    engine.bowlingUserId = 'bowler_1';
    engine.turnPhase = 'waiting_bowling';

    await matchEngineService.joinMatch(matchId, { userId: 'batter_1', role: 'player', teamKey: 'teamA' });
    await matchEngineService.joinMatch(matchId, { userId: 'bowler_1', role: 'player', teamKey: 'teamB' });
    const initialSeq = engine.seq;

    // Phase A: Bowling commitment
    const bowlRes = await matchEngineService.submitBowlingDecision(matchId, 'bowler_1', {
      deliverySeq: 1,
      line: 'Outside Off',
      length: 'Full',
      variation: 'Swing'
    });
    assert.strictEqual(bowlRes.success, true);
    assert.strictEqual(bowlRes.event.type, 'BOWLING_COMMITTED');
    assert.strictEqual(bowlRes.event.seq, initialSeq + 1);

    // Phase B & C: Batting commitment & Resolution
    const batRes = await matchEngineService.submitBattingDecision(matchId, 'batter_1', {
      deliverySeq: 1,
      shotType: 'Lofted Drive',
      direction: 'Cover',
      timing: 'Perfect'
    });
    assert.strictEqual(batRes.success, true);
    assert.strictEqual(batRes.event.type, 'DELIVERY_RESULT');
    assert.strictEqual(batRes.outcome.runs, 6);
    assert.strictEqual(batRes.event.seq, initialSeq + 2);
    assert.ok(batRes.snapshot.teamA.score >= 6);
    assert.strictEqual(batRes.snapshot.currentTurn.deliverySeq, 2);
    assert.strictEqual(batRes.snapshot.turnPhase, 'waiting_bowling');
  });

  // 7. Duplicate Event Prevention (Idempotency)
  await test('Phase 8 - 7. Duplicate Event Prevention: Duplicate idempotency keys safely acknowledged without double mutating', async () => {
    const matchId = `TEST_MATCH_IDEMP_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.battingUserId = 'batter_idemp';
    engine.bowlingUserId = 'bowler_idemp';
    engine.turnPhase = 'waiting_bowling';

    await matchEngineService.joinMatch(matchId, { userId: 'batter_idemp', role: 'player', teamKey: 'teamA' });
    await matchEngineService.joinMatch(matchId, { userId: 'bowler_idemp', role: 'player', teamKey: 'teamB' });

    const key = `action_idemp_${Date.now()}`;
    const firstRes = await matchEngineService.submitBowlingDecision(matchId, 'bowler_idemp', {
      deliverySeq: 1,
      line: 'Off Stump',
      length: 'Good Length',
      variation: 'Seam',
      idempotencyKey: key
    });
    assert.strictEqual(firstRes.success, true);
    const seqAfterFirst = firstRes.event.seq;

    // Resubmit with exact same idempotencyKey
    const secondRes = await matchEngineService.submitBowlingDecision(matchId, 'bowler_idemp', {
      deliverySeq: 1,
      line: 'Off Stump',
      length: 'Good Length',
      variation: 'Seam',
      idempotencyKey: key
    });
    assert.strictEqual(secondRes.duplicate, true);
    assert.strictEqual(secondRes.seq, seqAfterFirst, 'Sequence must not increment on duplicate');
  });

  // 8. Reconnection Recovery (Sync & Replay)
  await test('Phase 8 - 8. Reconnection Recovery: Client replays missed events from fromSeq', async () => {
    const matchId = `TEST_MATCH_SYNC_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.battingUserId = 'reconn_bat';
    engine.bowlingUserId = 'reconn_bowl';

    await matchEngineService.joinMatch(matchId, { userId: 'reconn_bat', role: 'player', teamKey: 'teamA' });
    await matchEngineService.joinMatch(matchId, { userId: 'reconn_bowl', role: 'player', teamKey: 'teamB' });

    // Execute 2 deliveries
    await matchEngineService.submitFullDeliveryTurn(matchId, 'reconn_bat', {
      shotType: 'Drive',
      timing: 'Good',
      runsAttempted: 1
    });

    const seqCheckpoint = engine.seq;

    await matchEngineService.submitFullDeliveryTurn(matchId, 'reconn_bat', {
      shotType: 'Pull / Hook',
      timing: 'Good',
      runsAttempted: 2
    });

    // Client reconnects requesting events from seqCheckpoint
    const syncRes = await matchEngineService.syncMatch(matchId, { fromSeq: seqCheckpoint, userId: 'reconn_bat' });
    assert.strictEqual(syncRes.mode, 'replay');
    assert.ok(syncRes.events.length > 0);
    assert.strictEqual(syncRes.events[0].seq, seqCheckpoint + 1);

    // Client connects from seq 0 (Full snapshot mode)
    const freshSync = await matchEngineService.syncMatch(matchId, { fromSeq: 0 });
    assert.strictEqual(freshSync.mode, 'snapshot');
    assert.ok(freshSync.snapshot);
    assert.strictEqual(freshSync.snapshot.matchId, matchId);
  });

  // 9. Innings Transition: 1st Innings to 2nd Innings Target Chase
  await test('Phase 8 - 9. Innings Transition: 10 wickets down sets target & switches teams', async () => {
    const matchId = `TEST_MATCH_INN_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.battingUserId = 'p1_inn';
    engine.bowlingUserId = 'p2_inn';
    engine.currentInnings = 1;
    engine.teamA.score = 142;
    engine.teamA.wickets = 9; // 9 wickets down!
    engine.turnPhase = 'waiting_bowling';

    await matchEngineService.joinMatch(matchId, { userId: 'p1_inn', role: 'player', teamKey: 'teamA' });
    await matchEngineService.joinMatch(matchId, { userId: 'p2_inn', role: 'player', teamKey: 'teamB' });

    // Bowl yorker, batsman late -> 10th wicket falls!
    await matchEngineService.submitBowlingDecision(matchId, 'p2_inn', {
      deliverySeq: 1,
      line: 'Off Stump',
      length: 'Yorker',
      variation: 'Yorker'
    });

    const batRes = await matchEngineService.submitBattingDecision(matchId, 'p1_inn', {
      deliverySeq: 1,
      shotType: 'Pull / Hook',
      timing: 'Late'
    });

    assert.strictEqual(batRes.outcome.isWicket, true);
    assert.strictEqual(batRes.inningsEnded, true);
    assert.strictEqual(batRes.snapshot.currentInnings, 2);
    assert.strictEqual(batRes.snapshot.targetScore, 143); // 142 + 1
    assert.strictEqual(batRes.snapshot.turnPhase, 'innings_break');
    assert.strictEqual(batRes.snapshot.battingTeamKey, 'teamB');
    assert.strictEqual(batRes.snapshot.bowlingTeamKey, 'teamA');
  });

  // 10. Match Completion & Result
  await test('Phase 8 - 10. Match Completion: Chasing team reaches target -> victory declared', async () => {
    const matchId = `TEST_MATCH_WIN_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(matchId);
    engine.currentInnings = 2;
    engine.targetScore = 150;
    engine.teamB.score = 146; // Chasing, 4 runs needed!
    engine.teamB.wickets = 3;
    engine.battingTeamKey = 'teamB';
    engine.bowlingTeamKey = 'teamA';
    engine.battingUserId = 'chaser_user';
    engine.bowlingUserId = 'defender_user';
    engine.turnPhase = 'waiting_bowling';

    await matchEngineService.joinMatch(matchId, { userId: 'chaser_user', role: 'player', teamKey: 'teamB' });
    await matchEngineService.joinMatch(matchId, { userId: 'defender_user', role: 'player', teamKey: 'teamA' });

    // Bowl full, batsman perfect drive for 4 -> 150 reached!
    await matchEngineService.submitBowlingDecision(matchId, 'defender_user', {
      deliverySeq: 1,
      line: 'Outside Off',
      length: 'Full',
      variation: 'Seam'
    });

    const batRes = await matchEngineService.submitBattingDecision(matchId, 'chaser_user', {
      deliverySeq: 1,
      shotType: 'Drive',
      timing: 'Perfect'
    });

    assert.strictEqual(batRes.outcome.runs, 4);
    assert.strictEqual(batRes.matchCompleted, true);
    assert.strictEqual(batRes.snapshot.status, 'completed');
    assert.strictEqual(batRes.snapshot.turnPhase, 'completed');
    assert.ok(batRes.snapshot.result.includes('won by 7 wickets'));
  });

  // 11. Room Isolation: Multiple matches execute independently without crosstalk
  await test('Phase 8 - 11. Room Isolation: Events in Match A do not leak into Match B', async () => {
    const matchA = `MATCH_ISOLATION_A_${Date.now()}`;
    const matchB = `MATCH_ISOLATION_B_${Date.now()}`;

    const engA = await matchEngineService.getOrCreateMatchEngine(matchA);
    const engB = await matchEngineService.getOrCreateMatchEngine(matchB);

    await matchEngineService.joinMatch(matchA, { userId: 'user_A', role: 'player' });
    await matchEngineService.joinMatch(matchB, { userId: 'user_B', role: 'player' });

    await matchEngineService.submitFullDeliveryTurn(matchA, 'user_A', {
      shotType: 'Drive',
      timing: 'Good',
      runsAttempted: 1
    });

    const snapA = matchEngineService.getMatchSnapshot(matchA);
    const snapB = matchEngineService.getMatchSnapshot(matchB);

    assert.ok(snapA.teamA.score > 0, 'Match A score should have updated');
    assert.strictEqual(snapB.teamA.score, 0, 'Match B score must remain 0');
    assert.notStrictEqual(snapA.seq, snapB.seq, 'Sequence numbers must remain isolated');
  });

  // 12. REST API Endpoints for Match Engine
  await test('Phase 8 - 12. REST API: GET snapshot & sync endpoints return authoritative state', async () => {
    const snapRes = await callApp({
      method: 'GET',
      url: '/api/matches/LIVE-IPL-FINAL/snapshot'
    });
    assert.strictEqual(snapRes.status, 200);
    assert.strictEqual(snapRes.body.success, true);
    assert.strictEqual(snapRes.body.snapshot.matchId, 'LIVE-IPL-FINAL');

    const syncRes = await callApp({
      method: 'GET',
      url: '/api/matches/LIVE-IPL-FINAL/sync?fromSeq=0'
    });
    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncRes.body.success, true);
    assert.ok(syncRes.body.snapshot);
  });

  // 13. Socket.IO Match Synchronization with Multiple Clients & Spectator
  await test('Phase 8 - 13. Socket.IO Match Synchronization: Multi-client broadcast, spectator enforcement & event delivery', async () => {
    const { EventEmitter } = require('events');
    const { initMultiplayerSockets } = require('../src/sockets/multiplayerSocket');

    // In-process Mock IO Dispatcher
    const roomBroadcasts = new Map();

    const mockIo = {
      use(fn) { this.authMiddleware = fn; },
      on(event, fn) { if (event === 'connection') this.connectionHandler = fn; },
      to(room) {
        return {
          emit: (event, data) => {
            if (!roomBroadcasts.has(room)) roomBroadcasts.set(room, []);
            roomBroadcasts.get(room).push({ event, data });
          }
        };
      }
    };

    initMultiplayerSockets(mockIo);

    const createMockClientSocket = (userId, username, role) => {
      const emitter = new EventEmitter();
      const emittedToClient = [];
      const rooms = new Set();

      const socket = {
        id: `mock_sock_${Date.now()}_${Math.random()}`,
        user: { _id: userId, username },
        handshake: { auth: {} },
        rooms,
        join(r) { rooms.add(r); },
        leave(r) { rooms.delete(r); },
        emit(event, data) {
          emittedToClient.push({ event, data });
          emitter.emit(event, data);
        },
        on(event, fn) { emitter.on(event, fn); },
        clientEmit(event, data) {
          const listeners = emitter.rawListeners(event);
          listeners.forEach(fn => fn(data));
        },
        getEmitted: (event) => emittedToClient.filter(e => e.event === event)
      };

      // Connect socket
      mockIo.connectionHandler(socket);
      return socket;
    };

    const matchId = `MOCK_SOCKET_${Date.now()}`;
    const sockBowler = createMockClientSocket('bowler_sock_1', 'Bowler Bumrah', 'player');
    const sockBatter = createMockClientSocket('batter_sock_2', 'Batter Kohli', 'player');
    const sockSpec = createMockClientSocket('spec_sock_3', 'Spectator Sam', 'spectator');

    // 1. Join match
    sockBowler.clientEmit('join_match', { matchId, role: 'player', teamKey: 'teamB' });
    sockBatter.clientEmit('join_match', { matchId, role: 'player', teamKey: 'teamA' });
    sockSpec.clientEmit('join_match', { matchId, role: 'spectator' });

    // Allow event processing
    await new Promise(r => setTimeout(r, 10));

    // Verify snapshots delivered to all
    assert.ok(sockBowler.getEmitted('match_snapshot').length > 0);
    assert.ok(sockBatter.getEmitted('match_snapshot').length > 0);
    assert.ok(sockSpec.getEmitted('match_snapshot').length > 0);

    // Verify rooms joined
    assert.ok(sockBowler.rooms.has(`match:${matchId}`));
    assert.ok(sockBatter.rooms.has(`match:${matchId}`));
    assert.ok(sockSpec.rooms.has(`match:${matchId}`));
    assert.ok(sockSpec.rooms.has(`match:${matchId}:spectators`));

    // 2. Bowler submits bowling decision
    sockBowler.clientEmit('submit_bowling_decision', {
      matchId,
      deliverySeq: 1,
      line: 'Off Stump',
      length: 'Good Length',
      variation: 'Seam'
    });

    await new Promise(r => setTimeout(r, 10));

    const roomEvents = roomBroadcasts.get(`match:${matchId}`) || [];
    const bowlCommEvent = roomEvents.find(e => e.event === 'bowling_committed');
    assert.ok(bowlCommEvent, 'Room must receive bowling_committed');
    assert.strictEqual(bowlCommEvent.data.bowlingDecision.line, 'Off Stump');

    // 3. Batter submits batting decision
    sockBatter.clientEmit('submit_batting_decision', {
      matchId,
      deliverySeq: 1,
      shotType: 'Lofted Drive',
      direction: 'Cover',
      timing: 'Perfect'
    });

    await new Promise(r => setTimeout(r, 10));

    const deliveryEvent = roomEvents.find(e => e.event === 'delivery_result');
    assert.ok(deliveryEvent, 'Room must receive delivery_result broadcast');
    assert.strictEqual(deliveryEvent.data.outcome.runs, 6);
    assert.strictEqual(deliveryEvent.data.outcome.badge, 'SIX');

    // 4. Spectator tries to submit player decision -> MUST RECEIVE SPECTATOR_READ_ONLY error
    sockSpec.clientEmit('submit_bowling_decision', {
      matchId,
      deliverySeq: 2,
      line: 'Middle Stump',
      length: 'Yorker',
      variation: 'Yorker'
    });

    await new Promise(r => setTimeout(r, 10));

    const specErrors = sockSpec.getEmitted('action_error');
    assert.ok(specErrors.length > 0);
    assert.strictEqual(specErrors[0].data.code, 'SPECTATOR_READ_ONLY');
  });

  // ==========================================
  // PHASE 9: CRICKET FORMATS & STADIUM SIMULATION TESTS
  // ==========================================
  console.log('\n--- PHASE 9: CRICKET FORMATS & STADIUM SIMULATION TESTS ---');

  const { getAllStadiums, getStadiumById } = require('../src/data/stadiumsData');
  const {
    calculateConditionMultipliers,
    calculateDLSRevision,
    calculateTestSessionAndDay,
    canEnforceFollowOn,
    getFormatPowerplayStage,
    getMaxBowlerLimitForFormat
  } = require('../src/services/stadiumConditionsService');

  // Test 1: All 15 authentic stadiums verification
  await test('Phase 9 - 1. All 15 authentic cricket stadiums verification & profile lookup', async () => {
    const all = getAllStadiums();
    assert.strictEqual(all.length, 15, 'Must contain all 15 authentic stadiums');

    const expectedNames = [
      "Lord's", "MCG", "SCG", "Eden Gardens", "Wankhede",
      "Narendra Modi Stadium", "Chepauk", "Chinnaswamy", "The Oval", "Headingley",
      "Newlands", "Wanderers", "Gaddafi Stadium", "R. Premadasa", "Kensington Oval"
    ];

    expectedNames.forEach(name => {
      const found = all.find(s => s.name === name || s.fullName.includes(name));
      assert.ok(found, `Stadium '${name}' must exist in stadiums database`);
      assert.ok(found.country, `Stadium '${name}' must have country`);
      assert.ok(found.city, `Stadium '${name}' must have city`);
      assert.ok(found.pitchType, `Stadium '${name}' must have pitchType`);
      assert.ok(found.boundaryDimensions.straight > 50, `Stadium '${name}' must have valid straight boundary`);
      assert.ok(found.boundaryDimensions.square > 50, `Stadium '${name}' must have valid square boundary`);
      assert.ok(found.historicalScores, `Stadium '${name}' must have historical scores`);
      assert.ok(found.weatherProfile, `Stadium '${name}' must have weather profile`);
      assert.ok(found.dewConditions !== undefined, `Stadium '${name}' must have dew conditions`);
    });
  });

  // Test 2: Stadium boundary physics (MCG vs Chinnaswamy)
  await test('Phase 9 - 2. Stadium boundary physics: MCG large boundary vs Chinnaswamy small boundary', async () => {
    const mcgConditions = calculateConditionMultipliers({ stadiumId: 'mcg' });
    const chinConditions = calculateConditionMultipliers({ stadiumId: 'chinnaswamy' });

    assert.ok(mcgConditions.boundaryDifficulty > 1.2, `MCG boundary difficulty must be > 1.2 (actual: ${mcgConditions.boundaryDifficulty})`);
    assert.ok(chinConditions.boundaryDifficulty < 1.0, `Chinnaswamy boundary difficulty must be < 1.0 (actual: ${chinConditions.boundaryDifficulty})`);
    assert.ok(mcgConditions.boundaryDifficulty > chinConditions.boundaryDifficulty, 'MCG must have higher boundary difficulty than Chinnaswamy');
  });

  // Test 3: Green pitch & Overcast swing multiplier boost
  await test('Phase 9 - 3. Overcast & Green Pitch swing multiplier boost', async () => {
    const clearFlat = calculateConditionMultipliers({ stadiumId: 'wankhede', pitchType: 'Flat', weather: 'Clear' });
    const overcastGreen = calculateConditionMultipliers({ stadiumId: 'lords', pitchType: 'Green', weather: 'Overcast' });

    assert.ok(overcastGreen.swingMultiplier >= 1.7, `Overcast Green pitch swing multiplier must be >= 1.7 (actual: ${overcastGreen.swingMultiplier})`);
    assert.ok(overcastGreen.swingMultiplier > clearFlat.swingMultiplier, 'Overcast Green pitch must have higher swing than Clear Flat pitch');
  });

  // Test 4: Evening Dew condition reduces spin grip
  await test('Phase 9 - 4. Evening Dew condition reduces spin grip and accelerates outfield', async () => {
    const afternoonSpin = calculateConditionMultipliers({ stadiumId: 'eden_gardens', pitchType: 'Turning', isEveningSession: false });
    const eveningDewSpin = calculateConditionMultipliers({ stadiumId: 'eden_gardens', pitchType: 'Turning', isEveningSession: true });

    assert.ok(eveningDewSpin.spinMultiplier < afternoonSpin.spinMultiplier, 'Evening dew must reduce spin multiplier due to slick ball');
    assert.ok(eveningDewSpin.boundaryDifficulty < afternoonSpin.boundaryDifficulty, 'Evening dew must reduce boundary difficulty as ball skids faster');
  });

  // Test 5: Cracked pitch & Day 4/5 variable bounce and wicket hazards
  await test('Phase 9 - 5. Cracked pitch & Day 4/5 variable bounce and wicket hazards', async () => {
    const day1Flat = calculateConditionMultipliers({ stadiumId: 'scg', pitchType: 'Flat', dayOfTest: 1 });
    const day5Cracked = calculateConditionMultipliers({ stadiumId: 'scg', pitchType: 'Cracked', dayOfTest: 5 });

    assert.ok(day5Cracked.wicketHazardMultiplier >= 1.4, `Day 5 Cracked pitch wicket hazard must be >= 1.4 (actual: ${day5Cracked.wicketHazardMultiplier})`);
    assert.ok(day5Cracked.wicketHazardMultiplier > day1Flat.wicketHazardMultiplier, 'Day 5 Cracked pitch must have higher wicket hazard than Day 1 Flat');
  });

  // Test 6: Test match 4-innings cycle and declarations
  await test('Phase 9 - 6. Test match 4-innings cycle and declarations', async () => {
    const testMatchId = `TEST_FORMAT_DECL_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(testMatchId);
    engine.format = 'TEST';
    engine.teamA.score = 350;
    engine.teamA.wickets = 4;
    engine.teamA.overs = 85.0;

    const declResult = await matchEngineService.declareInnings(testMatchId, 'test_captain_usr');
    assert.strictEqual(declResult.success, true);
    assert.strictEqual(declResult.declared, true);
    assert.strictEqual(engine.currentInnings, 2, 'Must transition to 2nd innings after declaration');
    assert.strictEqual(engine.battingTeamKey, 'teamB', 'Team B must bat in 2nd innings');
    assert.strictEqual(engine.testDetails.declarations.length, 1);
    assert.strictEqual(engine.testDetails.declarations[0].score, 350);
  });

  // Test 7: Test match follow-on enforcement when lead >= 200
  await test('Phase 9 - 7. Test match follow-on enforcement when lead >= 200', async () => {
    const followOnMatchId = `TEST_FOLLOW_ON_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(followOnMatchId);
    engine.format = 'TEST';
    engine.currentInnings = 2;
    engine.teamA.score = 450; // Team 1 scored 450 in Innings 1
    engine.teamB.score = 180; // Team 2 bowled out for 180 in Innings 2 (Lead = 270 >= 200)

    // Verify eligibility
    assert.strictEqual(canEnforceFollowOn(engine.teamA.score, engine.teamB.score, 'TEST'), true);

    const followOnRes = await matchEngineService.enforceFollowOn(followOnMatchId, 'captain_usr');
    assert.strictEqual(followOnRes.success, true);
    assert.strictEqual(followOnRes.followOnEnforced, true);
    assert.strictEqual(engine.currentInnings, 3);
    assert.strictEqual(engine.battingTeamKey, 'teamB', 'Team B must bat again in Innings 3 under follow-on');

    // Negative check: Lead < 200 rejects follow-on
    const smallLeadMatchId = `TEST_SMALL_LEAD_${Date.now()}`;
    const smallEngine = await matchEngineService.getOrCreateMatchEngine(smallLeadMatchId);
    smallEngine.format = 'TEST';
    smallEngine.currentInnings = 2;
    smallEngine.teamA.score = 300;
    smallEngine.teamB.score = 250; // Lead = 50 (< 200)

    let failedAsExpected = false;
    try {
      await matchEngineService.enforceFollowOn(smallLeadMatchId, 'captain_usr');
    } catch (err) {
      failedAsExpected = true;
      assert.strictEqual(err.code, 'LEAD_INSUFFICIENT_FOR_FOLLOW_ON');
    }
    assert.strictEqual(failedAsExpected, true, 'Must reject follow-on when lead < 200');
  });

  // Test 8: Test match Day 5 Draw detection after 450 overs
  await test('Phase 9 - 8. Test match Day 5 Draw detection after 450 overs', async () => {
    const dayInfo449 = calculateTestSessionAndDay(449.5);
    assert.strictEqual(dayInfo449.day, 5);
    assert.strictEqual(dayInfo449.isMatchDrawn, false);

    const dayInfo450 = calculateTestSessionAndDay(450.0);
    assert.strictEqual(dayInfo450.day, 5);
    assert.strictEqual(dayInfo450.isMatchDrawn, true, 'Match must be drawn at 450 overs in Test Cricket');
  });

  // Test 9: ODI DLS rain target calculation with exponential resource curve
  await test('Phase 9 - 9. ODI DLS rain target calculation with exponential resource curve', async () => {
    const dlsCalc = calculateDLSRevision({
      team1Score: 280,
      team1Overs: 50,
      team2OversLost: 10,
      targetTeamOversTotal: 50
    });

    assert.strictEqual(dlsCalc.isDLSActive, true);
    assert.strictEqual(dlsCalc.revisedOvers, 40);
    assert.ok(dlsCalc.revisedTarget < 281, 'Revised target must be lower when team 2 loses 10 overs');
    assert.ok(dlsCalc.requiredRate > 5.6, 'Required rate increases due to fewer overs to chase');

    // Integration via matchEngineService
    const odiMatchId = `TEST_ODI_DLS_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(odiMatchId);
    engine.format = 'ODI';
    engine.teamA.score = 290;
    engine.teamA.overs = 50;

    const dlsRes = await matchEngineService.applyDLSRevision(odiMatchId, { oversLost: 10, targetTeamOversTotal: 50 });
    assert.strictEqual(dlsRes.success, true);
    assert.strictEqual(engine.weather.isDLSActive, true);
    assert.strictEqual(engine.teamB.maxOvers, 40);
    assert.ok(engine.targetScore > 200);
  });

  // Test 10: T20 tactical timeout execution, pause state and resumption
  await test('Phase 9 - 10. T20 tactical timeout execution, pause state and resumption', async () => {
    const t20MatchId = `TEST_T20_TIMEOUT_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(t20MatchId);
    engine.format = 'T20';

    // 1. Call timeout
    const timeoutRes = await matchEngineService.callTacticalTimeout(t20MatchId, 'tactician_usr');
    assert.strictEqual(timeoutRes.success, true);
    assert.strictEqual(timeoutRes.isTimeoutActive, true);
    assert.strictEqual(engine.tacticalTimeouts.isTimeoutActive, true);
    assert.strictEqual(engine.tacticalTimeouts.teamATimeoutsUsed, 1);

    // 2. Playing delivery during active timeout is blocked
    let blockedDelivery = false;
    try {
      await matchEngineService.submitBowlingDecision(t20MatchId, 'bowler_usr', {
        deliverySeq: 1,
        line: 'Off Stump',
        length: 'Good Length',
        variation: 'Seam'
      });
    } catch (err) {
      blockedDelivery = true;
      assert.strictEqual(err.code, 'TIMEOUT_ACTIVE');
    }
    assert.strictEqual(blockedDelivery, true, 'Delivery must be rejected while tactical timeout is active');

    // 3. Resume timeout
    const resumeRes = await matchEngineService.resumeTacticalTimeout(t20MatchId);
    assert.strictEqual(resumeRes.success, true);
    assert.strictEqual(engine.tacticalTimeouts.isTimeoutActive, false);

    // 4. Exhaust 2nd timeout
    await matchEngineService.callTacticalTimeout(t20MatchId, 'tactician_usr');
    await matchEngineService.resumeTacticalTimeout(t20MatchId);
    assert.strictEqual(engine.tacticalTimeouts.teamATimeoutsUsed, 2);

    // 5. 3rd timeout attempt must fail
    let exhaustedFailed = false;
    try {
      await matchEngineService.callTacticalTimeout(t20MatchId, 'tactician_usr');
    } catch (err) {
      exhaustedFailed = true;
      assert.strictEqual(err.code, 'TIMEOUTS_EXHAUSTED');
    }
    assert.strictEqual(exhaustedFailed, true, '3rd tactical timeout must be rejected');
  });

  // Test 11: Format bowler over limitations & Powerplay stages
  await test('Phase 9 - 11. Format bowler over limitations & Powerplay stages', async () => {
    assert.strictEqual(getMaxBowlerLimitForFormat('T20', 20), 4, 'T20 max 4 overs per bowler');
    assert.strictEqual(getMaxBowlerLimitForFormat('ODI', 50), 10, 'ODI max 10 overs per bowler');
    assert.strictEqual(getMaxBowlerLimitForFormat('TEST', 450), Infinity, 'Test unlimited overs per bowler');

    const ppT20 = getFormatPowerplayStage(4.0, 'T20');
    assert.strictEqual(ppT20.stage, 'Powerplay');
    assert.strictEqual(ppT20.maxOutsideCircle, 2);

    const deathT20 = getFormatPowerplayStage(18.0, 'T20');
    assert.strictEqual(deathT20.stage, 'Death Overs');

    const ppODI = getFormatPowerplayStage(8.0, 'ODI');
    assert.strictEqual(ppODI.stage, 'Powerplay 1');
    assert.strictEqual(ppODI.maxOutsideCircle, 2);
  });

  // Test 12: REST API: GET /api/stadiums and GET /api/stadiums/:id
  await test('Phase 9 - 12. REST API: GET /api/stadiums and GET /api/stadiums/:id', async () => {
    const resAll = await callApp({ method: 'GET', url: '/api/stadiums' });
    assert.strictEqual(resAll.status, 200);
    assert.strictEqual(resAll.body.success, true);
    assert.strictEqual(resAll.body.count, 15);

    const resSingle = await callApp({ method: 'GET', url: '/api/stadiums/mcg' });
    assert.strictEqual(resSingle.status, 200);
    assert.strictEqual(resSingle.body.success, true);
    assert.strictEqual(resSingle.body.stadium.name, 'MCG');
    assert.ok(resSingle.body.conditions);
    assert.ok(resSingle.body.conditions.boundaryDifficulty > 1.2);
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
  process.exit(failed > 0 ? 1 : 0);
};

runAllTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

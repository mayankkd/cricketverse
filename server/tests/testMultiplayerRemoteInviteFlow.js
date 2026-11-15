process.env.DISABLE_RATE_LIMIT = 'true';
const assert = require('assert');
const { Readable, Duplex } = require('stream');
const http = require('http');
const { app, io } = require('../src/server');
const storeService = require('../src/services/storeService');
const { signToken } = require('../src/config/jwt');

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
      resolve({
        status: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : res._headers,
        contentType: res.getHeader('content-type'),
        body: parsed,
        raw
      });
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
  const user = await storeService.createUser({
    username,
    email: `${username.toLowerCase()}_${Date.now()}@cricketverse.com`,
    password: 'password123'
  });
  const token = signToken({ id: user._id });
  return { ...user, token };
};

async function runMultiplayerTests() {
  console.log('🏏 --- CRICKETVERSE MULTIPLAYER INVITATION & REMOTE JOINING SUITE --- 🏏\n');

  // Test 1: Network Info API
  console.log('1. Checking Network Discovery API (GET /api/network-info)...');
  const netInfo = await callApp({ method: 'GET', url: '/api/network-info' });
  assert.strictEqual(netInfo.status, 200);
  assert.ok(netInfo.body.lanIp, 'Must return host machine LAN IP');
  assert.strictEqual(netInfo.body.serverPort, 5001);
  console.log(`  ✓ Host LAN IP detected: ${netInfo.body.lanIp} (Server Port: ${netInfo.body.serverPort})\n`);

  // Test 2: Host Creates Room
  console.log('2. Host Creates T20 Room...');
  const uHost = await createTestUser('HostAlpha');
  const createRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${uHost.token}` },
    body: {
      name: 'Global Champions Arena',
      format: 'T20',
      stadiumId: 'lords',
      teamName: 'Host Alpha Royals XI',
      allowSpectators: true
    }
  });
  assert.strictEqual(createRes.status, 201);
  const room = createRes.body.room;
  assert.ok(room.roomCode);
  assert.strictEqual(room.activePlayerCount, 1);
  assert.strictEqual(room.spectatorCount, 0);
  console.log(`  ✓ Room created with code: ${room.roomCode}, Purse: ${room.auctionPurse}\n`);

  // Test 3: Generate Shareable Invitation Link
  console.log('3. Validating Shareable Invitation Link Generation...');
  const invRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${room.roomCode}/invitations`,
    headers: { authorization: `Bearer ${uHost.token}` },
    body: { expiresInHours: 24 }
  });
  assert.strictEqual(invRes.status, 200);
  const inviteToken = invRes.body.invitation.token;
  assert.ok(inviteToken.startsWith('inv_'));
  const sampleLanUrl = `http://${netInfo.body.lanIp}:5173/rooms/invite/${inviteToken}`;
  const samplePublicUrl = `https://cricketverse.app/rooms/invite/${inviteToken}`;
  console.log(`  ✓ Shareable Token: ${inviteToken}`);
  console.log(`  ✓ LAN Wi-Fi Format:   ${sampleLanUrl}`);
  console.log(`  ✓ Public Web Format:  ${samplePublicUrl}\n`);

  // Test 4: Another User Opens Invitation Preview
  console.log('4. Friend Opens Invitation Preview (GET /api/rooms/invitation/:token)...');
  const previewRes = await callApp({
    method: 'GET',
    url: `/api/rooms/invitation/${inviteToken}`
  });
  assert.strictEqual(previewRes.status, 200);
  assert.strictEqual(previewRes.body.room.roomCode, room.roomCode);
  assert.strictEqual(previewRes.body.room.name, 'Global Champions Arena');
  assert.strictEqual(previewRes.body.room.activePlayersCount, 1);
  assert.strictEqual(previewRes.body.room.spectatorsCount, 0);
  console.log(`  ✓ Invitation verified: Room=${previewRes.body.room.name}, Active Players=${previewRes.body.room.activePlayersCount}/6\n`);

  // Test 5: Friend (Player 2) Joins as Player via Invite Link
  console.log('5. Player 2 Joins as Player via Invite Token...');
  const uPlayer2 = await createTestUser('PlayerBravo');
  const join2Res = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${uPlayer2.token}` },
    body: {
      role: 'player',
      teamName: 'Bravo Strikers XI'
    }
  });
  assert.strictEqual(join2Res.status, 200);
  assert.strictEqual(join2Res.body.room.activePlayerCount, 2);
  assert.strictEqual(join2Res.body.participant.role, 'player');
  console.log(`  ✓ Player 2 joined successfully. Active Players: ${join2Res.body.room.activePlayerCount}/6\n`);

  // Test 6: Verify Game is Now Eligible to Start (Min 2 Players)
  console.log('6. Verifying Game can Start with 2 Active Players...');
  const startRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${room.roomCode}/start`,
    headers: { authorization: `Bearer ${uHost.token}` }
  });
  assert.strictEqual(startRes.status, 200);
  assert.strictEqual(startRes.body.room.status, 'auction');
  console.log('  ✓ Game started successfully once 2 active players joined!\n');

  // Test 7: Another User Joins as Spectator via Invite Link
  console.log('7. Friend Joins as Spectator via Invite Token...');
  const uSpectator = await createTestUser('ScoutCharlie');
  const joinSpecRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${uSpectator.token}` },
    body: {
      role: 'spectator',
      teamName: 'Scout Dugout'
    }
  });
  assert.strictEqual(joinSpecRes.status, 200);
  assert.strictEqual(joinSpecRes.body.participant.role, 'spectator');
  assert.strictEqual(joinSpecRes.body.room.spectatorCount, 1);
  assert.strictEqual(joinSpecRes.body.room.activePlayerCount, 2, 'Spectator must NOT take a player slot');
  console.log(`  ✓ Spectator joined: Spectator Count=${joinSpecRes.body.room.spectatorCount}, Active Players=${joinSpecRes.body.room.activePlayerCount}/6\n`);

  // Test 8: Fill Remaining Slots (Players 3, 4, 5, 6)
  console.log('8. Filling Player Slots 3, 4, 5, 6...');
  const uPlayer3 = await createTestUser('PlayerDelta');
  const uPlayer4 = await createTestUser('PlayerEcho');
  const uPlayer5 = await createTestUser('PlayerFoxtrot');
  const uPlayer6 = await createTestUser('PlayerGolf');

  await callApp({ method: 'POST', url: `/api/rooms/join-invite/${inviteToken}`, headers: { authorization: `Bearer ${uPlayer3.token}` }, body: { role: 'player' } });
  await callApp({ method: 'POST', url: `/api/rooms/join-invite/${inviteToken}`, headers: { authorization: `Bearer ${uPlayer4.token}` }, body: { role: 'player' } });
  await callApp({ method: 'POST', url: `/api/rooms/join-invite/${inviteToken}`, headers: { authorization: `Bearer ${uPlayer5.token}` }, body: { role: 'player' } });
  const join6Res = await callApp({ method: 'POST', url: `/api/rooms/join-invite/${inviteToken}`, headers: { authorization: `Bearer ${uPlayer6.token}` }, body: { role: 'player' } });

  assert.strictEqual(join6Res.status, 200);
  assert.strictEqual(join6Res.body.room.activePlayerCount, 6, 'All 6 player slots must now be occupied');
  console.log('  ✓ 6th player joined. Capacity full: 6 / 6 active players.\n');

  // Test 9: Seventh Person Rule — 7th user CANNOT join as player
  console.log('9. Testing 7th Person Rule: 7th User Cannot Join as Player...');
  const uCandidate7 = await createTestUser('PersonSeven');
  const join7PlayerRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${uCandidate7.token}` },
    body: { role: 'player' }
  });
  assert.strictEqual(join7PlayerRes.status, 400);
  assert.strictEqual(join7PlayerRes.body.code, 'PLAYER_SLOTS_FULL');
  assert.strictEqual(join7PlayerRes.body.canJoinAsSpectator, true);
  console.log('  ✓ 7th player join correctly rejected with 400 (PLAYER_SLOTS_FULL).\n');

  // Test 10: Seventh Person CAN join as spectator
  console.log('10. Testing 7th Person Joins as Spectator...');
  const join7SpecRes = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${uCandidate7.token}` },
    body: { role: 'spectator' }
  });
  assert.strictEqual(join7SpecRes.status, 200);
  assert.strictEqual(join7SpecRes.body.participant.role, 'spectator');
  assert.strictEqual(join7SpecRes.body.room.spectatorCount, 2);
  assert.strictEqual(join7SpecRes.body.room.activePlayerCount, 6);
  console.log('  ✓ 7th person joined as spectator without taking a player slot!\n');

  // Test 11: Revoked Invitation Link Fails
  console.log('11. Testing Host Revocation of Invitation Link...');
  const revokeRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${room.roomCode}/invitations/revoke`,
    headers: { authorization: `Bearer ${uHost.token}` }
  });
  assert.strictEqual(revokeRes.status, 200);

  const uBlocked = await createTestUser('BlockedUser');
  const blockedJoin = await callApp({
    method: 'POST',
    url: `/api/rooms/join-invite/${inviteToken}`,
    headers: { authorization: `Bearer ${uBlocked.token}` },
    body: { role: 'spectator' }
  });
  assert.strictEqual(blockedJoin.status, 410, 'Revoked invite must return 410 Gone');
  assert.strictEqual(blockedJoin.body.code, 'INVITE_REVOKED');
  console.log('  ✓ Revoked invitation token blocked with 410 (INVITE_REVOKED).\n');

  console.log('🎉 --- ALL 11 MULTIPLAYER & INVITATION TESTS PASSED CLEANLY! --- 🎉');
}

runMultiplayerTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});


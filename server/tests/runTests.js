const assert = require('assert');
const { Readable, Duplex } = require('stream');
const http = require('http');
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

  // 9. Players Database
  await test('GET /api/players returns seeded cricket player cards', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.players.length > 5);
    const icon = res.body.players.find(p => p.cardTier === 'ICON');
    assert.ok(icon, 'Must have at least one ICON player card');
  });

  await test('GET /api/players?role=Bowler filters by bowling role', async () => {
    const res = await callApp({ method: 'GET', url: '/api/players?role=Bowler' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.players.every(p => p.role === 'Bowler'));
  });

  // 10. Rooms (Create & Join)
  let createdRoomCode;
  await test('POST /api/rooms creates a new multiplayer room', async () => {
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: {
        name: 'Super Over Champions Arena',
        format: 'Super Over',
        maxTeams: 4,
        budgetPerTeam: 800000000,
        isPrivate: false
      },
      headers: { authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.room.roomCode);
    createdRoomCode = res.body.room.roomCode;
  });

  await test('GET /api/rooms/:roomCode retrieves room details', async () => {
    const res = await callApp({ method: 'GET', url: `/api/rooms/${createdRoomCode}` });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.room.roomCode, createdRoomCode);
  });

  // 11. Match Center & Simulation
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

  // 12. Tournaments & Standings
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

process.env.DISABLE_RATE_LIMIT = 'true';
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

async function runTests() {
  console.log('🏏 --- VERIFYING CREATE ROOM JSON RESPONSE & WORKFLOW --- 🏏\n');

  // 1. Authenticate Host
  console.log('1. Authenticating Host via POST /api/auth/demo...');
  const authRes = await callApp({ method: 'POST', url: '/api/auth/demo' });
  assert.strictEqual(authRes.status, 200);
  assert.ok(authRes.body.token, 'Must return JWT token');
  const hostToken = authRes.body.token;
  const hostUser = authRes.body.user;
  console.log(`  ✓ Host authenticated as "${hostUser.username}".\n`);

  // 2. Successful Room Creation: Valid JSON, actual saved data
  console.log('2. Testing Successful Room Creation (T20 format, 30 points)...');
  const t20Res = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'Championship T20 Arena',
      format: 'T20',
      stadiumId: 'lords',
      teamName: 'Lord\'s Legends XI',
      allowSpectators: true
    }
  });

  assert.strictEqual(t20Res.status, 201, 'POST /api/rooms must return 201 Created');
  assert.ok(t20Res.contentType.includes('application/json'), 'Content-Type must be application/json');
  assert.strictEqual(t20Res.body.success, true);
  assert.strictEqual(t20Res.body.message, 'Room created successfully');
  const room = t20Res.body.room;
  assert.ok(room, 'Response must include room object');
  assert.ok(room._id, 'Room must have a valid _id');
  assert.strictEqual(typeof room._id, 'string', 'Room _id must be a string');
  assert.ok(room._id.length > 0, 'Room _id must be non-empty');
  assert.ok(room._id.startsWith('room_'), 'Room _id must start with room_');
  assert.ok(room.roomCode, 'Room must have a unique roomCode');
  assert.strictEqual(room.name, 'Championship T20 Arena');
  assert.strictEqual(room.format, 'T20');
  assert.strictEqual(room.auctionPurse, 30, 'T20 purse must be 30 points');
  assert.strictEqual(room.budgetPerTeam, 30);
  assert.strictEqual(room.minPlayers, 2, 'Min players must equal 2');
  assert.strictEqual(room.maxPlayers, 6, 'Max players must equal 6');
  assert.ok(room.stadium, 'Stadium must be saved');
  assert.strictEqual(room.stadium.name, "Lord's");
  assert.strictEqual(room.participants.length, 1);
  assert.strictEqual(room.participants[0].role, 'player');
  assert.strictEqual(room.participants[0].isHost, true);
  console.log(`  ✓ Created Room: Code=${room.roomCode}, _id=${room._id}, Purse=${room.auctionPurse}, Stadium=${room.stadium.name}\n`);

  // 3. Test Invalid Room Name (< 3 chars)
  console.log('3. Testing Invalid Room Name (< 3 characters)...');
  const invalidNameRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'AB',
      format: 'T20'
    }
  });
  assert.strictEqual(invalidNameRes.status, 400, 'Invalid name must return 400 Bad Request');
  assert.ok(invalidNameRes.contentType.includes('application/json'), 'Content-Type must be JSON');
  assert.strictEqual(invalidNameRes.body.success, false);
  assert.ok(Array.isArray(invalidNameRes.body.errors), 'Must return validation error array');
  console.log('  ✓ Invalid room name rejected with 400 and valid JSON.\n');

  // 4. Test Unauthenticated Request
  console.log('4. Testing Unauthenticated Request...');
  const unauthRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    body: {
      name: 'Unauth Arena',
      format: 'T20'
    }
  });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401 Unauthorized');
  assert.ok(unauthRes.contentType.includes('application/json'), 'Content-Type must be JSON');
  assert.strictEqual(unauthRes.body.success, false);
  console.log('  ✓ Unauthenticated request rejected with 401 and valid JSON.\n');

  // 5. Test Invalid Format
  console.log('5. Testing Invalid Cricket Format...');
  const invalidFormatRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'Invalid Format Arena',
      format: 'BASEBALL_FORMAT'
    }
  });
  assert.strictEqual(invalidFormatRes.status, 400);
  assert.ok(invalidFormatRes.contentType.includes('application/json'));
  assert.strictEqual(invalidFormatRes.body.success, false);
  console.log('  ✓ Invalid format rejected with 400 and valid JSON.\n');

  // 6. Test Missing Stadium (Falls back cleanly to default authentic stadium)
  console.log('6. Testing Missing Stadium Fallback...');
  const noStadiumRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'Default Stadium Arena',
      format: 'ODI'
    }
  });
  assert.strictEqual(noStadiumRes.status, 201);
  assert.ok(noStadiumRes.body.room.stadium, 'Must fallback to default authentic stadium');
  assert.strictEqual(noStadiumRes.body.room.auctionPurse, 40, 'ODI purse must equal 40');
  console.log(`  ✓ Missing stadium fell back cleanly to: ${noStadiumRes.body.room.stadium.name}\n`);

  // 7. Test Format Purses: TEST = 50, ODI = 40, T20 = 30
  console.log('7. Verifying Format Purse Assignments: Test=50, ODI=40, T20=30...');
  const testFormatRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'Ashes Classic Arena',
      format: 'Test',
      stadiumId: 'headingley'
    }
  });
  assert.strictEqual(testFormatRes.status, 201);
  assert.strictEqual(testFormatRes.body.room.auctionPurse, 50, 'Test format purse must be exactly 50');
  assert.strictEqual(testFormatRes.body.room.budgetPerTeam, 50);

  const odiFormatRes = await callApp({
    method: 'POST',
    url: '/api/rooms',
    headers: { authorization: `Bearer ${hostToken}` },
    body: {
      name: 'World Cup Final Arena',
      format: 'ODI',
      stadiumId: 'mcg'
    }
  });
  assert.strictEqual(odiFormatRes.status, 201);
  assert.strictEqual(odiFormatRes.body.room.auctionPurse, 40, 'ODI format purse must be exactly 40');
  console.log('  ✓ Format purses verified: Test=50, ODI=40, T20=30.\n');

  // 8. Test Room Persistence: GET /api/rooms/:roomCode
  console.log(`8. Verifying Room Persistence (GET /api/rooms/${room.roomCode})...`);
  const getRes = await callApp({
    method: 'GET',
    url: `/api/rooms/${room.roomCode}`
  });
  assert.strictEqual(getRes.status, 200);
  assert.ok(getRes.contentType.includes('application/json'));
  assert.strictEqual(getRes.body.success, true);
  assert.strictEqual(getRes.body.room.roomCode, room.roomCode);
  assert.strictEqual(getRes.body.room.name, room.name);
  assert.strictEqual(getRes.body.room.auctionPurse, 30);
  assert.ok(getRes.body.room.invitation?.token, 'Must return invitation token for lobby link');
  console.log('  ✓ Room persists and retrieves accurately with valid JSON.\n');

  // 9. Verify Minimum 2 Players Rule in Lobby
  console.log('9. Verifying Minimum 2 Active Players Rule before Start...');
  const startRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${room.roomCode}/start`,
    headers: { authorization: `Bearer ${hostToken}` }
  });
  assert.strictEqual(startRes.status, 400, 'Must reject starting with only 1 player');
  assert.strictEqual(startRes.body.code, 'INSUFFICIENT_PLAYERS');
  console.log('  ✓ 1-player start correctly rejected (requires min 2 players).\n');

  // 10. Verifying MongoDB Persistence Room Schema & _id String Generation
  console.log('10. Verifying MongoDB Persistence Room Schema & _id String Generation...');
  const Room = require('../src/models/Room');
  const storeService = require('../src/services/storeService');
  
  const hostId = hostUser.id || hostUser._id || 'usr_demo_101';
  const hostUsername = hostUser.username || 'cricket_legend';

  // Test 1: Mongoose schema default generates string _id
  const modelRoom = new Room({
    name: 'Mongoose Persistence Test',
    roomCode: 'CRIC-7777',
    hostId,
    hostUsername,
    format: 'T20'
  });
  assert.strictEqual(typeof modelRoom._id, 'string', 'Model _id must be string');
  assert.ok(modelRoom._id.length > 0, 'Model _id must be non-empty');
  assert.ok(modelRoom._id.startsWith('room_'), 'Model _id must start with room_');
  await modelRoom.validate();

  // Test 2: storeService.createRoom generates string _id
  const serviceRoom = await storeService.createRoom({
    name: 'StoreService Atlas Arena',
    hostId,
    hostUsername,
    format: 'ODI'
  });
  assert.strictEqual(typeof serviceRoom._id, 'string', 'Service room _id must be string');
  assert.ok(serviceRoom._id.length > 0, 'Service room _id must be non-empty');
  assert.ok(serviceRoom._id.startsWith('room_'), 'Service room _id must start with room_');
  assert.strictEqual(serviceRoom.format, 'ODI');
  assert.ok(serviceRoom.roomCode, 'Service room must have a roomCode');

  // Test 3: Custom _id is preserved
  const customId = `room_custom_${Date.now()}`;
  const customRoom = await storeService.createRoom({
    _id: customId,
    name: 'Custom ID Arena',
    hostId,
    hostUsername,
    format: 'Test'
  });
  assert.strictEqual(customRoom._id, customId, 'Custom _id must be preserved');
  console.log('  ✓ MongoDB room persistence and string _id generation verified successfully.\n');

  console.log('🎯 --- ALL 10 WORKFLOW SCENARIOS VERIFIED SUCCESSFULLY! --- 🎯');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

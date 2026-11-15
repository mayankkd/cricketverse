const assert = require('assert');
const { getStadiumById, getAllStadiums } = require('../src/data/stadiumsData');

const runStadiumAndSimplificationTests = async ({ callApp, test }) => {
  console.log('\n🏏 --- STADIUM SELECTION & SIMPLIFIED GAME ENGINE TESTS --- 🏏\n');

  // Test token helper
  const demoLogin = async () => {
    const res = await callApp({ method: 'POST', url: '/api/auth/demo' });
    return res.body.token;
  };

  const createHostUser = async (name) => {
    const res = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: name,
        email: `${name.toLowerCase()}@cricketverse.arena`,
        password: 'password123'
      }
    });
    return res.body.token;
  };

  // 1. All 15 authentic stadiums returned with verified photos
  await test('Stadium 1.1: GET /api/stadiums returns all 15 authentic stadiums', async () => {
    const res = await callApp({ method: 'GET', url: '/api/stadiums' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.count, 15);
    assert.strictEqual(res.body.stadiums.length, 15);
  });

  await test('Stadium 1.2: Every stadium contains real photograph, pitch type & characteristics', async () => {
    const stadiums = getAllStadiums();
    assert.strictEqual(stadiums.length, 15);

    const requiredKeys = ['id', 'name', 'city', 'country', 'pitchType', 'paceSupport', 'spinSupport', 'imageUrl', 'boundaryDimensions'];
    for (const stad of stadiums) {
      for (const k of requiredKeys) {
        assert.ok(stad[k] !== undefined && stad[k] !== null, `Stadium ${stad.name} missing key ${k}`);
      }
      assert.ok(stad.imageUrl.startsWith('https://'), `Stadium ${stad.name} image URL must be https`);
      assert.ok(stad.paceSupport >= 0 && stad.paceSupport <= 100);
      assert.ok(stad.spinSupport >= 0 && stad.spinSupport <= 100);
    }
  });

  // 2. Format purses: Test = 50, ODI = 40, T20 = 30
  await test('Purse 2.1: Test format room initializes with 50 points purse per team', async () => {
    const token = await demoLogin();
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'Test Championship', format: 'Test', teamName: 'India XI' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.room.format, 'Test');
    assert.strictEqual(res.body.room.budgetPerTeam, 50);
  });

  await test('Purse 2.2: ODI format room initializes with 40 points purse per team', async () => {
    const token = await demoLogin();
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'ODI World Cup Clash', format: 'ODI', teamName: 'Aussie XI' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.room.format, 'ODI');
    assert.strictEqual(res.body.room.budgetPerTeam, 40);
  });

  await test('Purse 2.3: T20 format room initializes with 30 points purse per team', async () => {
    const token = await demoLogin();
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'T20 Blast Arena', format: 'T20', teamName: 'Titans XI' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.room.format, 'T20');
    assert.strictEqual(res.body.room.budgetPerTeam, 30);
  });

  // 3. Host-Controlled Stadium Selection & Persistence
  await test('Stadium 3.1: Host selects stadium and saves with room settings', async () => {
    const hostToken = await createHostUser(`HostStad_${Date.now()}`);
    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${hostToken}` },
      body: { name: 'Motera Clash', format: 'T20', teamName: 'Host XI' }
    });
    const roomCode = createRes.body.room.roomCode;

    // Host updates stadium to Wankhede
    const wankhede = getStadiumById('wankhede');
    const updateRes = await callApp({
      method: 'PUT',
      url: `/api/rooms/${roomCode}/settings`,
      headers: { authorization: `Bearer ${hostToken}` },
      body: {
        stadiumId: 'wankhede',
        stadium: wankhede,
        stadiumName: wankhede.fullName
      }
    });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.room.stadiumId, 'wankhede');
    assert.strictEqual(updateRes.body.room.stadium.name, 'Wankhede');
  });

  await test('Stadium 3.2: Non-host cannot alter room stadium selection (403 Forbidden)', async () => {
    const hostToken = await createHostUser(`HostStad2_${Date.now()}`);
    const guestToken = await createHostUser(`GuestStad_${Date.now()}`);

    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${hostToken}` },
      body: { name: 'Private Ground Arena', format: 'T20', teamName: 'Host XI' }
    });
    const roomCode = createRes.body.room.roomCode;

    // Guest tries to update stadium
    const res = await callApp({
      method: 'PUT',
      url: `/api/rooms/${roomCode}/settings`,
      headers: { authorization: `Bearer ${guestToken}` },
      body: { stadiumId: 'chepauk' }
    });

    assert.strictEqual(res.status, 403);
  });

  // 4. Room Creation MongoDB Persistence & String _id Verification
  await test('Room Persistence 4.1: Room Mongoose model initializes with valid non-empty string _id by default', async () => {
    const Room = require('../src/models/Room');
    const roomDoc = new Room({
      name: 'Persistence Model Test',
      roomCode: `CRIC-${Math.floor(1000 + Math.random() * 9000)}`,
      hostId: 'usr_test_host_1',
      hostUsername: 'TestHost',
      format: 'T20'
    });
    assert.strictEqual(typeof roomDoc._id, 'string', 'roomDoc._id must be a string');
    assert.ok(roomDoc._id.length > 0, 'roomDoc._id must be non-empty');
    assert.ok(roomDoc._id.startsWith('room_'), 'roomDoc._id should start with room_');
    await roomDoc.validate();
  });

  await test('Room Persistence 4.2: storeService.createRoom() assigns unique string _id and returns correct _id and roomCode', async () => {
    const storeService = require('../src/services/storeService');
    const room = await storeService.createRoom({
      name: 'Atlas Persistence Match Arena',
      hostId: 'usr_test_host_2',
      hostUsername: 'AtlasHost',
      format: 'T20',
      budgetPerTeam: 30
    });
    assert.strictEqual(typeof room._id, 'string', 'room._id must be a string');
    assert.ok(room._id.length > 0, 'room._id must be non-empty');
    assert.ok(room._id.startsWith('room_'), 'room._id must start with room_');
    assert.ok(room.roomCode.startsWith('CRIC-'), 'room.roomCode must start with CRIC-');
    assert.strictEqual(room.auctionPurse, 30);
  });

  await test('Room Persistence 4.3: storeService.createRoom() preserves user-supplied _id if provided', async () => {
    const storeService = require('../src/services/storeService');
    const customId = `room_custom_atlas_${Date.now()}`;
    const room = await storeService.createRoom({
      _id: customId,
      name: 'Custom ID Arena',
      hostId: 'usr_test_host_3',
      hostUsername: 'CustomHost',
      format: 'ODI'
    });
    assert.strictEqual(room._id, customId, 'storeService must preserve custom string _id');
    assert.strictEqual(room.format, 'ODI');
    assert.strictEqual(room.auctionPurse, 40);
  });

  await test('Room Persistence 4.4: Room API POST /api/rooms returns non-empty string _id and valid roomCode', async () => {
    const token = await demoLogin();
    const res = await callApp({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'API Persistence Arena', format: 'T20', teamName: 'Warriors XI' }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.room._id, 'string', 'API room._id must be string');
    assert.ok(res.body.room._id.length > 0, 'API room._id must not be empty');
    assert.ok(res.body.room._id.startsWith('room_'), 'API room._id must start with room_');
    assert.ok(res.body.room.roomCode.startsWith('CRIC-'), 'API room.roomCode must start with CRIC-');
  });
};

module.exports = { runStadiumAndSimplificationTests };


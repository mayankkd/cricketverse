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
};

module.exports = { runStadiumAndSimplificationTests };

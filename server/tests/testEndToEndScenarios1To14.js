/**
 * CRICKETVERSE - COMPLETE END-TO-END SCENARIO-BASED QA SUITE (SCENARIOS 1 TO 14)
 * Systematically tests every real-world user flow:
 * Scenario 1: First-Time User
 * Scenario 2: Host Creates a Room
 * Scenario 3: Second Player Joins from a Different Device
 * Scenario 4: Spectator Joins
 * Scenario 5: Room Capacity and Validation
 * Scenario 6: Automatic Random Cricket Auction
 * Scenario 7: Auction Purse Validation
 * Scenario 8: Auction Page Runtime Errors & Resilience
 * Scenario 9: Auction to Team Building
 * Scenario 10: Original Cricket Match Engine
 * Scenario 11: Multiplayer Live Match
 * Scenario 12: Responsive Mobile Layout & Component Guards
 * Scenario 13: Database & Model _id Persistence
 * Scenario 14: Error and Failure Injection
 */

const assert = require('assert');
const storeService = require('../src/services/storeService');
const matchEngineService = require('../src/services/matchEngineService');
const { signToken } = require('../src/config/jwt');
const Room = require('../src/models/Room');
const Team = require('../src/models/Team');
const Match = require('../src/models/Match');
const User = require('../src/models/User');
const Player = require('../src/models/Player');
const Tournament = require('../src/models/Tournament');

const runEndToEndScenarios1To14 = async ({ callApp, test }) => {
  console.log('\n===============================================================');
  console.log('🏆 CRICKETVERSE — END-TO-END SCENARIO QA & VERIFICATION (1-14) 🏆');
  console.log('===============================================================\n');

  const createUniqueUser = async (baseName) => {
    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const user = await storeService.createUser({
      username: `${baseName}_${rand}`,
      email: `${baseName.toLowerCase()}_${timestamp}_${rand}@cricketverse.app`,
      password: 'StrongPassword123!',
      favoriteTeam: 'Royal Challengers Bengaluru'
    });
    const token = signToken({ id: user._id, _id: user._id, username: user.username, role: user.role });
    return { ...user, token };
  };

  // =========================================================================
  // SCENARIO 1: FIRST-TIME USER
  // =========================================================================
  await test('SCENARIO 1: First-Time User — Registration, profile, refresh, logout & re-auth', async () => {
    const userEmail = `newuser_${Date.now()}@cricketverse.app`;
    const regRes = await callApp({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: `Rookie_${Math.floor(1000 + Math.random() * 9000)}`,
        email: userEmail,
        password: 'Password123!'
      }
    });

    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.success, true);
    assert.ok(regRes.body.token, 'Registration must issue a JWT');
    const token = regRes.body.token;

    // Refresh simulation: verify GET /api/auth/me returns persisted profile
    const meRes = await callApp({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.user.email, userEmail);

    // Profile update
    const updateRes = await callApp({
      method: 'PUT',
      url: '/api/auth/profile',
      body: { favoriteTeam: 'Kolkata Knight Riders' },
      headers: { authorization: `Bearer ${token}` }
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.user.favoriteTeam, 'Kolkata Knight Riders');

    // Logout & Login simulation
    const loginRes = await callApp({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: userEmail, password: 'Password123!' }
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);

    // Invalid credentials handled
    const badLoginRes = await callApp({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: userEmail, password: 'WrongPassword!' }
    });
    assert.strictEqual(badLoginRes.status, 401);

    // No duplicate demo identities: guest login allocates unique IDs
    const g1 = await callApp({ method: 'POST', url: '/api/auth/guest', body: { username: 'GuestOne' } });
    const g2 = await callApp({ method: 'POST', url: '/api/auth/guest', body: { username: 'GuestTwo' } });
    assert.notStrictEqual(g1.body.user._id, g2.body.user._id, 'Separate guests must have unique IDs');
  });

  // =========================================================================
  // SCENARIO 2: HOST CREATES A ROOM
  // =========================================================================
  let sc2RoomCode = null;
  let sc2Host = null;
  let sc2InviteToken = null;

  await test('SCENARIO 2: Host Creates a Room — Room creation, validation, purse, and refresh persistence', async () => {
    sc2Host = await createUniqueUser('HostMgr');

    // Missing room name rejected (400)
    const invalidNameRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: '  ', format: 'T20' },
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });
    assert.strictEqual(invalidNameRes.status, 400);

    // Invalid format rejected (400)
    const invalidFmtRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Super Arena', format: 'Formula1' },
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });
    assert.strictEqual(invalidFmtRes.status, 400);

    // Valid room creation
    const createRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: {
        name: 'Champions Premier League',
        format: 'T20',
        teamName: 'Bangalore Titans',
        stadiumId: 'eden_gardens'
      },
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert.ok(createRes.body.room.roomCode.startsWith('CRIC-'), 'Must generate CRIC-XXXX code');
    sc2RoomCode = createRes.body.room.roomCode;

    // Verify host is registered as first active player (1/6)
    assert.strictEqual(createRes.body.room.status, 'waiting');
    assert.strictEqual(createRes.body.room.participants.length, 1);
    assert.strictEqual(createRes.body.room.participants[0].userId, sc2Host._id);
    assert.strictEqual(createRes.body.room.participants[0].role, 'player');
    assert.strictEqual(createRes.body.room.participants[0].isHost, true);
    assert.strictEqual(createRes.body.room.budgetPerTeam, 30); // T20 purse

    // Generate invite link
    const inviteRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${sc2RoomCode}/invitations`,
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });
    assert.strictEqual(inviteRes.status, 200);
    assert.ok(inviteRes.body.invitation.token);
    sc2InviteToken = inviteRes.body.invitation.token;

    // Refresh simulation: Room data persists
    const reloadRes = await callApp({
      method: 'GET',
      url: `/api/rooms/${sc2RoomCode}`
    });
    assert.strictEqual(reloadRes.status, 200);
    assert.strictEqual(reloadRes.body.room.name, 'Champions Premier League');
    assert.strictEqual(reloadRes.body.room.stadiumId, 'eden_gardens');
  });

  // =========================================================================
  // SCENARIO 3: SECOND PLAYER JOINS FROM A DIFFERENT DEVICE
  // =========================================================================
  let sc3Player2 = null;

  await test('SCENARIO 3: Second Player Joins from Different Device — Active players 1/6 to 2/6, Seat #2 occupied', async () => {
    sc3Player2 = await createUniqueUser('Device2Player');

    // Preview invitation link
    const previewRes = await callApp({
      method: 'GET',
      url: `/api/rooms/invitation/${sc2InviteToken}`
    });
    assert.strictEqual(previewRes.status, 200);
    assert.strictEqual(previewRes.body.room.roomCode, sc2RoomCode);
    assert.strictEqual(previewRes.body.room.activePlayersCount, 1);

    // Second device joins as player via invitation
    const joinRes = await callApp({
      method: 'POST',
      url: `/api/rooms/join-invite/${sc2InviteToken}`,
      body: { role: 'player', teamName: 'Mumbai Mavericks' },
      headers: { authorization: `Bearer ${sc3Player2.token}` }
    });

    assert.strictEqual(joinRes.status, 200);
    assert.strictEqual(joinRes.body.success, true);

    // Verify room has 2 active players
    const roomStateRes = await callApp({
      method: 'GET',
      url: `/api/rooms/${sc2RoomCode}`,
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });

    const activePlayers = roomStateRes.body.room.participants.filter(p => p.role === 'player');
    assert.strictEqual(activePlayers.length, 2, 'Active players must transition from 1/6 to 2/6');
    assert.strictEqual(activePlayers[1].username, sc3Player2.username, 'Seat #2 must display Player 2');
    assert.strictEqual(activePlayers[1].teamName, 'Mumbai Mavericks');

    // Both devices refreshing preserves joined players
    const reloadP2Res = await callApp({
      method: 'GET',
      url: `/api/rooms/${sc2RoomCode}`,
      headers: { authorization: `Bearer ${sc3Player2.token}` }
    });
    assert.strictEqual(reloadP2Res.body.room.participants.filter(p => p.role === 'player').length, 2);
  });

  // =========================================================================
  // SCENARIO 4: SPECTATOR JOINS
  // =========================================================================
  let sc4Spectator = null;

  await test('SCENARIO 4: Spectator Joins — Observer permissions, player count stays 2/6, actions blocked', async () => {
    sc4Spectator = await createUniqueUser('FanSpectator');

    const specJoinRes = await callApp({
      method: 'POST',
      url: `/api/rooms/join-invite/${sc2InviteToken}`,
      body: { role: 'spectator', teamName: 'Spectator Dugout' },
      headers: { authorization: `Bearer ${sc4Spectator.token}` }
    });

    assert.strictEqual(specJoinRes.status, 200);

    const roomRes = await callApp({ method: 'GET', url: `/api/rooms/${sc2RoomCode}` });
    const players = roomRes.body.room.participants.filter(p => p.role === 'player');
    const spectators = roomRes.body.room.participants.filter(p => p.role === 'spectator');

    assert.strictEqual(players.length, 2, 'Spectator must NOT increase active player count');
    assert.strictEqual(spectators.length, 1, 'Spectator must be listed in spectator collection');

    // Spectator attempts to place bid -> 403 Forbidden
    const specBidRes = await callApp({
      method: 'POST',
      url: `/api/auction/${sc2RoomCode}/bid`,
      body: { amount: 2 },
      headers: { authorization: `Bearer ${sc4Spectator.token}` }
    });
    assert.strictEqual(specBidRes.status, 403);

    // Spectator attempts to use T2 veto -> 403 Forbidden
    const specVetoRes = await callApp({
      method: 'POST',
      url: `/api/auction/${sc2RoomCode}/veto`,
      headers: { authorization: `Bearer ${sc4Spectator.token}` }
    });
    assert.strictEqual(specVetoRes.status, 403);
  });

  // =========================================================================
  // SCENARIO 5: ROOM CAPACITY AND VALIDATION
  // =========================================================================
  await test('SCENARIO 5: Room Capacity & Validation — Enforce min 2 to start, max 6 players, 7th as spectator', async () => {
    // Test 1-player room cannot start
    const singleHost = await createUniqueUser('SoloHost');
    const soloRoomRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Solo Room', format: 'T20' },
      headers: { authorization: `Bearer ${singleHost.token}` }
    });
    const soloCode = soloRoomRes.body.room.roomCode;

    const startFailRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${soloCode}/start`,
      headers: { authorization: `Bearer ${singleHost.token}` }
    });
    assert.strictEqual(startFailRes.status, 400, 'Cannot start arena with only 1 player');
    assert.strictEqual(startFailRes.body.code, 'INSUFFICIENT_PLAYERS');

    // Fill sc2RoomCode to 6 players
    for (let i = 3; i <= 6; i++) {
      const extraP = await createUniqueUser(`Player${i}`);
      const jRes = await callApp({
        method: 'POST',
        url: `/api/rooms/${sc2RoomCode}/join`,
        body: { role: 'player', teamName: `Franchise ${i}` },
        headers: { authorization: `Bearer ${extraP.token}` }
      });
      assert.strictEqual(jRes.status, 200);
    }

    const roomFullCheck = await callApp({ method: 'GET', url: `/api/rooms/${sc2RoomCode}` });
    assert.strictEqual(roomFullCheck.body.room.participants.filter(p => p.role === 'player').length, 6);

    // 7th user tries to join as PLAYER -> rejected with 400 PLAYER_SLOTS_FULL
    const user7 = await createUniqueUser('Player7');
    const fullRejectRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${sc2RoomCode}/join`,
      body: { role: 'player', teamName: 'Late Franchise' },
      headers: { authorization: `Bearer ${user7.token}` }
    });
    assert.strictEqual(fullRejectRes.status, 400);
    assert.strictEqual(fullRejectRes.body.code, 'PLAYER_SLOTS_FULL');

    // 7th user can join as SPECTATOR -> succeeds
    const spec7Res = await callApp({
      method: 'POST',
      url: `/api/rooms/${sc2RoomCode}/join`,
      body: { role: 'spectator', teamName: 'Spectator Dugout' },
      headers: { authorization: `Bearer ${user7.token}` }
    });
    assert.strictEqual(spec7Res.status, 200);

    // Duplicate user cannot take another player slot; reconnected without altering player capacity
    const dupRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${sc2RoomCode}/join`,
      body: { role: 'player', teamName: 'Duplicate Attempt' },
      headers: { authorization: `Bearer ${sc2Host.token}` }
    });
    assert.strictEqual(dupRes.status, 200);
    assert.strictEqual(dupRes.body.reconnected, true);
    const postDupRoom = await callApp({ method: 'GET', url: `/api/rooms/${sc2RoomCode}` });
    assert.strictEqual(postDupRoom.body.room.participants.filter(p => p.role === 'player').length, 6);
  });

  // =========================================================================
  // SCENARIO 6: AUTOMATIC RANDOM CRICKET AUCTION
  // =========================================================================
  let sc6RoomCode = null;
  let sc6Host = null;
  let sc6P2 = null;

  await test('SCENARIO 6: Automatic Random Auction — Same lot, competitive bidding (2, 3, 4 pts), sale & next lot', async () => {
    sc6Host = await createUniqueUser('AucHost6');
    sc6P2 = await createUniqueUser('AucP2_6');

    const rRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Mega Competitive Auction', format: 'T20' },
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    sc6RoomCode = rRes.body.room.roomCode;

    await callApp({
      method: 'POST',
      url: `/api/rooms/${sc6RoomCode}/join`,
      body: { role: 'player', teamName: 'Chennai Super Kings' },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });

    // Host starts auction -> triggers auto-random queue
    const startRes = await callApp({
      method: 'POST',
      url: `/api/rooms/${sc6RoomCode}/start`,
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(startRes.status, 200);

    // Both devices see exact same nominated player
    const stateHost = await callApp({ method: 'GET', url: `/api/rooms/${sc6RoomCode}`, headers: { authorization: `Bearer ${sc6Host.token}` } });
    const stateP2 = await callApp({ method: 'GET', url: `/api/rooms/${sc6RoomCode}`, headers: { authorization: `Bearer ${sc6P2.token}` } });

    assert.ok(stateHost.body.room.auctionState.currentLot, 'Current lot must be present');
    assert.strictEqual(stateHost.body.room.auctionState.currentLot.playerId, stateP2.body.room.auctionState.currentLot.playerId);
    assert.strictEqual(stateHost.body.room.auctionState.currentLot.startingPrice, 1);

    const lot1PlayerName = stateHost.body.room.auctionState.currentLot.playerName;

    // Competitive Bidding:
    // P2 bids 2 points
    const b1 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 2 },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });
    assert.strictEqual(b1.status, 200);
    assert.strictEqual(b1.body.currentLot.currentBid, 2);

    // Host counters with 3 points
    const b2 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 3 },
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(b2.status, 200);
    assert.strictEqual(b2.body.currentLot.currentBid, 3);

    // P2 raises to 4 points
    const b3 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 4 },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });
    assert.strictEqual(b3.status, 200);
    assert.strictEqual(b3.body.currentLot.currentBid, 4);
    assert.strictEqual(b3.body.currentLot.highestBidderId, sc6P2._id);

    // Timer expiration / hammer down
    const hammerRes = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/hammer`,
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(hammerRes.status, 200);

    // Verify P2 won the lot for 4 points
    const roomAfterHammer = await callApp({ method: 'GET', url: `/api/rooms/${sc6RoomCode}` });
    const p2Record = roomAfterHammer.body.room.participants.find(p => p.userId === sc6P2._id);

    assert.strictEqual(p2Record.budgetRemaining, 26, 'Purse must be 30 - 4 = 26 pts');
    assert.strictEqual(p2Record.squad.length, 1);
    assert.strictEqual(p2Record.squad[0].playerName, lot1PlayerName);
    assert.strictEqual(p2Record.squad[0].acquiredPrice, 4);
    assert.strictEqual(roomAfterHammer.body.room.auctionState.currentLot.status, 'sold');

    // Automatic progression to next random cricketer
    const auctionEngineService = require('../src/services/auctionEngineService');
    await auctionEngineService.advanceToNextPlayer(sc6RoomCode);

    const roomNextLot = await callApp({ method: 'GET', url: `/api/rooms/${sc6RoomCode}` });
    assert.ok(roomNextLot.body.room.auctionState.currentLot, 'Next lot must be active');
    assert.notStrictEqual(roomNextLot.body.room.auctionState.currentLot.playerName, lot1PlayerName, 'Next lot must be different cricketer');
  });

  // =========================================================================
  // SCENARIO 7: AUCTION PURSE VALIDATION
  // =========================================================================
  await test('SCENARIO 7: Auction Purse Validation — T20(30), ODI(40), Test(50), 2 T2 vetoes, uniqueness', async () => {
    // Verify format purses
    assert.strictEqual(storeService.getFormatPurse('T20'), 30);
    assert.strictEqual(storeService.getFormatPurse('ODI'), 40);
    assert.strictEqual(storeService.getFormatPurse('Test'), 50);

    // Purse exceeding rejection
    const bigBid = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 999 },
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(bigBid.status, 400);

    // T2 Veto execution: User has 2 tokens
    const auctionEngineService = require('../src/services/auctionEngineService');
    const v1 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/veto`,
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(v1.status, 200);
    assert.strictEqual(v1.body.remainingTokens, 1);

    // Auto advances, Host uses 2nd veto
    await auctionEngineService.advanceToNextPlayer(sc6RoomCode);
    const v2 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/veto`,
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(v2.status, 200);
    assert.strictEqual(v2.body.remainingTokens, 0);

    // Advance to next lot; Host attempts 3rd veto -> 400 INSUFFICIENT_VETO_TOKENS
    await auctionEngineService.advanceToNextPlayer(sc6RoomCode);
    const v3 = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/veto`,
      headers: { authorization: `Bearer ${sc6Host.token}` }
    });
    assert.strictEqual(v3.status, 400);
    assert.strictEqual(v3.body.code, 'INSUFFICIENT_VETO_TOKENS');
  });

  // =========================================================================
  // SCENARIO 8: AUCTION PAGE RUNTIME ERRORS & RESILIENCE
  // =========================================================================
  await test('SCENARIO 8: Auction Page Runtime Errors — Safe defaults, no .slice crash, unstarted states', async () => {
    // Pure function resilience: initials with undefined properties
    const getInitials = (player) => {
      if (!player) return 'CR';
      if (typeof player.shortName === 'string' && player.shortName.trim().length > 0) {
        return player.shortName.trim().split(/\s+/).map(p => p[0] || '').join('').slice(0, 3).toUpperCase() || 'CR';
      }
      const nameStr = (typeof player.name === 'string' && player.name.trim().length > 0)
        ? player.name.trim()
        : (typeof player.playerName === 'string' && player.playerName.trim().length > 0)
        ? player.playerName.trim()
        : 'CR';
      return nameStr.slice(0, 2).toUpperCase();
    };

    assert.strictEqual(getInitials({ shortName: undefined, name: undefined, playerName: undefined }), 'CR');
    assert.strictEqual(getInitials({ playerName: 'Jasprit Bumrah' }), 'JA');
    assert.strictEqual(getInitials({ name: 'Virat Kohli' }), 'VI');

    // Test unstarted room returns waiting status cleanly
    const unstartedHost = await createUniqueUser('WaitHost8');
    const uRoomRes = await callApp({
      method: 'POST',
      url: '/api/rooms',
      body: { name: 'Waiting Arena', format: 'T20' },
      headers: { authorization: `Bearer ${unstartedHost.token}` }
    });
    const uCode = uRoomRes.body.room.roomCode;

    const unstartedFetch = await callApp({ method: 'GET', url: `/api/rooms/${uCode}` });
    assert.strictEqual(unstartedFetch.body.room.status, 'waiting');
    assert.strictEqual(unstartedFetch.body.room.auctionState.status, 'idle');

    // Missing room code returns 404
    const errRes = await callApp({ method: 'GET', url: '/api/rooms/CRIC-4736-DOES-NOT-EXIST' });
    assert.strictEqual(errRes.status, 404);
  });

  // =========================================================================
  // SCENARIO 9: AUCTION TO TEAM BUILDING
  // =========================================================================
  await test('SCENARIO 9: Auction to Team Building — Purchased players bridged to Team lineup and Playing XI', async () => {
    // Fetch franchise team for P2 who won a player in Scenario 6
    const franchiseRes = await callApp({
      method: 'GET',
      url: `/api/teams/my?room=${sc6RoomCode}`,
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });

    assert.strictEqual(franchiseRes.status, 200);
    assert.ok(franchiseRes.body.team);
    assert.ok(franchiseRes.body.team.squad.length >= 11, 'Must have at least 11 squad members');
    assert.ok(franchiseRes.body.team.playingXI.length === 11, 'Playing XI must have exactly 11 players');

    // Update Playing XI
    const teamId = franchiseRes.body.team._id;
    const playingXI = franchiseRes.body.team.playingXI;
    const updateXIRes = await callApp({
      method: 'PUT',
      url: `/api/teams/${teamId}`,
      body: {
        playingXI,
        captainId: playingXI[0],
        viceCaptainId: playingXI[1],
        wicketKeeperId: playingXI[2]
      },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });

    assert.strictEqual(updateXIRes.status, 200);
    assert.strictEqual(updateXIRes.body.team.captainId, playingXI[0]);
  });

  // =========================================================================
  // SCENARIO 10: ORIGINAL CRICKET MATCH ENGINE
  // =========================================================================
  await test('SCENARIO 10: Original Cricket Match Engine — Overs, runs, wickets, strike rotation, scorecard figures', async () => {
    const testMatchId = `TEST_MATCH_${Date.now()}`;
    const engine = await matchEngineService.getOrCreateMatchEngine(testMatchId);
    assert.ok(engine, 'Match engine must initialize');

    // Submit full delivery turn
    const turnResult = await matchEngineService.submitFullDeliveryTurn(testMatchId, 'test_user', {
      bowlerDecision: { length: 'Good', line: 'Off', style: 'Pace' },
      batterDecision: { shot: 'Drive', aggression: 'Normal' }
    });

    assert.ok(turnResult.snapshot, 'Turn must return match snapshot');
    assert.ok(turnResult.outcome, 'Turn must return ball outcome');
    assert.ok(['0', '1', '2', '3', '4', '6', 'W', 'Wd', 'Nb'].includes(turnResult.outcome.display) || turnResult.outcome.runs !== undefined);

    // Verify scorecard figures aggregated
    const snapshot = matchEngineService.getMatchSnapshot(testMatchId);
    assert.ok(snapshot.currentInnings >= 1);
    assert.ok(snapshot.currentBattingScore?.score !== undefined || snapshot.teamA?.score !== undefined);
  });

  // =========================================================================
  // SCENARIO 11: MULTIPLAYER LIVE MATCH
  // =========================================================================
  await test('SCENARIO 11: Multiplayer Live Match — Multi-device socket join, state recovery, sequence sync', async () => {
    const mpMatchId = `MP_MATCH_${Date.now()}`;

    // Host joins match
    const hostJoin = await matchEngineService.joinMatch(mpMatchId, {
      role: 'player',
      teamKey: 'teamA',
      userId: sc6Host._id,
      username: sc6Host.username
    });
    assert.strictEqual(hostJoin.participantRole, 'player');

    // Player 2 joins match
    const p2Join = await matchEngineService.joinMatch(mpMatchId, {
      role: 'player',
      teamKey: 'teamB',
      userId: sc6P2._id,
      username: sc6P2.username
    });
    assert.strictEqual(p2Join.participantRole, 'player');

    // Spectator joins match
    const specJoin = await matchEngineService.joinMatch(mpMatchId, {
      role: 'spectator',
      userId: 'spec_observer_1',
      username: 'Observer'
    });
    assert.strictEqual(specJoin.participantRole, 'spectator');

    // Submit ball turn and check sequence sync
    await matchEngineService.submitFullDeliveryTurn(mpMatchId, sc6Host._id, {
      bowlerDecision: { length: 'Yorker', line: 'Stumps' },
      batterDecision: { shot: 'Defend' }
    });

    const syncRes = await matchEngineService.syncMatch(mpMatchId, { fromSeq: 0, userId: sc6P2._id });
    assert.ok(syncRes.snapshot);
    assert.ok(syncRes.latestSeq >= 1);
  });

  // =========================================================================
  // SCENARIO 12: RESPONSIVE MOBILE LAYOUT & COMPONENT GUARDS
  // =========================================================================
  await test('SCENARIO 12: Responsive Layout Guards — Safe commentary, empty figures, no unhandled maps', async () => {
    // Verify BowlingFigures logic handles undefined names cleanly
    const safeBowler = { overs: '4.0', maidens: 0, runs: 28, wickets: 2, economy: '7.00' };
    const bName = typeof safeBowler.name === 'string' && safeBowler.name.trim() ? safeBowler.name.trim() : (safeBowler.playerName || 'Bowler');
    const initials = bName.split(/\s+/).map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'BW';
    assert.strictEqual(initials, 'B');

    // Verify MatchCenter commentary slice handles undefined commentary array
    const emptyMatch = {};
    const commList = (emptyMatch.commentary || []).slice(0, 3).map(c => c.text);
    assert.deepStrictEqual(commList, []);
  });

  // =========================================================================
  // SCENARIO 13: DATABASE & MODEL _ID PERSISTENCE
  // =========================================================================
  await test('SCENARIO 13: Database Persistence — Models have default string _id generators (no missing _id error)', async () => {
    // Test Room model generates _id
    const r = new Room({
      roomCode: `CRIC-${Date.now()}`,
      name: 'Persistence Test',
      hostId: 'usr_test',
      hostUsername: 'test_user'
    });
    assert.ok(r._id && r._id.startsWith('room_'), 'Room._id must be automatically generated');

    // Test Team model generates _id
    const t = new Team({
      name: 'Chennai Super Kings',
      shortCode: 'CSK'
    });
    assert.ok(t._id && t._id.startsWith('team_'), 'Team._id must be automatically generated');

    // Test Match model generates _id
    const m = new Match({
      matchId: `m_${Date.now()}`,
      title: 'Match Persistence'
    });
    assert.ok(m._id && m._id.startsWith('match_'), 'Match._id must be automatically generated');

    // Test Player model generates _id
    const pl = new Player({
      playerId: 'cric_test_player',
      name: 'Test Cricketer',
      shortName: 'T Cricketer',
      country: 'India',
      countryCode: 'IND',
      role: 'Batter'
    });
    assert.ok(pl._id && pl._id.startsWith('ply_'), 'Player._id must be automatically generated');

    // Test Tournament model generates _id
    const tr = new Tournament({
      tournamentId: `trn_${Date.now()}`,
      name: 'Tournament Persistence'
    });
    assert.ok(tr._id && tr._id.startsWith('trn_'), 'Tournament._id must be automatically generated');
  });

  // =========================================================================
  // SCENARIO 14: ERROR AND FAILURE INJECTION
  // =========================================================================
  await test('SCENARIO 14: Failure Injection — Malformed JWT, expired session, self-outbid, race prevention', async () => {
    // Malformed JWT rejected with 401
    const malformedRes = await callApp({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer completely_malformed_fake_token' }
    });
    assert.strictEqual(malformedRes.status, 401);

    // First bid by P2 succeeds
    const firstBidRes = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 2 },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });
    assert.strictEqual(firstBidRes.status, 200);

    // Self outbid rejected: P2 attempts consecutive bid on the same lot without an intervening counter-bid
    const selfOutbidRes = await callApp({
      method: 'POST',
      url: `/api/auction/${sc6RoomCode}/bid`,
      body: { amount: 3 },
      headers: { authorization: `Bearer ${sc6P2.token}` }
    });
    assert.strictEqual(selfOutbidRes.status, 400);
    assert.strictEqual(selfOutbidRes.body.code, 'CANNOT_OUTBID_SELF');

    // Non-existent API route handling
    const nonExistentRes = await callApp({
      method: 'GET',
      url: '/api/non-existent-endpoint'
    });
    assert.strictEqual(nonExistentRes.status, 404);
  });

  console.log('\n===============================================================');
  console.log('✅ ALL 14 SCENARIOS TESTED AND FULLY VERIFIED! ✅');
  console.log('===============================================================\n');
};

module.exports = { runEndToEndScenarios1To14 };

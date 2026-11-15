const storeService = require('./storeService');
const { getStadiumById, getAllStadiums } = require('../data/stadiumsData');
const {
  calculateConditionMultipliers,
  calculateDLSRevision,
  calculateTestSessionAndDay,
  canEnforceFollowOn,
  getFormatPowerplayStage,
  getMaxBowlerLimitForFormat,
  evaluateBowlerFatigue
} = require('./stadiumConditionsService');
const { generateMultiPersonalityCommentary } = require('./commentaryService');
const {
  calculateWagonWheelCoords,
  calculatePitchMapCoords,
  aggregateManhattanData,
  aggregatePartnerships,
  aggregateFallOfWickets,
  aggregateBowlingFigures,
  aggregateBattingFigures,
  extractHighlights,
  comparePlayers,
  generateMatchSummary
} = require('./analyticsService');
const {
  calculatePartnershipChemistry,
  evaluateActiveAbilities,
  generateDynamicMatchEvent,
  generateMatchDocumentary,
  generateScoutingReport
} = require('./advancedGameSystemService');

// ==========================================
// PHASE 8, 9 & 10: MATCH ENGINE, STADIUM CONDITIONS & BROADCAST ANALYTICS
// ==========================================

// 1. Deterministic Pseudo-Random Number Generator (Mulberry32)
// Guarantees identical random values for any client/server with the same seed
function createSeededRandom(seed) {
  let s = 0;
  if (typeof seed === 'string') {
    for (let i = 0; i < seed.length; i++) {
      s = (Math.imul(31, s) + seed.charCodeAt(i)) | 0;
    }
  } else {
    s = (seed || 0) | 0;
  }
  return function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In-Memory Engine State Cache (Active Matches, Event Logs, Idempotency Sets)
const activeMatchEngines = new Map();

/**
 * Get or initialize the active match engine state
 */
const getOrCreateMatchEngine = async (matchId) => {
  if (activeMatchEngines.has(matchId)) {
    return activeMatchEngines.get(matchId);
  }

  // Load from storeService or initialize fresh match instance
  let rawMatch = await storeService.getMatchById(matchId);
  const matchDoc = rawMatch
    ? (typeof rawMatch.toObject === 'function' ? rawMatch.toObject() : { ...rawMatch })
    : { matchId };

  const matchFormat = (matchDoc.format || 'T20').toUpperCase();
  const defaultMaxOvers = matchFormat === 'TEST' ? 450 : (matchFormat === 'ODI' ? 50 : 20);

  // Stadium profile
  const initialStadium = matchDoc.stadium || (matchDoc.stadiumId ? getStadiumById(matchDoc.stadiumId) : getStadiumById('eden_gardens'));

  // Weather profile
  const initialWeather = matchDoc.weather || {
    condition: initialStadium.weatherProfile?.typicalCondition || 'Clear',
    temperature: 29,
    windSpeedKmH: 14,
    windDirection: 'Crosswind',
    humidityPercent: initialStadium.weatherProfile?.humidityPercent || 65,
    isDLSActive: false,
    dlsDetails: null
  };

  // Test match details
  const initialTestDetails = matchDoc.testDetails || {
    day: 1,
    session: 'Morning',
    sessionOvers: 0,
    totalOversInDay: 0,
    totalOversAcrossMatch: 0,
    maxOversPerDay: 90,
    followOnEnforced: false,
    followOnEligible: false,
    declarations: [],
    pitchDeteriorationLevel: 1
  };

  // Tactical timeouts
  const initialTimeouts = matchDoc.tacticalTimeouts || {
    teamATimeoutsUsed: 0,
    teamBTimeoutsUsed: 0,
    isTimeoutActive: false,
    timeoutRemainingSec: 0
  };

  const engineState = {
    matchId: matchDoc.matchId || matchId,
    title: matchDoc.title || 'Multiplayer Championship Match',
    venue: initialStadium.fullName || matchDoc.venue || 'Eden Gardens, Kolkata (Night)',
    format: matchFormat,
    status: matchDoc.status || 'live',
    seed: matchDoc.seed || `seed_${matchId}_2026`,
    seq: matchDoc.seq || 0,
    currentInnings: matchDoc.currentInnings || 1,
    targetScore: matchDoc.targetScore || null,
    battingTeamKey: matchDoc.battingTeamKey || 'teamA',
    bowlingTeamKey: matchDoc.bowlingTeamKey || 'teamB',
    battingUserId: matchDoc.battingUserId || null,
    bowlingUserId: matchDoc.bowlingUserId || null,
    turnPhase: matchDoc.turnPhase || 'waiting_bowling',
    currentDeliverySeq: 1,
    currentTurn: {
      deliverySeq: 1,
      bowlingDecision: null,
      battingDecision: null
    },
    stadium: { ...initialStadium },
    weather: { ...initialWeather },
    testDetails: { ...initialTestDetails },
    tacticalTimeouts: { ...initialTimeouts },
    inningsHistory: matchDoc.inningsHistory || [],
    bowlerFatigue: matchDoc.bowlerFatigue || {},
    teamA: {
      name: matchDoc.teamA?.name || 'Bangalore Royal Titans',
      shortCode: matchDoc.teamA?.shortCode || 'BRT',
      score: matchDoc.teamA?.score || 0,
      wickets: matchDoc.teamA?.wickets || 0,
      overs: matchDoc.teamA?.overs || 0,
      maxOvers: matchDoc.teamA?.maxOvers || defaultMaxOvers,
      color: matchDoc.teamA?.color || '#DC2626'
    },
    teamB: {
      name: matchDoc.teamB?.name || 'Mumbai Kings XI',
      shortCode: matchDoc.teamB?.shortCode || 'MKX',
      score: matchDoc.teamB?.score || 0,
      wickets: matchDoc.teamB?.wickets || 0,
      overs: matchDoc.teamB?.overs || 0,
      maxOvers: matchDoc.teamB?.maxOvers || defaultMaxOvers,
      color: matchDoc.teamB?.color || '#2563EB'
    },
    currentStriker: {
      name: matchDoc.currentStriker?.name || 'Virat Kohli',
      runs: matchDoc.currentStriker?.runs || 0,
      balls: matchDoc.currentStriker?.balls || 0,
      fours: matchDoc.currentStriker?.fours || 0,
      sixes: matchDoc.currentStriker?.sixes || 0,
      ovr: matchDoc.currentStriker?.ovr || 115
    },
    currentNonStriker: {
      name: matchDoc.currentNonStriker?.name || 'Glenn Maxwell',
      runs: matchDoc.currentNonStriker?.runs || 0,
      balls: matchDoc.currentNonStriker?.balls || 0,
      fours: matchDoc.currentNonStriker?.fours || 0,
      sixes: matchDoc.currentNonStriker?.sixes || 0,
      ovr: matchDoc.currentNonStriker?.ovr || 108
    },
    currentBowler: {
      name: matchDoc.currentBowler?.name || 'Jasprit Bumrah',
      overs: matchDoc.currentBowler?.overs || 0,
      maidens: matchDoc.currentBowler?.maidens || 0,
      runs: matchDoc.currentBowler?.runs || 0,
      wickets: matchDoc.currentBowler?.wickets || 0,
      ovr: matchDoc.currentBowler?.ovr || 118
    },
    recentBalls: matchDoc.recentBalls || [],
    commentary: matchDoc.commentary || [],
    wormData: matchDoc.wormData || [{ over: 0, teamAScore: 0, teamBScore: 0 }],
    result: matchDoc.result || '',
    tacticalBreak: matchDoc.tacticalBreak || 'live',
    teamATactics: matchDoc.teamATactics || {},
    teamBTactics: matchDoc.teamBTactics || {},
    participants: matchDoc.participants || [],
    maxPlayers: 6, // FIXED CAPACITY: Maximum 6 active players
    commentaryPersonality: matchDoc.commentaryPersonality || 'Professional',
    deliveries: (matchDoc.deliveries && matchDoc.deliveries.length > 0)
      ? matchDoc.deliveries
      : generateInitialMatchDeliveries(matchDoc),
    manhattanData: matchDoc.manhattanData || [],
    partnerships: matchDoc.partnerships || [],
    fallOfWickets: matchDoc.fallOfWickets || [],
    bowlingScorecard: matchDoc.bowlingScorecard || [],
    battingScorecard: matchDoc.battingScorecard || [],
    highlights: matchDoc.highlights || [],
    matchSummary: matchDoc.matchSummary || null,
    eventLog: [],
    processedActionIds: new Set()
  };

  // Pre-calculate aggregates if empty
  if (engineState.manhattanData.length === 0 && engineState.deliveries.length > 0) {
    engineState.manhattanData = aggregateManhattanData(engineState.deliveries);
    engineState.partnerships = aggregatePartnerships(engineState.deliveries);
    engineState.fallOfWickets = aggregateFallOfWickets(engineState.deliveries);
    engineState.bowlingScorecard = aggregateBowlingFigures(engineState.deliveries);
    engineState.battingScorecard = aggregateBattingFigures(engineState.deliveries);
    engineState.highlights = extractHighlights(engineState.deliveries);
  }

  activeMatchEngines.set(matchId, engineState);
  return engineState;
};

// Seed baseline deliveries for live match analytics if none exist
function generateInitialMatchDeliveries(mDoc) {
  const seeds = [
    { over: 0, ball: 1, striker: 'Virat Kohli', bowler: 'Jasprit Bumrah', shotType: 'Drive', direction: 'Cover', pitchLine: 'Off Stump', pitchLength: 'Full', runs: 4, badge: 'FOUR' },
    { over: 0, ball: 2, striker: 'Virat Kohli', bowler: 'Jasprit Bumrah', shotType: 'Defensive Block', direction: 'Mid-off', pitchLine: 'Outside Off', pitchLength: 'Good Length', runs: 0, badge: 'DOT' },
    { over: 1, ball: 3, striker: 'Glenn Maxwell', bowler: 'Mohammed Siraj', shotType: 'Pull / Hook', direction: 'Midwicket', pitchLine: 'Leg Stump', pitchLength: 'Short', runs: 6, badge: 'SIX' },
    { over: 2, ball: 4, striker: 'Glenn Maxwell', bowler: 'Jasprit Bumrah', shotType: 'Drive', direction: 'Cover', pitchLine: 'Off Stump', pitchLength: 'Full', runs: 0, isWicket: true, wicketType: 'Bowled', badge: 'WICKET' },
    { over: 3, ball: 1, striker: 'Heinrich Klaasen', bowler: 'Jasprit Bumrah', shotType: 'Cut', direction: 'Point', pitchLine: 'Outside Off', pitchLength: 'Short', runs: 4, badge: 'FOUR' },
    { over: 4, ball: 2, striker: 'Virat Kohli', bowler: 'Mohammed Siraj', shotType: 'Drive', direction: 'Long-off', pitchLine: 'Middle Stump', pitchLength: 'Full', runs: 1, badge: 'SINGLE' },
    { over: 5, ball: 6, striker: 'Heinrich Klaasen', bowler: 'Jasprit Bumrah', shotType: 'Lofted Drive', direction: 'Long-on', pitchLine: 'Middle Stump', pitchLength: 'Good Length', runs: 6, badge: 'SIX' },
    { over: 7, ball: 2, striker: 'Virat Kohli', bowler: 'Mohammed Siraj', shotType: 'Sweep', direction: 'Square Leg', pitchLine: 'Leg Stump', pitchLength: 'Full', runs: 2, badge: 'TWO' },
    { over: 9, ball: 5, striker: 'Heinrich Klaasen', bowler: 'Mohammed Siraj', shotType: 'Lofted Drive', direction: 'Extra Cover', pitchLine: 'Outside Off', pitchLength: 'Full', runs: 4, badge: 'FOUR' },
    { over: 11, ball: 1, striker: 'Virat Kohli', bowler: 'Jasprit Bumrah', shotType: 'Drive', direction: 'Cover', pitchLine: 'Off Stump', pitchLength: 'Good Length', runs: 1, badge: 'SINGLE' },
    { over: 13, ball: 4, striker: 'Heinrich Klaasen', bowler: 'Mohammed Siraj', shotType: 'Lofted Drive', direction: 'Long-on', pitchLine: 'Middle Stump', pitchLength: 'Full', runs: 6, badge: 'SIX' },
    { over: 15, ball: 3, striker: 'Virat Kohli', bowler: 'Mohammed Siraj', shotType: 'Pull / Hook', direction: 'Midwicket', pitchLine: 'Middle Stump', pitchLength: 'Short', runs: 4, badge: 'FOUR' },
    { over: 17, ball: 1, striker: 'Heinrich Klaasen', bowler: 'Jasprit Bumrah', shotType: 'Lofted Drive', direction: 'Long-on', pitchLine: 'Off Stump', pitchLength: 'Full', runs: 6, badge: 'SIX' },
    { over: 17, ball: 6, striker: 'Virat Kohli', bowler: 'Jasprit Bumrah', shotType: 'Cut', direction: 'Third Man', pitchLine: 'Outside Off', pitchLength: 'Good Length', runs: 4, badge: 'FOUR' },
    { over: 18, ball: 1, striker: 'Heinrich Klaasen', bowler: 'Jasprit Bumrah', shotType: 'Lofted Drive', direction: 'Long-on', pitchLine: 'Middle Stump', pitchLength: 'Full', runs: 6, badge: 'SIX' },
    { over: 18, ball: 2, striker: 'Virat Kohli', bowler: 'Jasprit Bumrah', shotType: 'Drive', direction: 'Midwicket', pitchLine: 'Middle Stump', pitchLength: 'Yorker', runs: 2, badge: 'TWO' }
  ];

  return seeds.map((s, idx) => {
    const multiCommentary = generateMultiPersonalityCommentary({
      badge: s.badge,
      wicketType: s.wicketType || 'Caught',
      strikerName: s.striker,
      bowlerName: s.bowler,
      direction: s.direction,
      seedNum: idx + 1
    });

    const wagonWheel = calculateWagonWheelCoords({
      direction: s.direction,
      shotType: s.shotType,
      runs: s.runs,
      isWicket: !!s.isWicket,
      boundaryMeters: 70
    });

    const pitchMap = calculatePitchMapCoords({
      pitchLine: s.pitchLine,
      pitchLength: s.pitchLength,
      runs: s.runs,
      isWicket: !!s.isWicket
    });

    return {
      innings: 2,
      over: s.over,
      ball: s.ball,
      overBallStr: `${s.over}.${s.ball}`,
      striker: { name: s.striker, runs: 0, balls: 0, ovr: 115 },
      nonStriker: { name: 'Partner', ovr: 108 },
      bowler: { name: s.bowler, ovr: 118 },
      shotType: s.shotType,
      direction: s.direction,
      pitchLine: s.pitchLine,
      pitchLength: s.pitchLength,
      deliveryTactic: 'Seam',
      timing: 'Good',
      runs: s.runs,
      isWicket: !!s.isWicket,
      wicketType: s.wicketType || null,
      badge: s.badge,
      commentary: multiCommentary,
      wagonWheel,
      pitchMap,
      battingTeamScore: 10 + idx * 11,
      battingTeamWickets: s.isWicket ? 2 : 1,
      timestamp: new Date(Date.now() - (18 - idx) * 90000)
    };
  });
}

/**
 * Join Match as Player (up to 6 active players) or Spectator (unlimited additional users)
 */
const joinMatch = async (matchId, { userId, username, role = 'player', teamKey = 'teamA', socketId = null }) => {
  const match = await getOrCreateMatchEngine(matchId);

  const activePlayers = match.participants.filter(p => p.role === 'player');
  const existingParticipant = match.participants.find(p => p.userId === userId);

  let finalRole = role;

  if (existingParticipant) {
    // Reconnection recovery: restore role and update socket
    existingParticipant.socketId = socketId || existingParticipant.socketId;
    existingParticipant.isConnected = true;
    finalRole = existingParticipant.role;
  } else {
    // New participant join: enforce maximum 6 active players
    if (role === 'player') {
      if (activePlayers.length >= match.maxPlayers) {
        // Seventh Person Rule: Must join as spectator
        finalRole = 'spectator';
      } else {
        finalRole = 'player';
      }
    } else {
      finalRole = 'spectator';
    }

    const newParticipant = {
      userId: userId || `guest_${Date.now()}`,
      username: username || (finalRole === 'player' ? `Player ${match.participants.length + 1}` : `Spectator ${Date.now().toString().slice(-4)}`),
      role: finalRole,
      teamKey: finalRole === 'player' ? teamKey : 'spectator',
      socketId,
      isConnected: true,
      joinedAt: new Date()
    };

    match.participants.push(newParticipant);

    // Auto-assign batting and bowling user IDs if not yet assigned
    if (finalRole === 'player') {
      if (!match.battingUserId && newParticipant.teamKey === match.battingTeamKey) {
        match.battingUserId = newParticipant.userId;
      } else if (!match.bowlingUserId && newParticipant.teamKey === match.bowlingTeamKey) {
        match.bowlingUserId = newParticipant.userId;
      }
    }
  }

  // Record join event in eventLog
  match.seq += 1;
  const joinEvent = {
    seq: match.seq,
    type: 'USER_JOINED_MATCH',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      userId,
      username: existingParticipant?.username || username,
      role: finalRole,
      activePlayersCount: match.participants.filter(p => p.role === 'player').length,
      spectatorsCount: match.participants.filter(p => p.role === 'spectator').length
    }
  };
  match.eventLog.push(joinEvent);

  const snapshot = getMatchSnapshot(matchId);
  return {
    match,
    participantRole: finalRole,
    snapshot,
    event: joinEvent
  };
};

/**
 * Generate full authoritative snapshot of the match state
 */
const getMatchSnapshot = (matchId) => {
  const match = activeMatchEngines.get(matchId);
  if (!match) return null;

  const currentBatting = match.battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  const currentBowling = match.bowlingTeamKey === 'teamA' ? match.teamA : match.teamB;

  const isEvening = match.testDetails?.session === 'Evening' || match.weather?.condition === 'Humid';
  const conditions = calculateConditionMultipliers({
    stadiumId: match.stadium?.id || 'eden_gardens',
    pitchType: match.stadium?.pitchType || 'Turning',
    weather: match.weather?.condition || 'Clear',
    dayOfTest: match.testDetails?.day || 1,
    isEveningSession: isEvening
  });

  const powerplayStage = getFormatPowerplayStage(currentBatting.overs, match.format);
  const maxBowlerLimit = getMaxBowlerLimitForFormat(match.format, currentBatting.maxOvers);

  return {
    matchId: match.matchId,
    title: match.title,
    venue: match.venue,
    format: match.format,
    status: match.status,
    seed: match.seed,
    seq: match.seq,
    currentInnings: match.currentInnings,
    targetScore: match.targetScore,
    battingTeamKey: match.battingTeamKey,
    bowlingTeamKey: match.bowlingTeamKey,
    battingUserId: match.battingUserId,
    bowlingUserId: match.bowlingUserId,
    turnPhase: match.turnPhase,
    currentDeliverySeq: match.currentDeliverySeq,
    currentTurn: {
      ...match.currentTurn
    },
    stadium: { ...match.stadium },
    weather: { ...match.weather },
    testDetails: { ...match.testDetails },
    tacticalTimeouts: { ...match.tacticalTimeouts },
    inningsHistory: [...match.inningsHistory],
    bowlerFatigue: { ...match.bowlerFatigue },
    conditions,
    powerplayStage,
    maxBowlerLimit,
    teamA: { ...match.teamA },
    teamB: { ...match.teamB },
    currentBattingScore: {
      name: currentBatting.name,
      score: currentBatting.score,
      wickets: currentBatting.wickets,
      overs: currentBatting.overs,
      maxOvers: currentBatting.maxOvers
    },
    currentBowlingFigures: {
      name: currentBowling.name,
      overs: currentBowling.overs,
      runs: currentBowling.runs || 0,
      wickets: currentBowling.wickets || 0
    },
    currentStriker: { ...match.currentStriker },
    currentNonStriker: { ...match.currentNonStriker },
    currentBowler: { ...match.currentBowler },
    recentBalls: [...match.recentBalls],
    commentary: match.commentary.slice(0, 20),
    commentaryPersonality: match.commentaryPersonality || 'Professional',
    deliveries: match.deliveries || [],
    manhattanData: match.manhattanData || [],
    partnerships: match.partnerships || [],
    fallOfWickets: match.fallOfWickets || [],
    bowlingScorecard: match.bowlingScorecard || [],
    battingScorecard: match.battingScorecard || [],
    highlights: match.highlights || [],
    matchSummary: match.matchSummary || null,
    wormData: [...match.wormData],
    result: match.result,
    // Phase 12: Advanced Systems Telemetry
    dynamicEvents: match.dynamicEvents || [],
    crowdAtmosphere: match.crowdAtmosphere || { excitementLevel: 75, noiseDecibels: 85, currentChant: 'CRICKET-VERSE!', mood: 'Electric' },
    activeAbilities: match.activeAbilities || [],
    partnershipChemistry: match.partnershipChemistry || null,
    participants: match.participants.map(p => ({
      userId: p.userId,
      username: p.username,
      role: p.role,
      teamKey: p.teamKey,
      isConnected: p.isConnected
    })),
    activePlayersCount: match.participants.filter(p => p.role === 'player').length,
    spectatorsCount: match.participants.filter(p => p.role === 'spectator').length,
    timestamp: new Date().toISOString()
  };
};

/**
 * Verify participant action permissions:
 * Spectators are strictly read-only and CANNOT submit player controls!
 */
const verifyActionPermission = (match, userId, actionName) => {
  const participant = match.participants.find(p => p.userId === userId);
  if (!participant) {
    // If not found as participant, check if valid host
    return;
  }

  if (participant.role === 'spectator') {
    const err = new Error(`Action denied: Spectators are in read-only mode and cannot perform '${actionName}'.`);
    err.status = 403;
    err.code = 'SPECTATOR_READ_ONLY';
    throw err;
  }
};

/**
 * Submit Bowling Decision (Phase A of delivery turn)
 */
const submitBowlingDecision = async (matchId, userId, {
  deliverySeq,
  line = 'Off Stump',
  length = 'Good Length',
  variation = 'Seam',
  idempotencyKey = null
}) => {
  const match = await getOrCreateMatchEngine(matchId);

  // 1. Spectator Permission Check
  verifyActionPermission(match, userId, 'submit bowling decision');

  // 2. Timeout Check
  if (match.tacticalTimeouts?.isTimeoutActive) {
    const err = new Error('Tactical timeout in progress. Resume timeout before bowling.');
    err.status = 400;
    err.code = 'TIMEOUT_ACTIVE';
    throw err;
  }

  // 3. Duplicate / Idempotency Check
  if (idempotencyKey && match.processedActionIds.has(idempotencyKey)) {
    return {
      duplicate: true,
      seq: match.seq,
      snapshot: getMatchSnapshot(matchId)
    };
  }

  // 4. Turn Phase Check
  if (match.turnPhase !== 'waiting_bowling') {
    const err = new Error(`Invalid turn phase '${match.turnPhase}'. Expected 'waiting_bowling'.`);
    err.status = 400;
    err.code = 'INVALID_TURN_PHASE';
    throw err;
  }

  // 5. Player Authorization Check: only bowling player or host can bowl
  if (match.bowlingUserId && match.bowlingUserId !== userId) {
    const participant = match.participants.find(p => p.userId === userId);
    if (participant && participant.teamKey !== match.bowlingTeamKey) {
      const err = new Error('Unauthorized: You are not assigned to the bowling team for this turn.');
      err.status = 403;
      err.code = 'NOT_YOUR_TURN';
      throw err;
    }
  }

  // 6. Input validation
  const VALID_LINES = ['Outside Off', 'Off Stump', 'Middle Stump', 'Leg Stump'];
  const VALID_LENGTHS = ['Yorker', 'Full', 'Good Length', 'Short'];
  const VALID_VARIATIONS = ['Yorker', 'Bouncer', 'Swing', 'Seam', 'Slower ball', 'Off-spin', 'Leg-spin'];

  if (!VALID_LINES.includes(line)) {
    const err = new Error(`Invalid pitch line '${line}'.`);
    err.status = 400;
    err.code = 'INVALID_PITCH_LINE';
    throw err;
  }
  if (!VALID_LENGTHS.includes(length)) {
    const err = new Error(`Invalid pitch length '${length}'.`);
    err.status = 400;
    err.code = 'INVALID_PITCH_LENGTH';
    throw err;
  }
  if (!VALID_VARIATIONS.includes(variation)) {
    const err = new Error(`Invalid variation '${variation}'.`);
    err.status = 400;
    err.code = 'INVALID_VARIATION';
    throw err;
  }

  if (idempotencyKey) {
    match.processedActionIds.add(idempotencyKey);
  }

  match.currentTurn.bowlingDecision = {
    line,
    length,
    variation,
    userId,
    timestamp: new Date().toISOString()
  };

  match.turnPhase = 'waiting_batting';
  match.seq += 1;

  const event = {
    seq: match.seq,
    type: 'BOWLING_COMMITTED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      deliverySeq: match.currentTurn.deliverySeq,
      bowlingDecision: { line, length, variation },
      nextTurn: 'waiting_batting',
      battingUserId: match.battingUserId
    }
  };
  match.eventLog.push(event);

  return {
    success: true,
    event,
    nextPhase: 'waiting_batting',
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Submit Batting Decision & Resolve Authoritative Delivery (Phase B & C of turn)
 */
const submitBattingDecision = async (matchId, userId, {
  deliverySeq,
  shotType = 'Drive',
  direction = 'Cover',
  timing = 'Good',
  runsAttempted = 1,
  riskyRun = false,
  idempotencyKey = null
}) => {
  const match = await getOrCreateMatchEngine(matchId);

  // 1. Spectator Permission Check
  verifyActionPermission(match, userId, 'submit batting decision');

  // 2. Timeout Check
  if (match.tacticalTimeouts?.isTimeoutActive) {
    const err = new Error('Tactical timeout in progress. Resume timeout before batting.');
    err.status = 400;
    err.code = 'TIMEOUT_ACTIVE';
    throw err;
  }

  // 3. Duplicate / Idempotency Check
  if (idempotencyKey && match.processedActionIds.has(idempotencyKey)) {
    return {
      duplicate: true,
      seq: match.seq,
      snapshot: getMatchSnapshot(matchId)
    };
  }

  // 4. Turn Phase Check
  if (match.turnPhase !== 'waiting_batting') {
    const err = new Error(`Invalid turn phase '${match.turnPhase}'. Expected 'waiting_batting'.`);
    err.status = 400;
    err.code = 'INVALID_TURN_PHASE';
    throw err;
  }

  // 5. Player Authorization Check: only batting player or host can bat
  if (match.battingUserId && match.battingUserId !== userId) {
    const participant = match.participants.find(p => p.userId === userId);
    if (participant && participant.teamKey !== match.battingTeamKey) {
      const err = new Error('Unauthorized: You are not assigned to the batting team for this turn.');
      err.status = 403;
      err.code = 'NOT_YOUR_TURN';
      throw err;
    }
  }

  // 6. Input Validation
  const VALID_SHOTS = ['Drive', 'Lofted Drive', 'Pull / Hook', 'Cut', 'Sweep', 'Defensive Block', 'Ramp / Scoop'];
  const VALID_TIMINGS = ['Early', 'Good', 'Perfect', 'Late'];

  if (!VALID_SHOTS.includes(shotType)) {
    const err = new Error(`Invalid shot type '${shotType}'. Valid: ${VALID_SHOTS.join(', ')}.`);
    err.status = 400;
    err.code = 'INVALID_SHOT_TYPE';
    throw err;
  }
  if (!VALID_TIMINGS.includes(timing)) {
    const err = new Error(`Invalid timing '${timing}'. Valid: ${VALID_TIMINGS.join(', ')}.`);
    err.status = 400;
    err.code = 'INVALID_TIMING';
    throw err;
  }

  if (idempotencyKey) {
    match.processedActionIds.add(idempotencyKey);
  }

  const bowlingDecision = match.currentTurn.bowlingDecision || {
    line: 'Off Stump',
    length: 'Good Length',
    variation: 'Seam'
  };

  match.currentTurn.battingDecision = {
    shotType,
    direction,
    timing,
    runsAttempted,
    userId,
    timestamp: new Date().toISOString()
  };

  match.turnPhase = 'resolving';

  // Deterministic Seeded Physics Resolution
  const deliverySeed = `${match.seed}_inn${match.currentInnings}_ball${match.currentTurn.deliverySeq}`;
  const rng = createSeededRandom(deliverySeed);

  const strikerName = match.currentStriker?.name || 'Striker';
  const bowlerName = match.currentBowler?.name || 'Bowler';
  const strikerOvr = match.currentStriker?.ovr || 115;
  const bowlerOvr = match.currentBowler?.ovr || 118;

  // Compute active physics multipliers
  const isEvening = match.testDetails?.session === 'Evening' || match.weather?.condition === 'Humid';
  const conditions = calculateConditionMultipliers({
    stadiumId: match.stadium?.id || 'eden_gardens',
    pitchType: match.stadium?.pitchType || 'Turning',
    weather: match.weather?.condition || 'Clear',
    dayOfTest: match.testDetails?.day || 1,
    isEveningSession: isEvening
  });

  let outcome = null;

  const isTimingPerfect = timing === 'Perfect';
  const isTimingGood = timing === 'Good';
  const isTimingLate = timing === 'Late';
  const isTimingEarly = timing === 'Early';

  const isBouncerHazard = bowlingDecision.length === 'Short' && (shotType === 'Drive' || shotType === 'Defensive Block');
  const isYorkerHazard = bowlingDecision.length === 'Yorker' && (shotType === 'Pull / Hook' || shotType === 'Sweep');
  const isSpinHazard = (bowlingDecision.variation === 'Off-spin' || bowlingDecision.variation === 'Leg-spin') &&
                       (shotType === 'Ramp / Scoop' || shotType === 'Lofted Drive') && !isTimingPerfect;

  // Dew impact: slick ball reduces spin stumping hazard
  const isDewActive = conditions.isEveningSession && match.stadium?.dewConditions?.hasEveningDew;
  const isSpinStumpingHazard = isSpinHazard && !isDewActive;

  // Swing hazard: Green pitch & Overcast conditions boost swing edge wickets
  const isSwingHazard = (conditions.swingMultiplier >= 1.25) && (bowlingDecision.variation === 'Swing' || bowlingDecision.variation === 'Seam');

  // Cracked pitch / Days 4-5 variable bounce: shooters stay low -> bowled/lbw
  const isCrackedPitchHazard = (conditions.pitchType === 'Cracked' || conditions.dayOfTest >= 4) &&
                               (bowlingDecision.length === 'Good Length' || bowlingDecision.length === 'Full');

  if (isTimingPerfect) {
    if (shotType === 'Lofted Drive' || shotType === 'Pull / Hook') {
      // On colossal grounds (MCG: boundaryDifficulty >= 1.25), requires exceptional batter OVR to clear 88m!
      if (conditions.boundaryDifficulty >= 1.25 && strikerOvr < 105 && rng() < 0.25) {
        outcome = {
          ball: '4',
          runs: 4,
          isWicket: false,
          wicketType: null,
          badge: 'FOUR',
          commentary: `Magnificent strike! But the huge ${match.stadium?.name || 'stadium'} boundaries hold it up—one bounce over the rope for FOUR!`
        };
      } else {
        outcome = {
          ball: '6',
          runs: 6,
          isWicket: false,
          wicketType: null,
          badge: 'SIX',
          commentary: `MAXIMUM! ${strikerName} connected with pristine perfection! The ball sails 102 meters into the stands for SIX!`
        };
      }
    } else if (shotType === 'Defensive Block') {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Solid defense. ${strikerName} meets the ball cleanly under the eyes. Dot ball.`
      };
    } else {
      outcome = {
        ball: '4',
        runs: 4,
        isWicket: false,
        wicketType: null,
        badge: 'FOUR',
        commentary: `GLORIOUS SHOT! Timed to perfection, bulleting through the fielders for FOUR!`
      };
    }
  } else if (isTimingGood) {
    if (shotType === 'Lofted Drive') {
      const powerRoll = rng() * 100;
      // Stadium boundary factor: MCG (1.38) makes six harder; Chinnaswamy (0.82) makes six easier!
      const sixHurdle = 50 * conditions.boundaryDifficulty;
      if (powerRoll >= sixHurdle && strikerOvr >= 105) {
        outcome = {
          ball: '6',
          runs: 6,
          isWicket: false,
          wicketType: null,
          badge: 'SIX',
          commentary: `High and handsome! Power hitting carries the ball just beyond the boundary rope for SIX!`
        };
      } else if (conditions.boundaryDifficulty >= 1.25 && powerRoll < 30) {
        // Deep boundary catch hazard at massive venues
        outcome = {
          ball: 'W',
          runs: 0,
          isWicket: true,
          wicketType: 'Caught',
          badge: 'WICKET',
          commentary: `OUT! CAUGHT AT THE ROPE! The colossal ${match.stadium?.name || 'stadium'} outfield claims another victim! Taken just inside the boundary!`
        };
      } else if (powerRoll >= 35) {
        outcome = {
          ball: '4',
          runs: 4,
          isWicket: false,
          wicketType: null,
          badge: 'FOUR',
          commentary: `One bounce over the boundary! Cracking lofted drive into the gap for FOUR!`
        };
      } else {
        outcome = {
          ball: '2',
          runs: 2,
          isWicket: false,
          wicketType: null,
          badge: 'TWO',
          commentary: `Deep into the pocket! Great placement yields a brace.`
        };
      }
    } else if (shotType === 'Defensive Block') {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Defended softly onto the pitch. No run.`
      };
    } else {
      // Ground shots on wet dew outfield travel faster to boundary
      if (isDewActive && rng() > 0.65) {
        outcome = {
          ball: '4',
          runs: 4,
          isWicket: false,
          wicketType: null,
          badge: 'FOUR',
          commentary: `Skidding off the dew-slick outfield! The wet grass accelerates the ball across the boundary for FOUR!`
        };
      } else {
        const runs = runsAttempted >= 2 ? 2 : 1;
        outcome = {
          ball: String(runs),
          runs,
          isWicket: false,
          wicketType: null,
          badge: runs === 2 ? 'TWO' : 'SINGLE',
          commentary: `Crisp stroke into the outfield. Rapid running between wickets yields ${runs} run${runs > 1 ? 's' : ''}.`
        };
      }
    }
  } else if (isTimingLate || isTimingEarly) {
    if (isCrackedPitchHazard && isTimingLate && rng() < 0.65) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: rng() > 0.5 ? 'LBW' : 'Bowled',
        badge: 'WICKET',
        commentary: `OUT! UNPLAYABLE SHOOTER! The cracked Day ${match.testDetails?.day || 4} pitch keeps unpredictably low! Stumps shattered!`
      };
    } else if (bowlingDecision.line === 'Middle Stump' && (bowlingDecision.length === 'Yorker' || bowlingDecision.variation === 'Yorker') && isTimingLate) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'LBW',
        badge: 'WICKET',
        commentary: `OUT! LBW! Trapped plumb in front of middle stump by ${bowlerName}'s deadly Yorker! Umpire raises the finger!`
      };
    } else if (isYorkerHazard || (bowlingDecision.length === 'Yorker' && isTimingLate)) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Bowled',
        badge: 'WICKET',
        commentary: `OUT! BOWLED! Yorker beats the late bat and shatters the timber! What a delivery by ${bowlerName}!`
      };
    } else if (isSpinStumpingHazard) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Stumped',
        badge: 'WICKET',
        commentary: `OUT! STUMPED! Deceived by the flight and sharp spin on this turning pitch, keeper whips off bails!`
      };
    } else if (isBouncerHazard || isTimingEarly) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Caught',
        badge: 'WICKET',
        commentary: `OUT! CAUGHT! Early mistimed stroke loops into the air and is comfortably taken by the fielder!`
      };
    } else if (isTimingLate && (isSwingHazard || bowlingDecision.variation === 'Swing' || bowlingDecision.variation === 'Seam')) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Caught',
        badge: 'WICKET',
        commentary: `OUT! EDGED AND CAUGHT! Heavy lateral movement produces a thick nick straight to the slips!`
      };
    } else {
      outcome = {
        ball: '0',
        runs: 0,
        isWicket: false,
        wicketType: null,
        badge: 'DOT',
        commentary: `Beaten for pace! The ball whistles past the outside edge. Dot ball.`
      };
    }
  }

  // Deterministic Run-Out Check when running 2
  if (runsAttempted >= 2 && !outcome.isWicket && outcome.runs > 0) {
    const runoutRoll = rng() * 100;
    if (riskyRun || runoutRoll > 80) {
      outcome = {
        ball: 'W',
        runs: 1,
        isWicket: true,
        wicketType: 'Run Out',
        badge: 'WICKET',
        commentary: `OUT! RUN OUT! Dangerous second run attempted! Direct hit breaks the stumps while the batter is inches short!`
      };
    }
  }

  // Phase 10: Multi-Personality Commentary & Analytics Telemetry
  const multiCommentary = generateMultiPersonalityCommentary({
    badge: outcome.badge,
    wicketType: outcome.wicketType || 'Caught',
    strikerName,
    bowlerName,
    direction,
    seedNum: match.currentTurn.deliverySeq
  });

  if (multiCommentary[match.commentaryPersonality]) {
    outcome.commentary = multiCommentary[match.commentaryPersonality];
  }

  const wagonWheel = calculateWagonWheelCoords({
    direction,
    shotType,
    runs: outcome.runs,
    isWicket: outcome.isWicket,
    boundaryMeters: match.stadium?.boundaryDimensions?.straightMeters || 70
  });

  const pitchMap = calculatePitchMapCoords({
    pitchLine: bowlingDecision.line,
    pitchLength: bowlingDecision.length,
    runs: outcome.runs,
    isWicket: outcome.isWicket
  });

  // Update Inning Scores
  const battingTeam = match.battingTeamKey === 'teamA' ? match.teamA : match.teamB;
  const bowlingTeam = match.bowlingTeamKey === 'teamA' ? match.teamA : match.teamB;

  const currentOvers = battingTeam.overs;
  const wholeOvers = Math.floor(currentOvers);
  const ballsInOver = Math.round((currentOvers - wholeOvers) * 10);

  let newOvers;
  if (ballsInOver >= 5) {
    newOvers = wholeOvers + 1.0;
  } else {
    newOvers = Number((wholeOvers + (ballsInOver + 1) * 0.1).toFixed(1));
  }

  battingTeam.overs = newOvers;
  battingTeam.score += outcome.runs;
  if (outcome.isWicket) {
    battingTeam.wickets = Math.min(10, battingTeam.wickets + 1);
  }

  // Striker stats
  match.currentStriker.runs += outcome.runs;
  match.currentStriker.balls += 1;
  if (outcome.badge === 'FOUR') match.currentStriker.fours += 1;
  if (outcome.badge === 'SIX') match.currentStriker.sixes += 1;

  // Bowler stats & fatigue
  match.currentBowler.runs += outcome.runs;
  if (outcome.isWicket) match.currentBowler.wickets += 1;
  match.bowlerFatigue[bowlerName] = Number(((match.bowlerFatigue[bowlerName] || 0) + 0.166).toFixed(2));

  // Recent deliveries strip
  match.recentBalls.unshift(outcome.ball);
  if (match.recentBalls.length > 8) match.recentBalls.pop();

  // Test match overs progression & pitch deterioration
  const totalMatchOversBefore = match.testDetails.totalOversAcrossMatch || 0;
  const totalMatchOversNow = Number((totalMatchOversBefore + 0.166).toFixed(2));
  match.testDetails.totalOversAcrossMatch = totalMatchOversNow;

  if (match.format === 'TEST') {
    const dayInfo = calculateTestSessionAndDay(totalMatchOversNow);
    match.testDetails.day = dayInfo.day;
    match.testDetails.session = dayInfo.session;
    match.testDetails.sessionOvers = dayInfo.sessionOvers;
    match.testDetails.pitchDeteriorationLevel = dayInfo.pitchDeteriorationLevel;

    // Pitch deteriorates to Cracked by Day 4 and Day 5
    if (dayInfo.day >= 4 && match.stadium.pitchType !== 'Cracked') {
      match.stadium.pitchType = 'Cracked';
    }
  }

  // Commentary log
  match.commentary.unshift({
    id: `comm_${Date.now()}_${rng()}`,
    over: newOvers.toFixed(1),
    text: `${strikerName} vs ${bowlerName}: ${outcome.commentary}`,
    badge: outcome.badge,
    timestamp: new Date(),
    multiCommentary
  });
  if (match.commentary.length > 25) match.commentary.pop();

  // Phase 10: Store individual delivery telemetry
  const deliveryRecord = {
    innings: match.currentInnings,
    over: wholeOvers,
    ball: ballsInOver + 1,
    overBallStr: `${wholeOvers}.${ballsInOver + 1}`,
    striker: { ...match.currentStriker },
    nonStriker: { ...match.currentNonStriker },
    bowler: { ...match.currentBowler },
    shotType,
    direction,
    pitchLine: bowlingDecision.line,
    pitchLength: bowlingDecision.length,
    deliveryTactic: bowlingDecision.variation,
    timing,
    runs: outcome.runs,
    isWicket: outcome.isWicket,
    wicketType: outcome.wicketType,
    badge: outcome.badge,
    commentary: multiCommentary,
    wagonWheel,
    pitchMap,
    battingTeamScore: battingTeam.score,
    battingTeamWickets: battingTeam.wickets,
    timestamp: new Date()
  };

  // Phase 12: Special Abilities & Partnership Chemistry Telemetry
  try {
    const abilitiesEval = evaluateActiveAbilities({
      striker: match.currentStriker,
      bowler: match.currentBowler,
      matchContext: {
        overNumber: wholeOvers + 1,
        format: match.format,
        currentInnings: match.currentInnings,
        pitchType: match.stadium?.pitchType,
        bowlingLength: bowlingDecision.length,
        shotType,
        isPlayoff: match.isPlayoff,
        isFinal: match.isFinal,
        isRivalry: match.isRivalry
      }
    });
    deliveryRecord.activeAbilities = abilitiesEval;
    match.activeAbilities = [...abilitiesEval.activeStrikerAbilities, ...abilitiesEval.activeBowlerAbilities];

    const partnershipChem = calculatePartnershipChemistry(match.currentStriker, match.currentNonStriker);
    deliveryRecord.partnershipChemistry = partnershipChem;
    match.partnershipChemistry = partnershipChem;

    // Dynamic In-Game Events & Crowd Atmosphere
    const dynamicEvents = generateDynamicMatchEvent(
      { overs: newOvers, currentInnings: match.currentInnings, teamA: match.teamA, teamB: match.teamB, dewEventLogged: match.dewEventLogged },
      outcome
    );
    if (dynamicEvents.length > 0) {
      if (!match.dynamicEvents) match.dynamicEvents = [];
      match.dynamicEvents.unshift(...dynamicEvents);
      if (match.dynamicEvents.length > 10) match.dynamicEvents.pop();
      if (dynamicEvents.some(e => e.type === 'DEW_ONSET')) match.dewEventLogged = true;
    }

    match.crowdAtmosphere = match.crowdAtmosphere || { excitementLevel: 75, noiseDecibels: 85, currentChant: 'CRICKET-VERSE!', mood: 'Electric' };
    if (outcome.badge === 'SIX') {
      match.crowdAtmosphere.excitementLevel = Math.min(100, match.crowdAtmosphere.excitementLevel + 5);
      match.crowdAtmosphere.noiseDecibels = 108;
      match.crowdAtmosphere.mood = 'Frenzied';
    } else if (outcome.isWicket) {
      match.crowdAtmosphere.excitementLevel = Math.min(100, match.crowdAtmosphere.excitementLevel + 8);
      match.crowdAtmosphere.noiseDecibels = 112;
      match.crowdAtmosphere.mood = 'Roaring';
    } else if (outcome.badge === 'FOUR') {
      match.crowdAtmosphere.noiseDecibels = 98;
    }
  } catch (err) {
    console.warn('[MatchEngine] Phase 12 telemetry error:', err.message);
  }

  if (!match.deliveries) match.deliveries = [];
  match.deliveries.push(deliveryRecord);

  // Re-aggregate match metrics from actual delivery data
  match.manhattanData = aggregateManhattanData(match.deliveries);
  match.partnerships = aggregatePartnerships(match.deliveries);
  match.fallOfWickets = aggregateFallOfWickets(match.deliveries);
  match.bowlingScorecard = aggregateBowlingFigures(match.deliveries);
  match.battingScorecard = aggregateBattingFigures(match.deliveries);
  match.highlights = extractHighlights(match.deliveries);
  match.matchSummary = generateMatchSummary(match);

  // Check Innings & Match Conclusions
  let inningsEnded = false;
  let matchCompleted = false;

  if (match.format === 'TEST') {
    // ----------------------------------------------------
    // TEST CRICKET INNINGS & MATCH RESOLUTION (4 Innings)
    // ----------------------------------------------------
    const isDay5Expired = totalMatchOversNow >= 450;

    if (battingTeam.wickets >= 10) {
      inningsEnded = true;

      // Record current innings in history
      match.inningsHistory.push({
        innings: match.currentInnings,
        teamKey: match.battingTeamKey,
        teamName: battingTeam.name,
        score: battingTeam.score,
        wickets: battingTeam.wickets,
        overs: battingTeam.overs,
        declared: false
      });

      if (match.currentInnings === 1) {
        // Innings 1 ends -> Innings 2 starts (Team B bats)
        match.currentInnings = 2;
        swapBattingBowlingSides(match);
        match.turnPhase = 'innings_break';
      } else if (match.currentInnings === 2) {
        // Innings 2 ends
        const team1 = match.teamA;
        const team2 = match.teamB;
        const lead = team1.score - team2.score;

        if (canEnforceFollowOn(team1.score, team2.score, 'TEST')) {
          match.testDetails.followOnEligible = true;
        }

        if (match.testDetails.followOnEnforced) {
          // Follow-on enforced: Team B bats Innings 3 again!
          match.currentInnings = 3;
          match.turnPhase = 'innings_break';
        } else {
          // Normal: Team A bats Innings 3
          match.currentInnings = 3;
          swapBattingBowlingSides(match);
          match.turnPhase = 'innings_break';
        }
      } else if (match.currentInnings === 3) {
        // Innings 3 ends -> Innings 4 starts (Target set)
        match.currentInnings = 4;
        swapBattingBowlingSides(match);

        // Compute 4th innings target
        const inn1 = match.inningsHistory.find(i => i.innings === 1)?.score || 0;
        const inn2 = match.inningsHistory.find(i => i.innings === 2)?.score || 0;
        const inn3 = match.inningsHistory.find(i => i.innings === 3)?.score || 0;

        let target = 0;
        if (match.testDetails.followOnEnforced) {
          target = (inn2 + inn3) - inn1 + 1;
        } else {
          target = (inn1 + inn3) - inn2 + 1;
        }
        match.targetScore = Math.max(1, target);
        match.turnPhase = 'innings_break';
      } else if (match.currentInnings === 4) {
        // Innings 4 ends: all out
        matchCompleted = true;
        match.status = 'completed';
        match.turnPhase = 'completed';
        if (battingTeam.score >= match.targetScore) {
          match.result = `${battingTeam.name} won by ${10 - battingTeam.wickets} wickets!`;
        } else {
          match.result = `${bowlingTeam.name} won by ${match.targetScore - 1 - battingTeam.score} runs!`;
        }
      }
    } else if (match.currentInnings === 4 && battingTeam.score >= match.targetScore) {
      // Chasing team reaches target in 4th innings
      matchCompleted = true;
      match.status = 'completed';
      match.turnPhase = 'completed';
      match.result = `${battingTeam.name} won by ${10 - battingTeam.wickets} wickets!`;
    } else if (isDay5Expired && match.status !== 'completed') {
      // 5 Days (450 overs) completed without target chase or all out
      matchCompleted = true;
      match.status = 'completed';
      match.turnPhase = 'completed';
      match.result = 'Match Drawn! 5 Full Days (450 overs) Completed without a Target Chase.';
    } else {
      match.turnPhase = 'waiting_bowling';
      match.currentDeliverySeq += 1;
      match.currentTurn = { deliverySeq: match.currentDeliverySeq };
    }
  } else {
    // ----------------------------------------------------
    // LIMITED OVERS (ODI & T20) INNINGS & MATCH RESOLUTION
    // ----------------------------------------------------
    if (match.currentInnings === 1) {
      if (battingTeam.wickets >= 10 || newOvers >= battingTeam.maxOvers) {
        inningsEnded = true;
        match.targetScore = battingTeam.score + 1;
        match.currentInnings = 2;

        match.inningsHistory.push({
          innings: 1,
          teamKey: match.battingTeamKey,
          teamName: battingTeam.name,
          score: battingTeam.score,
          wickets: battingTeam.wickets,
          overs: battingTeam.overs,
          declared: false
        });

        swapBattingBowlingSides(match);

        match.turnPhase = 'innings_break';
        match.currentDeliverySeq = 1;
        match.currentTurn = { deliverySeq: 1 };

        match.commentary.unshift({
          id: `comm_innings_break_${Date.now()}`,
          over: newOvers.toFixed(1),
          text: `INNINGS BREAK! ${battingTeam.name} set a target of ${match.targetScore} runs.`,
          badge: 'TARGET',
          timestamp: new Date()
        });
      } else {
        match.turnPhase = 'waiting_bowling';
        match.currentDeliverySeq += 1;
        match.currentTurn = { deliverySeq: match.currentDeliverySeq };
      }
    } else {
      // 2nd Innings Check: Target chased or overs/wickets exhausted
      if (battingTeam.score >= match.targetScore) {
        matchCompleted = true;
        match.status = 'completed';
        match.turnPhase = 'completed';
        match.result = `${battingTeam.name} won by ${10 - battingTeam.wickets} wickets!`;
      } else if (battingTeam.wickets >= 10 || newOvers >= battingTeam.maxOvers) {
        matchCompleted = true;
        match.status = 'completed';
        match.turnPhase = 'completed';
        const defendingTeam = bowlingTeam;
        if (battingTeam.score === match.targetScore - 1) {
          match.result = 'Match Tied! Heading to Super Over!';
        } else {
          match.result = `${defendingTeam.name} won by ${match.targetScore - 1 - battingTeam.score} runs!`;
        }
      } else {
        match.turnPhase = 'waiting_bowling';
        match.currentDeliverySeq += 1;
        match.currentTurn = { deliverySeq: match.currentDeliverySeq };
      }
    }
  }

  // Helper swap
  function swapBattingBowlingSides(m) {
    const tempKey = m.battingTeamKey;
    m.battingTeamKey = m.bowlingTeamKey;
    m.bowlingTeamKey = tempKey;

    const tempUser = m.battingUserId;
    m.battingUserId = m.bowlingUserId;
    m.bowlingUserId = tempUser;

    m.currentDeliverySeq = 1;
    m.currentTurn = { deliverySeq: 1 };
  }

  // Update Worm data
  if (Math.round((newOvers - Math.floor(newOvers)) * 10) === 0 || ballsInOver >= 5) {
    match.wormData.push({
      over: Math.floor(newOvers),
      teamAScore: match.teamA.score,
      teamBScore: match.teamB.score,
      requiredRate: match.targetScore ? Number(((match.targetScore - battingTeam.score) / Math.max(0.1, (battingTeam.maxOvers - newOvers))).toFixed(2)) : 0
    });
  }

  // Visual payload for Phaser 3 rendering & broadcast telemetry
  const deliveryData = {
    shotType,
    direction,
    timing,
    pitchLine: bowlingDecision.line,
    pitchLength: bowlingDecision.length,
    deliveryTactic: bowlingDecision.variation,
    runs: outcome.runs,
    isWicket: outcome.isWicket,
    wicketType: outcome.wicketType,
    badge: outcome.badge,
    commentary: outcome.commentary,
    multiCommentary,
    wagonWheel,
    pitchMap
  };

  // Monotonic Event Sequencing
  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'DELIVERY_RESULT',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      deliverySeq: match.currentTurn.deliverySeq - 1,
      outcome,
      deliveryData,
      inningsEnded,
      matchCompleted,
      targetScore: match.targetScore,
      result: match.result,
      nextTurn: match.turnPhase
    }
  };
  match.eventLog.push(event);

  // Sync back to storeService
  await storeService.updateMatch(matchId, {
    status: match.status,
    teamA: match.teamA,
    teamB: match.teamB,
    currentInnings: match.currentInnings,
    targetScore: match.targetScore,
    battingTeamKey: match.battingTeamKey,
    bowlingTeamKey: match.bowlingTeamKey,
    currentStriker: match.currentStriker,
    currentNonStriker: match.currentNonStriker,
    currentBowler: match.currentBowler,
    recentBalls: match.recentBalls,
    commentary: match.commentary,
    wormData: match.wormData,
    result: match.result,
    stadium: match.stadium,
    weather: match.weather,
    testDetails: match.testDetails,
    tacticalTimeouts: match.tacticalTimeouts,
    inningsHistory: match.inningsHistory,
    bowlerFatigue: match.bowlerFatigue,
    deliveries: match.deliveries,
    manhattanData: match.manhattanData,
    partnerships: match.partnerships,
    fallOfWickets: match.fallOfWickets,
    bowlingScorecard: match.bowlingScorecard,
    battingScorecard: match.battingScorecard,
    highlights: match.highlights,
    matchSummary: match.matchSummary,
    commentaryPersonality: match.commentaryPersonality
  });

  return {
    success: true,
    event,
    outcome,
    deliveryData,
    inningsEnded,
    matchCompleted,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Coordinated Single-Turn Delivery (for 1-click execution, tactical mode, or hybrid mode)
 */
const submitFullDeliveryTurn = async (matchId, userId, deliveryInput = {}) => {
  const match = await getOrCreateMatchEngine(matchId);

  // Spectator permission check
  verifyActionPermission(match, userId, 'execute delivery turn');

  // Set bowling decision
  match.turnPhase = 'waiting_bowling';
  await submitBowlingDecision(matchId, match.bowlingUserId || userId, {
    deliverySeq: match.currentDeliverySeq,
    line: deliveryInput.pitchLine || 'Off Stump',
    length: deliveryInput.pitchLength || 'Good Length',
    variation: deliveryInput.deliveryTactic || 'Seam',
    idempotencyKey: deliveryInput.idempotencyKey ? `${deliveryInput.idempotencyKey}_bowl` : null
  });

  // Set batting decision and resolve
  const result = await submitBattingDecision(matchId, match.battingUserId || userId, {
    deliverySeq: match.currentDeliverySeq,
    shotType: deliveryInput.shotType || 'Drive',
    direction: deliveryInput.direction || 'Cover',
    timing: deliveryInput.timing || 'Good',
    runsAttempted: deliveryInput.runsAttempted || 1,
    riskyRun: deliveryInput.riskyRun || false,
    idempotencyKey: deliveryInput.idempotencyKey ? `${deliveryInput.idempotencyKey}_bat` : null
  });

  return result;
};

/**
 * Test Cricket Innings Declaration
 */
const declareInnings = async (matchId, userId) => {
  const match = await getOrCreateMatchEngine(matchId);
  verifyActionPermission(match, userId, 'declare innings');

  if (match.format !== 'TEST') {
    const err = new Error('Innings declarations are only permitted in Test Cricket.');
    err.status = 400;
    err.code = 'DECLARATION_NOT_PERMITTED';
    throw err;
  }

  if (match.currentInnings >= 4) {
    const err = new Error('Cannot declare in the 4th innings.');
    err.status = 400;
    err.code = 'INVALID_INNINGS_FOR_DECLARATION';
    throw err;
  }

  const battingTeam = match.battingTeamKey === 'teamA' ? match.teamA : match.teamB;

  // Record declaration
  const declRecord = {
    innings: match.currentInnings,
    teamKey: match.battingTeamKey,
    teamName: battingTeam.name,
    score: battingTeam.score,
    wickets: battingTeam.wickets,
    overs: battingTeam.overs,
    declaredAt: new Date()
  };
  match.testDetails.declarations.push(declRecord);

  match.inningsHistory.push({
    innings: match.currentInnings,
    teamKey: match.battingTeamKey,
    teamName: battingTeam.name,
    score: battingTeam.score,
    wickets: battingTeam.wickets,
    overs: battingTeam.overs,
    declared: true
  });

  // Transition innings
  if (match.currentInnings === 1) {
    match.currentInnings = 2;
    swapSides(match);
  } else if (match.currentInnings === 2) {
    match.currentInnings = 3;
    swapSides(match);
  } else if (match.currentInnings === 3) {
    match.currentInnings = 4;
    swapSides(match);
    // Calculate target
    const inn1 = match.inningsHistory.find(i => i.innings === 1)?.score || 0;
    const inn2 = match.inningsHistory.find(i => i.innings === 2)?.score || 0;
    const inn3 = match.inningsHistory.find(i => i.innings === 3)?.score || 0;
    match.targetScore = Math.max(1, (inn1 + inn3) - inn2 + 1);
  }

  function swapSides(m) {
    const tempKey = m.battingTeamKey;
    m.battingTeamKey = m.bowlingTeamKey;
    m.bowlingTeamKey = tempKey;

    const tempUser = m.battingUserId;
    m.battingUserId = m.bowlingUserId;
    m.bowlingUserId = tempUser;

    m.turnPhase = 'innings_break';
    m.currentDeliverySeq = 1;
    m.currentTurn = { deliverySeq: 1 };
  }

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'INNINGS_DECLARED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      inningsDeclared: match.currentInnings - 1,
      teamKey: battingTeam.name,
      score: battingTeam.score,
      wickets: battingTeam.wickets,
      overs: battingTeam.overs,
      targetScore: match.targetScore
    }
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    currentInnings: match.currentInnings,
    battingTeamKey: match.battingTeamKey,
    bowlingTeamKey: match.bowlingTeamKey,
    testDetails: match.testDetails,
    inningsHistory: match.inningsHistory,
    targetScore: match.targetScore
  });

  return {
    success: true,
    event,
    declared: true,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Test Cricket Follow-On Enforcement
 */
const enforceFollowOn = async (matchId, userId) => {
  const match = await getOrCreateMatchEngine(matchId);
  verifyActionPermission(match, userId, 'enforce follow-on');

  if (match.format !== 'TEST') {
    const err = new Error('Follow-on can only be enforced in Test Cricket.');
    err.status = 400;
    err.code = 'FOLLOW_ON_NOT_ALLOWED';
    throw err;
  }

  const team1 = match.teamA;
  const team2 = match.teamB;
  const lead = team1.score - team2.score;

  if (!canEnforceFollowOn(team1.score, team2.score, 'TEST')) {
    const err = new Error(`Follow-on requires a lead of >= 200 runs. Current lead is ${lead} runs.`);
    err.status = 400;
    err.code = 'LEAD_INSUFFICIENT_FOR_FOLLOW_ON';
    throw err;
  }

  match.testDetails.followOnEnforced = true;
  match.currentInnings = 3;
  // Team B continues batting in 3rd innings!
  match.battingTeamKey = 'teamB';
  match.bowlingTeamKey = 'teamA';
  match.turnPhase = 'waiting_bowling';
  match.currentDeliverySeq = 1;
  match.currentTurn = { deliverySeq: 1 };

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'FOLLOW_ON_ENFORCED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      enforcedBy: team1.name,
      teamBattingAgain: team2.name,
      lead
    }
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    currentInnings: match.currentInnings,
    battingTeamKey: match.battingTeamKey,
    bowlingTeamKey: match.bowlingTeamKey,
    testDetails: match.testDetails
  });

  return {
    success: true,
    event,
    followOnEnforced: true,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * T20 Tactical Timeout (2 per team per innings)
 */
const callTacticalTimeout = async (matchId, userId) => {
  const match = await getOrCreateMatchEngine(matchId);
  verifyActionPermission(match, userId, 'call tactical timeout');

  if (match.format !== 'T20') {
    const err = new Error('Tactical timeouts are only available in T20 format.');
    err.status = 400;
    err.code = 'TIMEOUT_ONLY_T20';
    throw err;
  }

  if (match.tacticalTimeouts.isTimeoutActive) {
    const err = new Error('A tactical timeout is already in progress.');
    err.status = 400;
    err.code = 'TIMEOUT_ALREADY_ACTIVE';
    throw err;
  }

  const participant = match.participants.find(p => p.userId === userId);
  const isTeamA = participant ? participant.teamKey === 'teamA' : true;

  if (isTeamA) {
    if (match.tacticalTimeouts.teamATimeoutsUsed >= 2) {
      const err = new Error('Team A has exhausted all tactical timeouts (2/2 used).');
      err.status = 400;
      err.code = 'TIMEOUTS_EXHAUSTED';
      throw err;
    }
    match.tacticalTimeouts.teamATimeoutsUsed += 1;
  } else {
    if (match.tacticalTimeouts.teamBTimeoutsUsed >= 2) {
      const err = new Error('Team B has exhausted all tactical timeouts (2/2 used).');
      err.status = 400;
      err.code = 'TIMEOUTS_EXHAUSTED';
      throw err;
    }
    match.tacticalTimeouts.teamBTimeoutsUsed += 1;
  }

  match.tacticalTimeouts.isTimeoutActive = true;
  match.tacticalTimeouts.timeoutRemainingSec = 150;

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'TACTICAL_TIMEOUT_CALLED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      calledByTeam: isTeamA ? match.teamA.name : match.teamB.name,
      teamATimeoutsUsed: match.tacticalTimeouts.teamATimeoutsUsed,
      teamBTimeoutsUsed: match.tacticalTimeouts.teamBTimeoutsUsed,
      durationSec: 150
    }
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    tacticalTimeouts: match.tacticalTimeouts
  });

  return {
    success: true,
    event,
    isTimeoutActive: true,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Resume Play after Tactical Timeout
 */
const resumeTacticalTimeout = async (matchId) => {
  const match = await getOrCreateMatchEngine(matchId);
  match.tacticalTimeouts.isTimeoutActive = false;
  match.tacticalTimeouts.timeoutRemainingSec = 0;

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'TACTICAL_TIMEOUT_RESUMED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      isTimeoutActive: false
    }
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    tacticalTimeouts: match.tacticalTimeouts
  });

  return {
    success: true,
    event,
    isTimeoutActive: false,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Simplified DLS Rain Target Adjustment for Limited Overs
 */
const applyDLSRevision = async (matchId, { oversLost = 10, targetTeamOversTotal = 50 }) => {
  const match = await getOrCreateMatchEngine(matchId);

  if (match.format === 'TEST') {
    const err = new Error('DLS method is only applicable in limited overs matches (ODI / T20).');
    err.status = 400;
    err.code = 'DLS_NOT_APPLICABLE_IN_TEST';
    throw err;
  }

  const team1 = match.teamA;
  const dlsResult = calculateDLSRevision({
    team1Score: team1.score || 250,
    team1Overs: team1.overs || targetTeamOversTotal,
    team2OversLost: oversLost,
    targetTeamOversTotal
  });

  match.weather.isDLSActive = true;
  match.weather.dlsDetails = dlsResult;
  match.targetScore = dlsResult.revisedTarget;
  match.teamB.maxOvers = dlsResult.revisedOvers;

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'DLS_REVISION_APPLIED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: dlsResult
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    weather: match.weather,
    targetScore: match.targetScore,
    teamB: match.teamB
  });

  return {
    success: true,
    event,
    dls: dlsResult,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Set Stadium & Weather Conditions
 */
const setStadiumAndConditions = async (matchId, { stadiumId, pitchType, weather, dayOfTest }) => {
  const match = await getOrCreateMatchEngine(matchId);

  if (stadiumId) {
    const s = getStadiumById(stadiumId);
    match.stadium = { ...s };
    match.venue = s.fullName;
  }
  if (pitchType) {
    match.stadium.pitchType = pitchType;
  }
  if (weather) {
    match.weather.condition = weather;
  }
  if (dayOfTest && match.testDetails) {
    match.testDetails.day = dayOfTest;
  }

  match.seq += 1;
  const event = {
    seq: match.seq,
    type: 'CONDITIONS_UPDATED',
    matchId,
    timestamp: new Date().toISOString(),
    payload: {
      stadium: match.stadium.name,
      pitchType: match.stadium.pitchType,
      weather: match.weather.condition,
      dayOfTest: match.testDetails?.day
    }
  };
  match.eventLog.push(event);

  await storeService.updateMatch(matchId, {
    stadium: match.stadium,
    weather: match.weather,
    testDetails: match.testDetails
  });

  return {
    success: true,
    event,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Reconnection Recovery & Event Synchronization
 */
const syncMatch = async (matchId, { fromSeq = 0, userId = null, socketId = null }) => {
  const match = await getOrCreateMatchEngine(matchId);

  if (userId) {
    const participant = match.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isConnected = true;
      if (socketId) participant.socketId = socketId;
    }
  }

  const currentSeq = match.seq;

  // If fromSeq supplied and reasonably recent, send missed events
  if (fromSeq > 0 && fromSeq < currentSeq && (currentSeq - fromSeq) <= 50) {
    const missedEvents = match.eventLog.filter(e => e.seq > fromSeq);
    return {
      mode: 'replay',
      fromSeq,
      latestSeq: currentSeq,
      events: missedEvents,
      snapshot: getMatchSnapshot(matchId)
    };
  }

  // Full snapshot
  return {
    mode: 'snapshot',
    latestSeq: currentSeq,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Switch commentary personality in real-time
 */
const setCommentaryPersonality = async (matchId, personality) => {
  const match = await getOrCreateMatchEngine(matchId);
  const VALID_PERSONALITIES = ['Professional', 'Hype', 'Savage'];
  if (!VALID_PERSONALITIES.includes(personality)) {
    personality = 'Professional';
  }
  match.commentaryPersonality = personality;
  await storeService.updateMatch(matchId, { commentaryPersonality: personality });
  return {
    success: true,
    personality,
    snapshot: getMatchSnapshot(matchId)
  };
};

/**
 * Retrieve comprehensive match analytics for broadcast & telemetry
 */
const getMatchAnalytics = async (matchId) => {
  const match = await getOrCreateMatchEngine(matchId);
  return {
    matchId: match.matchId,
    personality: match.commentaryPersonality || 'Professional',
    deliveries: match.deliveries || [],
    manhattanData: match.manhattanData || [],
    partnerships: match.partnerships || [],
    fallOfWickets: match.fallOfWickets || [],
    bowlingScorecard: match.bowlingScorecard || [],
    battingScorecard: match.battingScorecard || [],
    highlights: match.highlights || [],
    matchSummary: match.matchSummary || generateMatchSummary(match),
    wormData: match.wormData || [],
    stadium: match.stadium,
    weather: match.weather,
    teamA: match.teamA,
    teamB: match.teamB,
    currentStriker: match.currentStriker,
    currentNonStriker: match.currentNonStriker,
    currentBowler: match.currentBowler
  };
};

module.exports = {
  createSeededRandom,
  getOrCreateMatchEngine,
  joinMatch,
  getMatchSnapshot,
  verifyActionPermission,
  submitBowlingDecision,
  submitBattingDecision,
  submitFullDeliveryTurn,
  declareInnings,
  enforceFollowOn,
  callTacticalTimeout,
  resumeTacticalTimeout,
  applyDLSRevision,
  setStadiumAndConditions,
  setCommentaryPersonality,
  getMatchAnalytics,
  comparePlayers,
  syncMatch
};

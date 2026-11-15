const storeService = require('./storeService');

// ==========================================
// PHASE 8: MULTIPLAYER DETERMINISTIC MATCH ENGINE
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

  const engineState = {
    matchId: matchDoc.matchId || matchId,
    title: matchDoc.title || 'Multiplayer Championship Match',
    venue: matchDoc.venue || 'Eden Gardens, Kolkata (Night)',
    format: matchDoc.format || 'T20',
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
    teamA: {
      name: matchDoc.teamA?.name || 'Bangalore Royal Titans',
      shortCode: matchDoc.teamA?.shortCode || 'BRT',
      score: matchDoc.teamA?.score || 0,
      wickets: matchDoc.teamA?.wickets || 0,
      overs: matchDoc.teamA?.overs || 0,
      maxOvers: matchDoc.teamA?.maxOvers || 20,
      color: matchDoc.teamA?.color || '#DC2626'
    },
    teamB: {
      name: matchDoc.teamB?.name || 'Mumbai Kings XI',
      shortCode: matchDoc.teamB?.shortCode || 'MKX',
      score: matchDoc.teamB?.score || 0,
      wickets: matchDoc.teamB?.wickets || 0,
      overs: matchDoc.teamB?.overs || 0,
      maxOvers: matchDoc.teamB?.maxOvers || 20,
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
    eventLog: [],
    processedActionIds: new Set()
  };

  activeMatchEngines.set(matchId, engineState);
  return engineState;
};

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
    wormData: [...match.wormData],
    result: match.result,
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

  // 2. Duplicate / Idempotency Check
  if (idempotencyKey && match.processedActionIds.has(idempotencyKey)) {
    return {
      duplicate: true,
      seq: match.seq,
      snapshot: getMatchSnapshot(matchId)
    };
  }

  // 3. Turn Phase Check
  if (match.turnPhase !== 'waiting_bowling') {
    const err = new Error(`Invalid turn phase '${match.turnPhase}'. Expected 'waiting_bowling'.`);
    err.status = 400;
    err.code = 'INVALID_TURN_PHASE';
    throw err;
  }

  // 4. Player Authorization Check: only bowling player or host can bowl
  if (match.bowlingUserId && match.bowlingUserId !== userId) {
    const participant = match.participants.find(p => p.userId === userId);
    if (participant && participant.teamKey !== match.bowlingTeamKey) {
      const err = new Error('Unauthorized: You are not assigned to the bowling team for this turn.');
      err.status = 403;
      err.code = 'NOT_YOUR_TURN';
      throw err;
    }
  }

  // 5. Input validation
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

  // 2. Duplicate / Idempotency Check
  if (idempotencyKey && match.processedActionIds.has(idempotencyKey)) {
    return {
      duplicate: true,
      seq: match.seq,
      snapshot: getMatchSnapshot(matchId)
    };
  }

  // 3. Turn Phase Check
  if (match.turnPhase !== 'waiting_batting') {
    const err = new Error(`Invalid turn phase '${match.turnPhase}'. Expected 'waiting_batting'.`);
    err.status = 400;
    err.code = 'INVALID_TURN_PHASE';
    throw err;
  }

  // 4. Player Authorization Check: only batting player or host can bat
  if (match.battingUserId && match.battingUserId !== userId) {
    const participant = match.participants.find(p => p.userId === userId);
    if (participant && participant.teamKey !== match.battingTeamKey) {
      const err = new Error('Unauthorized: You are not assigned to the batting team for this turn.');
      err.status = 403;
      err.code = 'NOT_YOUR_TURN';
      throw err;
    }
  }

  // 5. Input Validation
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

  let outcome = null;

  const isTimingPerfect = timing === 'Perfect';
  const isTimingGood = timing === 'Good';
  const isTimingLate = timing === 'Late';
  const isTimingEarly = timing === 'Early';

  const isBouncerHazard = bowlingDecision.length === 'Short' && (shotType === 'Drive' || shotType === 'Defensive Block');
  const isYorkerHazard = bowlingDecision.length === 'Yorker' && (shotType === 'Pull / Hook' || shotType === 'Sweep');
  const isSpinHazard = (bowlingDecision.variation === 'Off-spin' || bowlingDecision.variation === 'Leg-spin') &&
                       (shotType === 'Ramp / Scoop' || shotType === 'Lofted Drive') && !isTimingPerfect;

  if (isTimingPerfect) {
    if (shotType === 'Lofted Drive' || shotType === 'Pull / Hook') {
      outcome = {
        ball: '6',
        runs: 6,
        isWicket: false,
        wicketType: null,
        badge: 'SIX',
        commentary: `MAXIMUM! ${strikerName} connected with pristine perfection! The ball sails 102 meters deep into the stands for SIX!`
      };
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
      // Deterministic power check
      const powerRoll = rng() * 100;
      if (strikerOvr >= 110 || powerRoll > 50) {
        outcome = {
          ball: '6',
          runs: 6,
          isWicket: false,
          wicketType: null,
          badge: 'SIX',
          commentary: `High and handsome! Power hitting carries the ball just beyond the boundary rope for SIX!`
        };
      } else {
        outcome = {
          ball: '4',
          runs: 4,
          isWicket: false,
          wicketType: null,
          badge: 'FOUR',
          commentary: `One bounce over the boundary! Cracking lofted drive into the gap for FOUR!`
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
  } else if (isTimingLate || isTimingEarly) {
    if (bowlingDecision.line === 'Middle Stump' && (bowlingDecision.length === 'Yorker' || bowlingDecision.variation === 'Yorker') && isTimingLate) {
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
    } else if (isSpinHazard) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Stumped',
        badge: 'WICKET',
        commentary: `OUT! STUMPED! Deceived by the flight and sharp spin, wicketkeeper whips off the bails in a flash!`
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
    } else if (isTimingLate && (bowlingDecision.variation === 'Swing' || bowlingDecision.variation === 'Seam')) {
      outcome = {
        ball: 'W',
        runs: 0,
        isWicket: true,
        wicketType: 'Caught',
        badge: 'WICKET',
        commentary: `OUT! EDGED AND CAUGHT! Faint nick carries straight to the keeper!`
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

  // Bowler stats
  match.currentBowler.runs += outcome.runs;
  if (outcome.isWicket) match.currentBowler.wickets += 1;

  // Recent deliveries strip
  match.recentBalls.unshift(outcome.ball);
  if (match.recentBalls.length > 8) match.recentBalls.pop();

  // Commentary log
  match.commentary.unshift({
    id: `comm_${Date.now()}_${rng()}`,
    over: newOvers.toFixed(1),
    text: `${strikerName} vs ${bowlerName}: ${outcome.commentary}`,
    badge: outcome.badge,
    timestamp: new Date()
  });
  if (match.commentary.length > 25) match.commentary.pop();

  // Check Innings & Match Conclusions
  let inningsEnded = false;
  let matchCompleted = false;

  if (match.currentInnings === 1) {
    // End of 1st Innings: 10 wickets down or overs completed
    if (battingTeam.wickets >= 10 || newOvers >= battingTeam.maxOvers) {
      inningsEnded = true;
      match.targetScore = battingTeam.score + 1;
      match.currentInnings = 2;

      // Swap batting and bowling sides
      const tempKey = match.battingTeamKey;
      match.battingTeamKey = match.bowlingTeamKey;
      match.bowlingTeamKey = tempKey;

      const tempUser = match.battingUserId;
      match.battingUserId = match.bowlingUserId;
      match.bowlingUserId = tempUser;

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

  // Update Worm data
  if (Math.round((newOvers - Math.floor(newOvers)) * 10) === 0 || ballsInOver >= 5) {
    match.wormData.push({
      over: Math.floor(newOvers),
      teamAScore: match.teamA.score,
      teamBScore: match.teamB.score,
      requiredRate: match.targetScore ? Number(((match.targetScore - battingTeam.score) / Math.max(0.1, (battingTeam.maxOvers - newOvers))).toFixed(2)) : 0
    });
  }

  // Visual payload for Phaser 3 rendering
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
    commentary: outcome.commentary
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
    result: match.result
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

module.exports = {
  createSeededRandom,
  getOrCreateMatchEngine,
  joinMatch,
  getMatchSnapshot,
  verifyActionPermission,
  submitBowlingDecision,
  submitBattingDecision,
  submitFullDeliveryTurn,
  syncMatch
};

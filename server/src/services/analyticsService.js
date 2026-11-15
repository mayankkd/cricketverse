// ==========================================
// PHASE 10: ADVANCED CRICKET ANALYTICS SERVICE
// Wagon Wheel, Pitch Map, Manhattan, Worm, Partnerships,
// Bowling/Batting Scorecards, Highlights & Match Summary
// ==========================================

const DIRECTION_ANGLES = {
  'Long-off': 0,
  'Mid-off': 345,
  'Extra Cover': 320,
  'Cover': 295,
  'Point': 270,
  'Third Man': 225,
  'Fine Leg': 135,
  'Square Leg': 90,
  'Midwicket': 60,
  'Mid-on': 30,
  'Long-on': 15
};

const PITCH_LINE_COORDS = {
  'Outside Off': -0.45,
  'Off Stump': -0.08,
  'Middle Stump': 0.0,
  'Leg Stump': 0.15
};

const PITCH_LENGTH_COORDS = {
  'Yorker': 0.90,
  'Full': 0.75,
  'Good Length': 0.55,
  'Short': 0.32
};

/**
 * Compute Wagon Wheel coordinates (radial angle and distance)
 */
const calculateWagonWheelCoords = ({ direction = 'Cover', shotType = 'Drive', runs = 1, isWicket = false, boundaryMeters = 70 }) => {
  const baseAngle = DIRECTION_ANGLES[direction] !== undefined ? DIRECTION_ANGLES[direction] : 295;
  // Add small natural jitter (-5° to +5°)
  const jitterAngle = (baseAngle + ((runs * 7) % 11) - 5 + 360) % 360;

  let distanceMeters;
  if (isWicket) {
    distanceMeters = Math.min(boundaryMeters - 2, 20 + ((runs * 13) % 45));
  } else if (runs === 6) {
    distanceMeters = boundaryMeters + 8 + ((runs * 9) % 20); // 78 to 98m
  } else if (runs === 4) {
    distanceMeters = boundaryMeters; // Right at rope
  } else if (runs === 2) {
    distanceMeters = Math.round(boundaryMeters * 0.65);
  } else if (runs === 1) {
    distanceMeters = Math.round(boundaryMeters * 0.45);
  } else {
    distanceMeters = Math.round(boundaryMeters * 0.15); // Infield dot
  }

  return {
    direction,
    angleDeg: jitterAngle,
    distanceMeters,
    runs,
    isWicket
  };
};

/**
 * Compute Pitch Map lateral (X) and length (Y) coordinates
 */
const calculatePitchMapCoords = ({ pitchLine = 'Off Stump', pitchLength = 'Good Length', runs = 0, isWicket = false }) => {
  const baseX = PITCH_LINE_COORDS[pitchLine] !== undefined ? PITCH_LINE_COORDS[pitchLine] : -0.22;
  const baseY = PITCH_LENGTH_COORDS[pitchLength] !== undefined ? PITCH_LENGTH_COORDS[pitchLength] : 0.55;

  // Small landing variance
  const x = Number((baseX + (((runs + 3) * 17) % 7 - 3) * 0.02).toFixed(2));
  const y = Number((baseY + (((runs + 5) * 13) % 7 - 3) * 0.02).toFixed(2));

  return {
    pitchLine,
    pitchLength,
    x,
    y,
    runs,
    isWicket
  };
};

/**
 * Aggregate Manhattan chart data (Runs & Wickets per Over)
 */
const aggregateManhattanData = (deliveries = []) => {
  const overMap = new Map();

  deliveries.forEach(del => {
    const key = `${del.innings || 1}_${del.over}`;
    if (!overMap.has(key)) {
      overMap.set(key, {
        innings: del.innings || 1,
        over: (del.over || 0) + 1, // 1-indexed over number (Over 1, Over 2...)
        runs: 0,
        wickets: 0,
        balls: 0
      });
    }
    const item = overMap.get(key);
    item.runs += del.runs || 0;
    if (del.isWicket) item.wickets += 1;
    item.balls += 1;
  });

  return Array.from(overMap.values()).sort((a, b) => a.over - b.over);
};

/**
 * Aggregate Partnerships across an innings
 */
const aggregatePartnerships = (deliveries = []) => {
  const partnerships = [];
  let currentPartnership = null;
  let wicketCount = 0;

  deliveries.forEach(del => {
    const sName = del.striker?.name || 'Striker';
    const nsName = del.nonStriker?.name || 'NonStriker';

    if (!currentPartnership) {
      currentPartnership = {
        wicketNumber: wicketCount + 1,
        batter1: { name: sName, runs: 0, balls: 0 },
        batter2: { name: nsName, runs: 0, balls: 0 },
        totalRuns: 0,
        totalBalls: 0,
        active: true
      };
    }

    currentPartnership.totalRuns += del.runs || 0;
    currentPartnership.totalBalls += 1;

    if (currentPartnership.batter1.name === sName) {
      currentPartnership.batter1.runs += del.runs || 0;
      currentPartnership.batter1.balls += 1;
    } else if (currentPartnership.batter2.name === sName) {
      currentPartnership.batter2.runs += del.runs || 0;
      currentPartnership.batter2.balls += 1;
    } else {
      // New batter in partnership
      currentPartnership.batter2 = { name: sName, runs: del.runs || 0, balls: 1 };
    }

    if (del.isWicket) {
      currentPartnership.active = false;
      partnerships.push({ ...currentPartnership });
      wicketCount += 1;
      currentPartnership = null;
    }
  });

  if (currentPartnership) {
    partnerships.push(currentPartnership);
  }

  return partnerships;
};

/**
 * Aggregate Fall of Wickets (FOW) timeline
 */
const aggregateFallOfWickets = (deliveries = []) => {
  const fow = [];
  let wCount = 0;

  deliveries.forEach(del => {
    if (del.isWicket) {
      wCount += 1;
      const bName = del.bowler?.name;
      let dismissalText = del.wicketType || 'Caught';
      if (bName) {
        if (dismissalText === 'Bowled') {
          dismissalText = `b ${bName}`;
        } else if (dismissalText === 'Run Out') {
          dismissalText = 'run out';
        } else {
          dismissalText = `${dismissalText} b ${bName}`;
        }
      }

      fow.push({
        wicketNumber: wCount,
        score: del.battingTeamScore || 0,
        over: del.overBallStr || '0.0',
        batterName: del.striker?.name || 'Batter',
        dismissal: dismissalText,
        bowlerName: del.bowler?.name || 'Bowler'
      });
    }
  });

  return fow;
};

/**
 * Aggregate Comprehensive Bowling Figures
 */
const aggregateBowlingFigures = (deliveries = []) => {
  const bowlerMap = new Map();
  const bowlerOverRuns = new Map();

  deliveries.forEach(del => {
    const bName = del.bowler?.name || 'Bowler';
    if (!bowlerMap.has(bName)) {
      bowlerMap.set(bName, {
        name: bName,
        ovr: del.bowler?.ovr || 115,
        photoUrl: del.bowler?.photoUrl || null,
        balls: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        dots: 0,
        fours: 0,
        sixes: 0,
        economy: 0
      });
      bowlerOverRuns.set(bName, new Map());
    }

    const b = bowlerMap.get(bName);
    b.balls += 1;
    b.runs += del.runs || 0;
    if (del.isWicket && del.wicketType !== 'Run Out') b.wickets += 1;
    if ((del.runs || 0) === 0) b.dots += 1;
    if (del.runs === 4) b.fours += 1;
    if (del.runs === 6) b.sixes += 1;

    const overIdx = del.over !== undefined ? del.over : Math.floor((b.balls - 1) / 6);
    const boMap = bowlerOverRuns.get(bName);
    if (!boMap.has(overIdx)) {
      boMap.set(overIdx, { balls: 0, runs: 0 });
    }
    const oData = boMap.get(overIdx);
    oData.balls += 1;
    oData.runs += (del.runs || 0);
  });

  for (const [bName, boMap] of bowlerOverRuns.entries()) {
    let maidenCount = 0;
    for (const oData of boMap.values()) {
      if (oData.balls >= 6 && oData.runs === 0) {
        maidenCount += 1;
      }
    }
    if (bowlerMap.has(bName)) {
      bowlerMap.get(bName).maidens = maidenCount;
    }
  }

  const figures = Array.from(bowlerMap.values()).map(b => {
    const wholeOvers = Math.floor(b.balls / 6);
    const remBalls = b.balls % 6;
    const oversStr = `${wholeOvers}.${remBalls}`;
    const oversNum = wholeOvers + (remBalls / 6);
    const economy = oversNum > 0 ? Number((b.runs / oversNum).toFixed(2)) : 0;

    return {
      name: b.name,
      ovr: b.ovr,
      photoUrl: b.photoUrl,
      overs: oversStr,
      oversDecimal: Number(oversNum.toFixed(2)),
      maidens: b.maidens,
      runs: b.runs,
      wickets: b.wickets,
      dots: b.dots,
      fours: b.fours,
      sixes: b.sixes,
      economy
    };
  });

  return figures;
};

/**
 * Aggregate Batting Scorecard
 */
const aggregateBattingFigures = (deliveries = []) => {
  const batterMap = new Map();

  deliveries.forEach(del => {
    const sName = del.striker?.name || 'Striker';
    if (!batterMap.has(sName)) {
      batterMap.set(sName, {
        name: sName,
        ovr: del.striker?.ovr || 115,
        photoUrl: del.striker?.photoUrl || null,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissal: 'not out'
      });
    }

    const bat = batterMap.get(sName);
    bat.runs += del.runs || 0;
    bat.balls += 1;
    if (del.runs === 4) bat.fours += 1;
    if (del.runs === 6) bat.sixes += 1;
    if (del.isWicket) {
      bat.isOut = true;
      bat.dismissal = `${del.wicketType || 'Caught'} b ${del.bowler?.name || 'Bowler'}`;
    }
  });

  return Array.from(batterMap.values()).map(b => ({
    ...b,
    strikeRate: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0
  }));
};

/**
 * Filter Key Match Highlights & Replay Metadata
 */
const extractHighlights = (deliveries = []) => {
  const keyEvents = [];

  deliveries.forEach((del, idx) => {
    let highlightType = null;
    let title = '';

    if (del.isWicket) {
      highlightType = 'WICKET';
      title = `WICKET! ${del.striker?.name} ${del.wicketType} by ${del.bowler?.name}`;
    } else if (del.runs === 6) {
      highlightType = 'SIX';
      title = `MAXIMUM! ${del.striker?.name} smashes ${del.runs} over ${del.direction}`;
    } else if (del.runs === 4) {
      highlightType = 'FOUR';
      title = `FOUR! Glorious ${del.shotType} by ${del.striker?.name} through ${del.direction}`;
    }

    if (highlightType) {
      keyEvents.push({
        id: `hl_${idx}_${del.overBallStr}`,
        over: del.overBallStr,
        type: highlightType,
        title,
        runs: del.runs,
        striker: del.striker?.name,
        bowler: del.bowler?.name,
        badge: del.badge,
        commentary: del.commentary,
        deliveryData: {
          shotType: del.shotType,
          direction: del.direction,
          timing: del.timing,
          pitchLine: del.pitchLine,
          pitchLength: del.pitchLength,
          deliveryTactic: del.deliveryTactic,
          runs: del.runs,
          isWicket: del.isWicket,
          wagonWheel: del.wagonWheel,
          pitchMap: del.pitchMap
        }
      });
    }
  });

  return keyEvents;
};

/**
 * Compute Head-to-Head Player Comparison Metrics
 */
const comparePlayers = (playerA, playerB) => {
  if (!playerA || !playerB) return null;

  return {
    playerA: {
      name: playerA.name || 'Player A',
      country: playerA.country || 'India',
      ovr: playerA.ovr || 100,
      role: playerA.role || 'Batter',
      photoUrl: playerA.imageUrl || playerA.avatarUrl || null,
      batting: playerA.battingRating || playerA.batting || 85,
      bowling: playerA.bowlingRating || playerA.bowling || 40,
      fielding: playerA.fieldingRating || playerA.fielding || 80,
      fitness: playerA.fitness || 90,
      power: playerA.power || playerA.chemistry || 88,
      timing: playerA.timing || 92
    },
    playerB: {
      name: playerB.name || 'Player B',
      country: playerB.country || 'Australia',
      ovr: playerB.ovr || 100,
      role: playerB.role || 'Bowler',
      photoUrl: playerB.imageUrl || playerB.avatarUrl || null,
      batting: playerB.battingRating || playerB.batting || 45,
      bowling: playerB.bowlingRating || playerB.bowling || 92,
      fielding: playerB.fieldingRating || playerB.fielding || 82,
      fitness: playerB.fitness || 94,
      power: playerB.power || playerB.chemistry || 65,
      timing: playerB.timing || 60
    },
    radarMetrics: [
      { metric: 'OVR', valA: playerA.ovr || 100, valB: playerB.ovr || 100 },
      { metric: 'Batting', valA: playerA.battingRating || playerA.batting || 85, valB: playerB.battingRating || playerB.batting || 45 },
      { metric: 'Bowling', valA: playerA.bowlingRating || playerA.bowling || 40, valB: playerB.bowlingRating || playerB.bowling || 92 },
      { metric: 'Fielding', valA: playerA.fieldingRating || playerA.fielding || 80, valB: playerB.fieldingRating || playerB.fielding || 82 },
      { metric: 'Fitness', valA: playerA.fitness || 90, valB: playerB.fitness || 94 },
      { metric: 'Power', valA: playerA.power || playerA.chemistry || 88, valB: playerB.power || playerB.chemistry || 65 },
      { metric: 'Timing', valA: playerA.timing || 92, valB: playerB.timing || 60 }
    ]
  };
};

/**
 * Generate Comprehensive Post-Match or Live Summary
 */
const generateMatchSummary = (match) => {
  if (!match) return null;

  const deliveries = match.deliveries || [];
  const battingFigures = aggregateBattingFigures(deliveries);
  const bowlingFigures = aggregateBowlingFigures(deliveries);

  // Top Batter
  const topBatter = [...battingFigures].sort((a, b) => b.runs - a.runs)[0] || {
    name: match.currentStriker?.name || 'Virat Kohli',
    runs: match.currentStriker?.runs || 54,
    balls: match.currentStriker?.balls || 32,
    fours: match.currentStriker?.fours || 5,
    sixes: match.currentStriker?.sixes || 2
  };

  // Top Bowler
  const topBowler = [...bowlingFigures].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0] || {
    name: match.currentBowler?.name || 'Jasprit Bumrah',
    overs: '3.2',
    runs: 24,
    wickets: 2,
    economy: 7.2
  };

  // Player of the match
  const potm = topBatter.runs >= 50
    ? { name: topBatter.name, role: 'Batter', stats: `${topBatter.runs} runs (${topBatter.balls}b)`, photoUrl: topBatter.photoUrl }
    : { name: topBowler.name, role: 'Bowler', stats: `${topBowler.wickets} wkts / ${topBowler.runs} runs`, photoUrl: topBowler.photoUrl };

  return {
    title: match.title,
    venue: match.stadium?.name || match.venue,
    format: match.format,
    status: match.status,
    result: match.result || 'Match in progress',
    playerOfTheMatch: potm,
    topBatter,
    topBowler,
    decisivePhase: match.format === 'T20'
      ? 'Death overs power-hitting proved decisive in the outcome.'
      : 'Mid-match bowling spell and pitch deterioration swung momentum.'
  };
};

module.exports = {
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
};

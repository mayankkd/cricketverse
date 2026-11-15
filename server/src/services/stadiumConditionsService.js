const { getStadiumById } = require('../data/stadiumsData');

// ==========================================
// PHASE 9: STADIUM CONDITIONS, WEATHER & FORMATS SERVICE
// ==========================================

/**
 * Calculate dynamic multipliers based on Stadium, Pitch Condition, Weather & Session
 */
const calculateConditionMultipliers = ({
  stadiumId = 'eden_gardens',
  pitchType = null,
  weather = 'Clear',
  dayOfTest = 1,
  isEveningSession = false
}) => {
  const stadium = getStadiumById(stadiumId);

  let swingMultiplier = 1.0;
  let spinMultiplier = 1.0;
  let paceMultiplier = 1.0;
  let boundaryDifficulty = 1.0; // Higher = harder to hit boundaries; Lower = easier (short boundary)
  let wicketHazardMultiplier = 1.0;

  // 1. Stadium Baseline Attributes
  const paceSupport = (stadium.paceSupport || 70) / 70; // 0.8 to 1.35
  const spinSupport = (stadium.spinSupport || 70) / 70; // 0.6 to 1.35
  paceMultiplier *= paceSupport;
  spinMultiplier *= spinSupport;

  // 2. Boundary Dimensions (Straight & Square meters)
  const avgBoundary = ((stadium.boundaryDimensions?.straight || 70) + (stadium.boundaryDimensions?.square || 65)) / 2;
  // Standard boundary = 70m. Chinnaswamy (64.5m) -> 0.92 (easier); MCG (86.5m) -> 1.24 (harder)
  boundaryDifficulty *= (avgBoundary / 70);

  // 3. Pitch Condition Impact
  const pType = pitchType || stadium.pitchType || 'Turning';
  if (pType === 'Green') {
    swingMultiplier *= 1.35;
    paceMultiplier *= 1.25;
    wicketHazardMultiplier *= 1.3; // Edge & nick hazard
  } else if (pType === 'Flat') {
    wicketHazardMultiplier *= 0.7; // Batting paradise
    paceMultiplier *= 1.05; // True bounce allows fast scoring
  } else if (pType === 'Dry') {
    spinMultiplier *= 1.25;
    swingMultiplier *= 1.15; // Reverse swing
  } else if (pType === 'Turning') {
    spinMultiplier *= 1.45;
    wicketHazardMultiplier *= 1.35; // Stumping & bat-pad catch hazard
  } else if (pType === 'Cracked') {
    wicketHazardMultiplier *= 1.4; // Variable bounce, shooters, lbw & bowled
    paceMultiplier *= 1.1;
  }

  // 4. Test Match Pitch Deterioration Over 5 Days
  if (dayOfTest >= 4) {
    // Days 4 and 5: surface breaks up significantly
    spinMultiplier *= (1 + (dayOfTest - 3) * 0.2);
    wicketHazardMultiplier *= 1.25;
    if (pType !== 'Cracked') {
      wicketHazardMultiplier *= 1.15;
    }
  }

  // 5. Atmospheric Weather Influence
  if (weather === 'Overcast') {
    swingMultiplier *= 1.35; // Heavy cloud cover enhances air swing
  } else if (weather === 'Windy') {
    swingMultiplier *= 1.2; // Lateral wind drift
    boundaryDifficulty *= 0.95; // Downwind carry
  } else if (weather === 'Rain') {
    paceMultiplier *= 0.85;
    spinMultiplier *= 0.85;
  }

  // 6. Dew Conditions (Night / Evening Games)
  if (isEveningSession && stadium.dewConditions?.hasEveningDew) {
    const dewFactor = stadium.dewConditions.dewFactor || 0.35;
    spinMultiplier *= (1 - dewFactor * 0.8); // Spinners lose grip on slick ball (-25% to -35%)
    boundaryDifficulty *= 0.85; // Ball skids rapidly over wet grass outfield
    swingMultiplier *= 0.8;
  }

  return {
    stadium,
    pitchType: pType,
    weather,
    dayOfTest,
    isEveningSession,
    swingMultiplier: Number(swingMultiplier.toFixed(2)),
    spinMultiplier: Number(spinMultiplier.toFixed(2)),
    paceMultiplier: Number(paceMultiplier.toFixed(2)),
    boundaryDifficulty: Number(boundaryDifficulty.toFixed(2)),
    wicketHazardMultiplier: Number(wicketHazardMultiplier.toFixed(2))
  };
};

/**
 * Simplified DLS-Inspired Rain Target Adjustment for Limited Overs
 * Uses standard exponential resource percentage curves
 */
const calculateDLSRevision = ({
  team1Score,
  team1Overs = 50,
  team2OversLost = 10,
  targetTeamOversTotal = 50
}) => {
  const revisedOvers = Math.max(5, targetTeamOversTotal - team2OversLost);

  // Exponential resource function: R(u) = 100 * (1 - e^(-0.035 * u))
  const getResource = (overs) => 100 * (1 - Math.exp(-0.035 * overs));

  const team1Resource = getResource(team1Overs);
  const team2Resource = getResource(revisedOvers);

  let revisedTarget;
  if (team2Resource < team1Resource) {
    // Team 2 has fewer overs to bat: target scaled down
    revisedTarget = Math.round(team1Score * (team2Resource / team1Resource)) + 1;
  } else {
    // Rain in 1st innings: team 2 needs extra runs
    revisedTarget = Math.round(team1Score * (team2Resource / team1Resource)) + 1;
  }

  const parScore = Math.max(0, revisedTarget - 1);
  const requiredRate = Number((revisedTarget / revisedOvers).toFixed(2));

  return {
    isDLSActive: true,
    originalOvers: targetTeamOversTotal,
    revisedOvers,
    oversLost: team2OversLost,
    originalTarget: team1Score + 1,
    revisedTarget,
    parScore,
    requiredRate,
    formulaExplanation: `DLS revised target: ${revisedTarget} runs in ${revisedOvers} overs (RRR: ${requiredRate} rpo)`
  };
};

/**
 * Test Cricket Session & Day Tracking
 * 90 overs per day:
 * - Morning Session: 0 - 30 overs
 * - Afternoon Session: 30.1 - 60 overs
 * - Evening Session: 60.1 - 90 overs
 */
const calculateTestSessionAndDay = (totalMatchOvers = 0) => {
  const oversPerDay = 90;
  const day = Math.min(5, Math.floor(totalMatchOvers / oversPerDay) + 1);
  const oversToday = Number((totalMatchOvers % oversPerDay).toFixed(1));

  let session = 'Morning';
  if (oversToday > 60) {
    session = 'Evening';
  } else if (oversToday > 30) {
    session = 'Afternoon';
  }

  const sessionOvers = session === 'Morning' ? oversToday : (session === 'Afternoon' ? Number((oversToday - 30).toFixed(1)) : Number((oversToday - 60).toFixed(1)));
  const isMatchDrawn = totalMatchOvers >= 450; // 5 days completed without result

  return {
    day,
    session,
    oversToday,
    sessionOvers,
    maxOversPerDay: 90,
    totalMatchOvers,
    isMatchDrawn,
    pitchDeteriorationLevel: day
  };
};

/**
 * Follow-On Eligibility in Test Matches
 * Enforce rule: Team batting 1st must lead by >= 200 runs after Team 2 is bowled out
 */
const canEnforceFollowOn = (team1Score, team2Score, format = 'TEST') => {
  if (format.toUpperCase() !== 'TEST') return false;
  const lead = team1Score - team2Score;
  return lead >= 200;
};

/**
 * ODI & T20 Fielding Restrictions & Powerplay Stage Detection
 */
const getFormatPowerplayStage = (overs = 0, format = 'T20') => {
  const fmt = (format || 'T20').toUpperCase();

  if (fmt === 'T20') {
    if (overs < 6.0) {
      return { stage: 'Powerplay', maxOutsideCircle: 2, description: 'Mandatory Powerplay (Overs 1-6)' };
    } else if (overs < 15.0) {
      return { stage: 'Middle Overs', maxOutsideCircle: 5, description: 'Middle Overs (Overs 7-15)' };
    } else {
      return { stage: 'Death Overs', maxOutsideCircle: 5, description: 'Death Overs (Overs 16-20)' };
    }
  } else if (fmt === 'ODI') {
    if (overs < 10.0) {
      return { stage: 'Powerplay 1', maxOutsideCircle: 2, description: 'Mandatory Powerplay (Overs 1-10)' };
    } else if (overs < 40.0) {
      return { stage: 'Powerplay 2', maxOutsideCircle: 4, description: 'Middle Overs (Overs 11-40)' };
    } else {
      return { stage: 'Powerplay 3', maxOutsideCircle: 5, description: 'Death Overs (Overs 41-50)' };
    }
  } else {
    // TEST MATCH
    return { stage: 'Standard', maxOutsideCircle: 9, description: 'No field circle restrictions in Test Cricket' };
  }
};

/**
 * Format-Specific Bowler Over Limitations
 */
const getMaxBowlerLimitForFormat = (format = 'T20', totalOvers = 20) => {
  const fmt = (format || 'T20').toUpperCase();
  if (fmt === 'TEST') return Infinity; // Unlimited overs in Tests
  if (fmt === 'ODI') return Math.min(10, Math.ceil(totalOvers / 5)); // 10 in 50 ov, 8 in 40 ov
  return Math.min(4, Math.ceil(totalOvers / 5)); // 4 in 20 ov
};

/**
 * Bowler Fatigue Progression
 * Spells of over 6 consecutive overs without rest reduce pace & increase hazard
 */
const evaluateBowlerFatigue = (consecutiveOvers = 0, totalOvers = 0) => {
  let fatiguePercent = 0;
  if (consecutiveOvers > 6) {
    fatiguePercent = Math.min(100, (consecutiveOvers - 6) * 15);
  }
  const isFatigued = fatiguePercent >= 30;
  const pacePenalty = isFatigued ? Number((fatiguePercent * 0.12).toFixed(1)) : 0;

  return {
    consecutiveOvers,
    totalOvers,
    fatiguePercent,
    isFatigued,
    pacePenalty
  };
};

module.exports = {
  calculateConditionMultipliers,
  calculateDLSRevision,
  calculateTestSessionAndDay,
  canEnforceFollowOn,
  getFormatPowerplayStage,
  getMaxBowlerLimitForFormat,
  evaluateBowlerFatigue
};

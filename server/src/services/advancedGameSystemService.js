// ==========================================
// CRICKETVERSE: ADVANCED GAME SYSTEMS SERVICE (PHASE 12)
// Player Development, Chemistry, 8 Special Abilities,
// Dynamic Match Events, Scouting, Auction Awards & Documentary
// ==========================================

const storeService = require('./storeService');

/**
 * Historical Partnerships Master Catalog
 * Pairs with documented real-world synergy that unlock partnership bonuses
 */
const HISTORICAL_PARTNERSHIPS = [
  {
    names: ['Virat Kohli', 'AB de Villiers'],
    title: 'The Bengaluru Dream Duo',
    bonusMultiplier: 1.07,
    description: 'World record 229-run partnership holders. Unrivaled non-verbal understanding and boundary explosion.'
  },
  {
    names: ['Rohit Sharma', 'Shikhar Dhawan'],
    title: 'India ODI Opening Legacy',
    bonusMultiplier: 1.06,
    description: 'Iconic right-left combination with over 5,000 international partnership runs.'
  },
  {
    names: ['Sachin Tendulkar', 'Sourav Ganguly'],
    title: 'All-Time Opening Royalty',
    bonusMultiplier: 1.08,
    description: 'Most prolific opening stand in ODI history: 21 century partnerships and 6,609 runs.'
  },
  {
    names: ['Ravichandran Ashwin', 'Ravindra Jadeja'],
    title: 'Subcontinental Spin Web',
    bonusMultiplier: 1.07,
    description: 'Devastating tandem bowling partnership boasting over 500 Test wickets in home conditions.'
  },
  {
    names: ['Jasprit Bumrah', 'Mohammed Shami'],
    title: 'Lethal Seam & Yorker Syndicate',
    bonusMultiplier: 1.06,
    description: 'World-class opening pace duo blending pinpoint yorkers and seam presentation.'
  },
  {
    names: ['MS Dhoni', 'Suresh Raina'],
    title: 'Yellow Brigade Finishers',
    bonusMultiplier: 1.07,
    description: 'Master tacticians of the death overs with ice in their veins.'
  },
  {
    names: ['Mitchell Starc', 'Pat Cummins'],
    title: 'Aussie Express Engine',
    bonusMultiplier: 1.06,
    description: 'Relentless pace, hostile bouncers, and match-winning death bowling execution.'
  },
  {
    names: ['Ben Stokes', 'Joe Root'],
    title: 'Three Lions Resilient Spine',
    bonusMultiplier: 1.06,
    description: 'Composed stroke play paired with clutch fourth-innings miraculous run chases.'
  },
  {
    names: ['Steve Smith', 'David Warner'],
    title: 'Baggy Green Pillars',
    bonusMultiplier: 1.06,
    description: 'Aggressive left-hand strokeplay complementing metronomic right-hand anchor solidity.'
  },
  {
    names: ['Glenn Maxwell', 'Faf du Plessis'],
    title: 'High-Octane Blitzkrieg',
    bonusMultiplier: 1.06,
    description: 'Aerial dynamic hitters capable of scoring 70+ runs in 4 death overs.'
  },
  {
    names: ['Babar Azam', 'Mohammad Rizwan'],
    title: 'Trans-Indus Opening Pair',
    bonusMultiplier: 1.06,
    description: 'Record-setting T20 partnership pair with multiple 150+ run stands.'
  }
];

/**
 * 8 Official Special Abilities Definitions
 */
const SPECIAL_ABILITIES = {
  FINISHERS_INSTINCT: {
    id: "Finisher's Instinct",
    icon: '⚡',
    description: 'Massive boundary elevation and composure in death overs (overs 16–20 in T20, 41–50 in ODI).',
    activePhase: 'death_overs',
    buffs: { boundaryChanceBoost: 0.16, yorkerResistance: 0.25, composure: +10 }
  },
  CHASE_MASTER: {
    id: 'Chase Master',
    icon: '🎯',
    description: 'Shot timing and boundary strike rate scale upward with required run rate in 2nd innings run chases.',
    activePhase: 'chase_second_innings',
    buffs: { timingWindowBoost: 0.20, panicReduction: 0.35, rrrScaling: true }
  },
  YORKER_SPECIALIST: {
    id: 'Yorker Specialist',
    icon: '🎯',
    description: 'Reduces boundary conceded rate by 40% and amplifies bowled/LBW hazard when bowling yorker length at death.',
    activePhase: 'yorker_delivery',
    buffs: { boundaryConcededReduction: 0.40, bowledLbwHazardBoost: 0.25 }
  },
  POWERPLAY_DESTROYER: {
    id: 'Powerplay Destroyer',
    icon: '💥',
    description: 'Aerial lofted drives clear the 30-yard infield with enhanced elevation against fielding restrictions.',
    activePhase: 'powerplay_overs',
    buffs: { aerialSuccessBoost: 0.18, sixMultiplier: 1.15 }
  },
  LIGHTNING_FIELDER: {
    id: 'Lightning Fielder',
    icon: '⚡',
    description: 'Doubles direct hit run-out probability and amplifies diving catch conversion inside 30-yard ring.',
    activePhase: 'infield_fielding',
    buffs: { directHitChanceMultiplier: 2.0, divingCatchBoost: 0.25 }
  },
  SPIN_MASTER: {
    id: 'Spin Master',
    icon: '🌀',
    description: 'Amplified turn, drift, and stumping opportunities on turning, dry, or cracked pitches.',
    activePhase: 'spin_conditions',
    buffs: { spinDeviationBoost: 0.22, stumpingHazardMultiplier: 1.35 }
  },
  WALL_OF_DEFENCE: {
    id: 'Wall of Defence',
    icon: '🛡️',
    description: 'Virtually eliminates edges and dismissals during Defensive Block or difficult Test match sessions.',
    activePhase: 'defensive_play',
    buffs: { edgeReduction: 0.85, resistanceToShooters: 0.90 }
  },
  BIG_MATCH_PLAYER: {
    id: 'Big Match Player',
    icon: '👑',
    description: 'Boosts all attributes and composure by +5 OVR in Knockouts, Qualifiers, Finals, and Marquee Rivalries.',
    activePhase: 'high_stakes_match',
    buffs: { ovrBuff: 5, clutchComposure: +15 }
  }
};

// ==========================================
// 1. PLAYER DEVELOPMENT FUNCTIONS
// ==========================================

/**
 * Execute Training Drill for a Player
 * Supports: 'Batting', 'Bowling', 'Fielding', 'Fitness', 'Mental Strength', 'Captaincy'
 */
const trainPlayer = (player, drillType = 'Batting') => {
  if (!player) throw new Error('Player not provided');

  const dev = player.development || {
    form: 80,
    confidence: 75,
    fitness: 90,
    fatigue: 10,
    injury: { status: 'healthy', matchesOut: 0, recoveryProgress: 100, injuryRisk: 10 },
    training: { battingXP: 0, bowlingXP: 0, fieldingXP: 0, fitnessXP: 0, mentalXP: 0, captaincyXP: 0, level: 1 },
    availability: 'available'
  };

  const attrs = player.attributes || {
    batting: 80, bowling: 50, fielding: 75, fitness: 80, temperament: 75, captaincy: 70
  };

  const drillNorm = drillType.toLowerCase().trim();
  let xpAwarded = 100;
  let statBoosted = '';
  let boostAmount = 1;

  switch (drillNorm) {
    case 'batting':
      dev.training.battingXP = (dev.training.battingXP || 0) + xpAwarded;
      attrs.batting = Math.min(120, (attrs.batting || 80) + boostAmount);
      if (attrs.powerHitting) attrs.powerHitting = Math.min(120, attrs.powerHitting + boostAmount);
      statBoosted = 'Batting & Power Hitting';
      break;

    case 'bowling':
      dev.training.bowlingXP = (dev.training.bowlingXP || 0) + xpAwarded;
      attrs.bowling = Math.min(120, (attrs.bowling || 50) + boostAmount);
      if (attrs.deathBowling) attrs.deathBowling = Math.min(120, attrs.deathBowling + boostAmount);
      statBoosted = 'Bowling & Death Execution';
      break;

    case 'fielding':
      dev.training.fieldingXP = (dev.training.fieldingXP || 0) + xpAwarded;
      attrs.fielding = Math.min(120, (attrs.fielding || 75) + boostAmount);
      statBoosted = 'Fielding Agility & Catching';
      break;

    case 'fitness':
      dev.training.fitnessXP = (dev.training.fitnessXP || 0) + xpAwarded;
      dev.fitness = Math.min(100, (dev.fitness || 90) + 2);
      dev.fatigue = Math.max(0, (dev.fatigue || 10) - 5);
      statBoosted = 'Stamina & Fatigue Resistance';
      break;

    case 'mental strength':
    case 'mental':
      dev.training.mentalXP = (dev.training.mentalXP || 0) + xpAwarded;
      dev.confidence = Math.min(100, (dev.confidence || 75) + 5);
      attrs.temperament = Math.min(120, (attrs.temperament || 75) + boostAmount);
      statBoosted = 'Composure & Temperament';
      break;

    case 'captaincy':
      dev.training.captaincyXP = (dev.training.captaincyXP || 0) + xpAwarded;
      attrs.captaincy = Math.min(120, (attrs.captaincy || 70) + boostAmount);
      statBoosted = 'Tactical Captaincy & Field Adjustments';
      break;

    default:
      dev.training.battingXP = (dev.training.battingXP || 0) + 50;
      statBoosted = 'General All-Round Experience';
      break;
  }

  // Calculate training level up (every 300 total XP)
  const totalXP = (dev.training.battingXP || 0) + (dev.training.bowlingXP || 0) +
                  (dev.training.fieldingXP || 0) + (dev.training.fitnessXP || 0) +
                  (dev.training.mentalXP || 0) + (dev.training.captaincyXP || 0);

  const prevLevel = dev.training.level || 1;
  const newLevel = Math.max(1, Math.floor(totalXP / 300) + 1);
  const leveledUp = newLevel > prevLevel;
  dev.training.level = newLevel;

  player.development = dev;
  player.attributes = attrs;

  return {
    success: true,
    drillType,
    statBoosted,
    boostAmount,
    xpAwarded,
    newLevel,
    leveledUp,
    player
  };
};

/**
 * Perform Recovery & Rehab for Player
 * Methods: 'physio', 'ice_bath', 'rest_cycle', 'rehab'
 */
const performPlayerRecovery = (player, method = 'physio') => {
  if (!player) throw new Error('Player not provided');

  const dev = player.development || {
    form: 80, confidence: 75, fitness: 90, fatigue: 10,
    injury: { status: 'healthy', matchesOut: 0, recoveryProgress: 100, injuryRisk: 10 },
    availability: 'available'
  };

  const mNorm = method.toLowerCase();
  let message = '';

  switch (mNorm) {
    case 'physio':
      dev.fatigue = Math.max(0, (dev.fatigue || 10) - 25);
      dev.fitness = Math.min(100, (dev.fitness || 90) + 5);
      if (dev.injury && dev.injury.status !== 'healthy') {
        dev.injury.recoveryProgress = Math.min(100, (dev.injury.recoveryProgress || 50) + 30);
        if (dev.injury.recoveryProgress >= 100) {
          dev.injury.status = 'healthy';
          dev.injury.matchesOut = 0;
          dev.availability = 'available';
          message = 'Physio cleared player for match action. Injury fully healed!';
        } else {
          message = `Physio session completed. Recovery at ${dev.injury.recoveryProgress}%.`;
        }
      } else {
        message = 'Physio massage & muscle relaxation completed. Fatigue lowered by 25%.';
      }
      break;

    case 'ice_bath':
      dev.fatigue = Math.max(0, (dev.fatigue || 10) - 35);
      dev.fitness = Math.min(100, (dev.fitness || 90) + 8);
      message = 'Cryotherapy ice bath completed. Cellular recovery accelerated.';
      break;

    case 'rest_cycle':
      dev.fatigue = 0;
      dev.fitness = 100;
      dev.availability = 'available';
      if (dev.injury) {
        dev.injury.matchesOut = Math.max(0, (dev.injury.matchesOut || 1) - 1);
        if (dev.injury.matchesOut === 0) {
          dev.injury.status = 'healthy';
          dev.injury.recoveryProgress = 100;
        }
      }
      message = 'Full rest cycle completed. 100% stamina and fatigue reset to zero.';
      break;

    case 'rehab':
      if (dev.injury) {
        dev.injury.recoveryProgress = 100;
        dev.injury.status = 'healthy';
        dev.injury.matchesOut = 0;
        dev.availability = 'available';
      }
      message = 'Medical center rehab completed. Player is fully fit and cleared!';
      break;

    default:
      dev.fatigue = Math.max(0, (dev.fatigue || 10) - 15);
      message = 'General recovery session finished.';
      break;
  }

  // Update calculated injury risk
  dev.injury.injuryRisk = Math.min(100, Math.max(5, Math.round(((dev.fatigue || 10) * 0.6) + ((100 - (dev.fitness || 90)) * 0.4))));

  player.development = dev;
  return {
    success: true,
    method,
    message,
    development: dev
  };
};

/**
 * Dynamically evaluate Player Form & Confidence after Match Performances
 */
const updatePlayerFormAndConfidence = (player, performance = {}) => {
  if (!player) return;
  const dev = player.development || {
    form: 80, confidence: 75, fitness: 90, fatigue: 10,
    injury: { status: 'healthy', matchesOut: 0, recoveryProgress: 100, injuryRisk: 10 }
  };

  const runs = performance.runs || 0;
  const wickets = performance.wickets || 0;
  const catches = performance.catches || 0;
  const isDuck = performance.isDuck || false;
  const economy = performance.economy !== undefined ? performance.economy : 7.5;

  let formDelta = 0;
  let confDelta = 0;

  if (runs >= 50) {
    formDelta += 8;
    confDelta += 10;
  } else if (runs >= 30) {
    formDelta += 4;
    confDelta += 5;
  } else if (isDuck) {
    formDelta -= 6;
    confDelta -= 8;
  }

  if (wickets >= 3) {
    formDelta += 8;
    confDelta += 10;
  } else if (wickets >= 1) {
    formDelta += 3;
    confDelta += 4;
  } else if (economy > 11.0) {
    formDelta -= 4;
    confDelta -= 5;
  }

  if (catches > 0) {
    confDelta += catches * 3;
  }

  dev.form = Math.min(100, Math.max(30, (dev.form || 80) + formDelta));
  dev.confidence = Math.min(100, Math.max(10, (dev.confidence || 75) + confDelta));

  player.development = dev;
  return player.development;
};

// ==========================================
// 2. PLAYER CHEMISTRY & PARTNERSHIPS
// ==========================================

/**
 * Compute Partnership Chemistry between two players
 * Integrates historical partnerships, compatible styles, former teams & nationality
 */
const calculatePartnershipChemistry = (player1, player2) => {
  if (!player1 || !player2) {
    return { chemistryScore: 70, synergyMultiplier: 1.0, synergyTitle: 'Standard Chemistry' };
  }

  const p1Name = player1.name || '';
  const p2Name = player2.name || '';

  // 1. Check Historical Partnerships Catalog
  const foundHistorical = HISTORICAL_PARTNERSHIPS.find(pair =>
    (pair.names.includes(p1Name) && pair.names.includes(p2Name))
  );

  let chemistryScore = 70;
  let synergyMultiplier = 1.0;
  let synergyTitle = 'Neutral Dynamic';
  let bonuses = {
    boundaryBuff: 0,
    strikeRotationBuff: 0,
    runOutReduction: 0,
    tandemPressureBuff: 0
  };

  if (foundHistorical) {
    chemistryScore = 95;
    synergyMultiplier = foundHistorical.bonusMultiplier;
    synergyTitle = foundHistorical.title;
    bonuses.boundaryBuff = 0.05;
    bonuses.strikeRotationBuff = 0.06;
    bonuses.runOutReduction = 0.40;
  } else {
    // 2. Check Compatible Styles
    const p1Role = (player1.role || '').toLowerCase();
    const p2Role = (player2.role || '').toLowerCase();
    const p1BatStyle = (player1.battingStyle || '').toLowerCase();
    const p2BatStyle = (player2.battingStyle || '').toLowerCase();

    // Left-Hand + Right-Hand (LHB + RHB) Field Disruption
    const isLhbRhb = (p1BatStyle.includes('left') && p2BatStyle.includes('right')) ||
                     (p1BatStyle.includes('right') && p2BatStyle.includes('left'));

    if (isLhbRhb) {
      chemistryScore += 8;
      synergyMultiplier += 0.02;
      synergyTitle = 'Left-Right Stance Disruption';
      bonuses.boundaryBuff += 0.02;
    }

    // Anchor + Aggressive / Power Hitter Synergy
    const p1Tags = player1.chemistryTags || [player1.role];
    const p2Tags = player2.chemistryTags || [player2.role];

    const hasAnchor = p1Tags.includes('Anchor') || p2Tags.includes('Anchor');
    const hasAggressive = p1Tags.includes('Aggressive') || p2Tags.includes('Aggressive') || p1Tags.includes('Power Hitter') || p2Tags.includes('Power Hitter');

    if (hasAnchor && hasAggressive) {
      chemistryScore += 10;
      synergyMultiplier += 0.03;
      synergyTitle = 'Anchor & Power Striker Balance';
      bonuses.strikeRotationBuff += 0.04;
      bonuses.runOutReduction += 0.30;
    }

    // Country Familiarity
    if (player1.country && player1.country === player2.country) {
      chemistryScore += 6;
      synergyMultiplier += 0.015;
    }

    // Franchise Legacy (same former IPL / franchise team)
    const p1Ipl = player1.franchiseDomesticStats?.ipl?.teams || [];
    const p2Ipl = player2.franchiseDomesticStats?.ipl?.teams || [];
    const commonIpl = p1Ipl.filter(t => p2Ipl.includes(t));
    if (commonIpl.length > 0) {
      chemistryScore += 6;
      synergyMultiplier += 0.015;
      if (synergyTitle === 'Neutral Dynamic') synergyTitle = `${commonIpl[0]} Franchise Chemistry`;
    }
  }

  // Strict Balance Clamp: synergyMultiplier never exceeds 1.08, never below 0.95
  synergyMultiplier = Math.min(1.08, Math.max(0.95, parseFloat(synergyMultiplier.toFixed(3))));
  chemistryScore = Math.min(100, Math.max(50, chemistryScore));

  return {
    player1: p1Name,
    player2: p2Name,
    chemistryScore,
    synergyMultiplier,
    synergyTitle,
    bonuses
  };
};

/**
 * Calculate Overall Franchise Squad Chemistry Matrix
 */
const calculateTeamChemistry = (squad = []) => {
  if (!squad || squad.length === 0) {
    return { overallChemistry: 75, synergyMultiplier: 1.0, activePartnerships: [], compatibilityScore: 75 };
  }

  let totalPairChemistry = 0;
  let pairCount = 0;
  const activePartnerships = [];

  for (let i = 0; i < Math.min(squad.length, 11); i++) {
    for (let j = i + 1; j < Math.min(squad.length, 11); j++) {
      const res = calculatePartnershipChemistry(squad[i], squad[j]);
      totalPairChemistry += res.chemistryScore;
      pairCount++;
      if (res.chemistryScore >= 85) {
        activePartnerships.push(res);
      }
    }
  }

  const avgChemistry = pairCount > 0 ? Math.round(totalPairChemistry / pairCount) : 75;
  const synergyMultiplier = Math.min(1.06, Math.max(0.96, 1 + ((avgChemistry - 75) * 0.0015)));

  return {
    overallChemistry: avgChemistry,
    synergyMultiplier: parseFloat(synergyMultiplier.toFixed(3)),
    activePartnerships,
    compatibilityScore: avgChemistry
  };
};

// ==========================================
// 3. SPECIAL ABILITIES EVALUATION
// ==========================================

/**
 * Evaluate active Special Abilities during a delivery turn
 */
const evaluateActiveAbilities = ({ striker, bowler, matchContext = {} }) => {
  const activeStrikerAbilities = [];
  const activeBowlerAbilities = [];
  const buffs = {
    boundaryChanceMultiplier: 1.0,
    yorkerHazardModifier: 1.0,
    aerialSuccessMultiplier: 1.0,
    spinTurnMultiplier: 1.0,
    edgeChanceMultiplier: 1.0,
    clutchComposureBuff: 0
  };

  const overNum = matchContext.overNumber || 1;
  const format = (matchContext.format || 'T20').toUpperCase();
  const innings = matchContext.currentInnings || 1;
  const pitchType = matchContext.pitchType || 'Flat';
  const isChasing = innings === 2;
  const isDeathOvers = format === 'T20' ? overNum >= 16 : (format === 'ODI' ? overNum >= 40 : false);
  const isPowerplay = format === 'T20' ? overNum <= 6 : (format === 'ODI' ? overNum <= 10 : false);
  const isHighStakes = matchContext.isPlayoff || matchContext.isFinal || matchContext.isRivalry;

  const strikerAbilities = striker?.specialAbilities || [];
  const bowlerAbilities = bowler?.specialAbilities || [];

  // 1. Finisher's Instinct (Death Overs)
  if (isDeathOvers && strikerAbilities.includes("Finisher's Instinct")) {
    activeStrikerAbilities.push("Finisher's Instinct");
    buffs.boundaryChanceMultiplier *= 1.16;
    buffs.clutchComposureBuff += 10;
  }

  // 2. Chase Master (2nd Innings Target Chase)
  if (isChasing && strikerAbilities.includes('Chase Master')) {
    activeStrikerAbilities.push('Chase Master');
    buffs.boundaryChanceMultiplier *= 1.14;
    buffs.edgeChanceMultiplier *= 0.85;
  }

  // 3. Powerplay Destroyer (Overs 1–6)
  if (isPowerplay && strikerAbilities.includes('Powerplay Destroyer')) {
    activeStrikerAbilities.push('Powerplay Destroyer');
    buffs.aerialSuccessMultiplier *= 1.18;
  }

  // 4. Wall of Defence (Defensive Block or Test Match)
  if (matchContext.shotType === 'Defensive Block' && strikerAbilities.includes('Wall of Defence')) {
    activeStrikerAbilities.push('Wall of Defence');
    buffs.edgeChanceMultiplier *= 0.10; // Virtually nullifies edges
  }

  // 5. Yorker Specialist (Bowler yorker in death overs)
  if (isDeathOvers && matchContext.bowlingLength === 'Yorker' && bowlerAbilities.includes('Yorker Specialist')) {
    activeBowlerAbilities.push('Yorker Specialist');
    buffs.boundaryChanceMultiplier *= 0.60; // Cuts boundary probability by 40%
    buffs.yorkerHazardModifier *= 1.35; // Amplifies bowled/LBW
  }

  // 6. Spin Master (Turning / Dry pitch)
  if (['Turning', 'Dry', 'Cracked'].includes(pitchType) && bowlerAbilities.includes('Spin Master')) {
    activeBowlerAbilities.push('Spin Master');
    buffs.spinTurnMultiplier *= 1.25;
  }

  // 7. Big Match Player (Knockouts / Finals / Rivalries)
  if (isHighStakes) {
    if (strikerAbilities.includes('Big Match Player')) {
      activeStrikerAbilities.push('Big Match Player');
      buffs.clutchComposureBuff += 15;
    }
    if (bowlerAbilities.includes('Big Match Player')) {
      activeBowlerAbilities.push('Big Match Player');
      buffs.clutchComposureBuff += 15;
    }
  }

  return {
    activeStrikerAbilities,
    activeBowlerAbilities,
    buffs
  };
};

// ==========================================
// 4. DYNAMIC MATCH EVENTS & STADIUM SOUND
// ==========================================

/**
 * Generate Dynamic In-Game Events
 * (DRS Review / UltraEdge Snickometer, Dew Onset, Crowd Surge, Injury Timeout, Ball Scuff)
 */
const generateDynamicMatchEvent = (matchState = {}, deliveryOutcome = {}) => {
  const events = [];
  const over = matchState.overs || 0;
  const isSecondInnings = matchState.currentInnings === 2;

  // 1. UltraEdge Snickometer / DRS Review Event
  if (deliveryOutcome.isWicket && ['Caught', 'LBW', 'Caught Behind'].includes(deliveryOutcome.wicketType)) {
    const isUltraEdgeSpike = Math.random() < 0.65;
    events.push({
      id: `drs_${Date.now()}`,
      type: 'DRS_REVIEW',
      title: 'DRS UltraEdge Review Requested',
      description: isUltraEdgeSpike
        ? 'UltraEdge snickometer detects a distinct spike as ball passes bat! Decision UPHELD.'
        : 'Flat line on UltraEdge! Ball-tracking confirms missing leg stump. Decision OVERTURNED!',
      timestamp: new Date(),
      data: {
        ultraEdgeSpike: isUltraEdgeSpike,
        ballTracking: {
          pitching: 'In Line',
          impact: 'In Line',
          wickets: isUltraEdgeSpike ? 'Hitting' : 'Missing Leg'
        },
        decision: isUltraEdgeSpike ? 'OUT' : 'NOT OUT'
      }
    });
  }

  // 2. Evening Dew Onset Event
  if (isSecondInnings && Math.floor(over) === 10 && !matchState.dewEventLogged) {
    events.push({
      id: `dew_${Date.now()}`,
      type: 'DEW_ONSET',
      title: 'Evening Dew Descends on Outfield',
      description: 'Noticeable dew covering outfield turf. Spin bowlers struggle with ball seam grip; ball skids faster.',
      timestamp: new Date(),
      data: { gripReduction: 0.15, outfieldSpeedMultiplier: 1.10 }
    });
  }

  // 3. Crowd Surge & Decibel Roar
  if (deliveryOutcome.runs === 6 || (deliveryOutcome.isWicket && Math.random() < 0.5)) {
    const homeTeam = matchState.teamA?.shortCode || 'TITANS';
    events.push({
      id: `crowd_${Date.now()}`,
      type: 'CROWD_SURGE',
      title: 'Atmospheric Stadium Roar Surge (108 dB)',
      description: `Spectators erupt in deafening cheer! Stadium sound system triggers synchronized chants: "${homeTeam}! ${homeTeam}!"`,
      timestamp: new Date(),
      data: { decibels: 108, chant: `${homeTeam}! ${homeTeam}!` }
    });
  }

  return events;
};

// ==========================================
// 5. SCOUTING & OPPONENT ANALYSIS
// ==========================================

/**
 * Generate Deep Analytical Scouting Report for an Opponent Franchise
 */
const generateScoutingReport = (targetTeam = {}, conditions = {}) => {
  const squad = targetTeam.populatedSquad || targetTeam.squad || [];

  const topRunScorer = squad[0] || { name: 'Lead Batter', attributes: { batting: 90 } };
  const leadBowler = squad.find(p => (p.role || '').toLowerCase() === 'bowler') || squad[1] || { name: 'Strike Bowler', attributes: { bowling: 88 } };

  return {
    targetTeamName: targetTeam.name || 'Opponent Franchise',
    shortCode: targetTeam.shortCode || 'OPP',
    overallStrength: targetTeam.squadStrength || 88,
    scoutingSummary: `${targetTeam.name || 'Opponent'} relies heavily on top-order boundary scoring and early powerplay wickets. Their middle order shows vulnerability against disciplined spin.`,
    battingAnalysis: {
      powerplayStrikeRate: 148.5,
      weaknessAgainstSpin: 'Prone to mistimed sweep shots against wrist spin on dry pitches.',
      preferredBoundaryZone: 'Midwicket and Long-On (62% of maximums)',
      keyBatter: topRunScorer.name
    },
    bowlingAnalysis: {
      deathOverEconomy: 10.4,
      paceStrength: 'Express opening seamers capitalize on early swing in overcast conditions.',
      vulnerability: 'Concedes boundaries when batters target square boundaries behind point.',
      keyBowler: leadBowler.name
    },
    recommendedTactics: [
      'Deploy deep point and third man during opening overs to eliminate cut shots.',
      'Bowl leg-spin and slider variations during middle overs 7–14.',
      'Target wide yorkers outside off stump at the death (overs 17–20).',
      'Set an aggressive ring field with Lightning Fielders at cover and midwicket.'
    ]
  };
};

// ==========================================
// 6. AUCTION AWARDS
// ==========================================

/**
 * Evaluate Analytical Post-Auction Honors & Awards
 */
const evaluateAuctionAwards = (auctionLots = [], teams = []) => {
  const soldLots = auctionLots.filter(l => l.status === 'sold' && l.winnerTeam);

  // 1. Best Value Pick (Highest OVR / Price Spent)
  const bestValue = [...soldLots].sort((a, b) => ((b.player?.overallRating || 90) / (b.soldPrice || 1)) - ((a.player?.overallRating || 90) / (a.soldPrice || 1)))[0] || {
    player: { name: 'Rinku Singh', overallRating: 94 },
    soldPrice: 2,
    winnerTeam: 'Kolkata Night Knights'
  };

  // 2. Steal of the Auction (Marquee Icon player bought under 5 points)
  const steal = soldLots.find(l => (l.player?.overallRating || 0) >= 95 && l.soldPrice <= 5) || soldLots[0] || {
    player: { name: 'Travis Head', overallRating: 98 },
    soldPrice: 4,
    winnerTeam: 'Hyderabad Sun Chargers'
  };

  // 3. Marquee Mega-Buy (Highest single purse investment)
  const marqueeBuy = [...soldLots].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0] || {
    player: { name: 'Virat Kohli', overallRating: 118 },
    soldPrice: 24,
    winnerTeam: 'Bangalore Royal Titans'
  };

  // 4. Master Tactician (Team with optimal balance and remaining purse)
  const masterTactician = teams[0] || {
    name: 'Bangalore Royal Titans',
    remainingPurse: 12,
    squadStrength: 94
  };

  return {
    bestValuePick: {
      title: 'BEST VALUE PICK',
      player: bestValue.player?.name,
      price: bestValue.soldPrice,
      team: bestValue.winnerTeam,
      efficiencyRatio: ((bestValue.player?.overallRating || 90) / (bestValue.soldPrice || 1)).toFixed(1)
    },
    stealOfTheAuction: {
      title: 'STEAL OF THE AUCTION',
      player: steal.player?.name,
      price: steal.soldPrice,
      team: steal.winnerTeam,
      notes: 'Acquired elite cricketer significantly under market value.'
    },
    marqueeBuy: {
      title: 'MARQUEE RECORD BUY',
      player: marqueeBuy.player?.name,
      price: marqueeBuy.soldPrice,
      team: marqueeBuy.winnerTeam,
      notes: 'Highest individual purse dedication of the auction.'
    },
    masterTactician: {
      title: 'MASTER TACTICIAN AWARD',
      team: masterTactician.name,
      remainingPurse: masterTactician.remainingPurse || 10,
      squadStrength: masterTactician.squadStrength || 92
    }
  };
};

// ==========================================
// 7. MATCH DOCUMENTARY GENERATOR
// ==========================================

/**
 * Generate a 5-Act Cinematic Documentary Script for Completed Matches
 */
const generateMatchDocumentary = (match = {}) => {
  const teamAName = match.teamA?.name || 'Bangalore Royal Titans';
  const teamBName = match.teamB?.name || 'Mumbai Kings XI';
  const venue = match.venue || 'Eden Gardens, Kolkata';
  const winner = match.result ? match.result.split(' won')[0] : teamAName;
  const highlights = match.highlights || [];

  return {
    title: `The Epic Battle of ${venue}: ${teamAName} vs ${teamBName}`,
    documentaryDuration: '12 Minutes Cinematic Cut',
    narrativeSummary: `A monumental cricket clash etched into the history books of ${venue}. Both franchises fought to the wire before ${winner} emerged victorious.`,
    acts: [
      {
        actNumber: 1,
        actTitle: 'Act I: The Prelude & Clash of Titans',
        timeframe: 'Toss & Match Buildup',
        narration: `Under the floodlights of ${venue}, the tension was palpable. Captains stepped forward for the toss in front of 65,000 expectant fans. Tactics were locked, lines drawn, and history waited to be written.`
      },
      {
        actNumber: 2,
        actTitle: 'Act II: Powerplay Blitzkrieg & First Blood',
        timeframe: 'Overs 1.0 through 6.0',
        narration: `The opening salvo began with sheer audacity. Field restrictions offered a tantalizing invitation, and the opening batters launched fearless aerial strokes over the 30-yard ring, setting an electric opening tone.`
      },
      {
        actNumber: 3,
        actTitle: 'Act III: The Middle-Overs Chessboard',
        timeframe: 'Overs 7.0 through 15.0',
        narration: `As fielders dispersed to the deep boundaries, the match shifted into a cerebral tactical duel. Spin bowlers tightened the noose, squeezing singles and hunting for mistimed strokes in the dry turning conditions.`
      },
      {
        actNumber: 4,
        actTitle: 'Act IV: The Dramatic Climax & Heroics',
        timeframe: 'Death Overs 16.0 through 20.0',
        narration: `Heart rates skyrocketed as the target loomed. Boundary ropes were peppered, yorkers answered with ramp shots, and every solitary dot ball was greeted with collective gasps from the stadium crowd.`
      },
      {
        actNumber: 5,
        actTitle: 'Act V: Post-Match Legacy & Eternal Legend',
        timeframe: 'Presentation & Historic Aftermath',
        narration: `${winner} sealed immortality! Fireworks lit up the night sky as player cards updated into legend. A classic encounter that redefined competitive cricket excellence in the CricketVerse.`
      }
    ],
    heroOfTheMatch: {
      name: match.currentStriker?.name || 'Virat Kohli',
      impact: 'Game-defining boundary onslaught in the decisive death phase.'
    }
  };
};

module.exports = {
  HISTORICAL_PARTNERSHIPS,
  SPECIAL_ABILITIES,
  trainPlayer,
  performPlayerRecovery,
  updatePlayerFormAndConfidence,
  calculatePartnershipChemistry,
  calculateTeamChemistry,
  evaluateActiveAbilities,
  generateDynamicMatchEvent,
  generateScoutingReport,
  evaluateAuctionAwards,
  generateMatchDocumentary
};


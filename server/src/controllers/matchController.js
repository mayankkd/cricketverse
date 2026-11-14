const storeService = require('../services/storeService');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
const getMatches = async (req, res, next) => {
  try {
    const matches = await storeService.getMatches();
    res.status(200).json({
      success: true,
      matches
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Public
const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = await storeService.getMatchById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found.'
      });
    }
    res.status(200).json({
      success: true,
      match
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Simulate next ball in match center
// @route   POST /api/matches/:id/simulate-ball
// @access  Public
const simulateBall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const match = await storeService.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const outcomes = [
      { ball: '1', runs: 1, isWicket: false, badge: 'SINGLE', commentary: 'Tucked nicely into the gap for a brisk single.' },
      { ball: '2', runs: 2, isWicket: false, badge: 'TWO', commentary: 'Pushed into the deep cover sweep, great running between the wickets for a brace!' },
      { ball: '4', runs: 4, isWicket: false, badge: 'FOUR', commentary: 'CRACK! Blistering cover drive whistling past extra cover to the boundary rope!' },
      { ball: '6', runs: 6, isWicket: false, badge: 'SIX', commentary: 'STAND AND DELIVER! Launched over deep midwicket into the tier 2 crowd for a gargantuan SIX!' },
      { ball: '0', runs: 0, isWicket: false, badge: 'DOT', commentary: 'Beaten all ends up! Fiery outswinger whistling past the outside edge.' },
      { ball: 'W', runs: 0, isWicket: true, badge: 'WICKET', commentary: 'OUT! Clean bowled! Timber takes a walk as the stumps go cartwheeling into the Kolkata night!' }
    ];

    const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    // Update match state
    const currentOvers = match.teamA.overs;
    const wholeOvers = Math.floor(currentOvers);
    const ballsInOver = Math.round((currentOvers - wholeOvers) * 10);
    
    let newOvers;
    if (ballsInOver >= 5) {
      newOvers = wholeOvers + 1.0;
    } else {
      newOvers = Number((wholeOvers + (ballsInOver + 1) * 0.1).toFixed(1));
    }

    match.teamA.overs = newOvers;
    match.teamA.score += pick.runs;
    if (pick.isWicket) {
      match.teamA.wickets = Math.min(10, match.teamA.wickets + 1);
    }

    if (match.currentStriker) {
      match.currentStriker.runs += pick.runs;
      match.currentStriker.balls += 1;
      if (pick.badge === 'FOUR') match.currentStriker.fours += 1;
      if (pick.badge === 'SIX') match.currentStriker.sixes += 1;
    }

    match.recentBalls.unshift(pick.ball);
    if (match.recentBalls.length > 8) match.recentBalls.pop();

    match.commentary.unshift({
      id: `comm_${Date.now()}`,
      over: newOvers.toFixed(1),
      text: `${match.currentStriker ? match.currentStriker.name : 'Batter'} vs ${match.currentBowler ? match.currentBowler.name : 'Bowler'}: ${pick.commentary}`,
      badge: pick.badge,
      timestamp: new Date()
    });

    if (match.commentary.length > 25) match.commentary.pop();

    // Check match conclusion
    if (match.teamA.score > match.teamB.score) {
      match.status = 'completed';
      match.result = `${match.teamA.name} won by ${10 - match.teamA.wickets} wickets!`;
    }

    res.status(200).json({
      success: true,
      outcome: pick,
      match
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  simulateBall
};


const { STADIUMS, getStadiumById, getAllStadiums } = require('../data/stadiumsData');
const { calculateConditionMultipliers } = require('../services/stadiumConditionsService');

// @desc    Get all 15 authentic cricket stadiums
// @route   GET /api/stadiums
// @access  Public
const getStadiums = (req, res) => {
  const stadiums = getAllStadiums();
  res.status(200).json({
    success: true,
    count: stadiums.length,
    stadiums
  });
};

// @desc    Get single stadium by ID or name
// @route   GET /api/stadiums/:id
// @access  Public
const getStadiumDetails = (req, res) => {
  const { id } = req.params;
  const stadium = getStadiumById(id);
  if (!stadium) {
    return res.status(404).json({
      success: false,
      message: `Stadium with ID '${id}' not found.`
    });
  }

  const pitchType = req.query.pitchType || stadium.pitchType;
  const weather = req.query.weather || stadium.weatherProfile?.typicalCondition || 'Clear';
  const dayOfTest = Number(req.query.day || 1);
  const isEvening = req.query.isEvening === 'true';

  const conditionMultipliers = calculateConditionMultipliers({
    stadiumId: stadium.id,
    pitchType,
    weather,
    dayOfTest,
    isEveningSession: isEvening
  });

  res.status(200).json({
    success: true,
    stadium,
    conditions: conditionMultipliers
  });
};

module.exports = {
  getStadiums,
  getStadiumDetails
};


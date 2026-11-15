const express = require('express');
const router = express.Router();
const { getStadiums, getStadiumDetails } = require('../controllers/stadiumController');

router.get('/', getStadiums);
router.get('/:id', getStadiumDetails);

module.exports = router;


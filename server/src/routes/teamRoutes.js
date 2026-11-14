const express = require('express');
const router = express.Router();
const { getMyTeam, updateMyTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyTeam);
router.put('/my', protect, updateMyTeam);

module.exports = router;

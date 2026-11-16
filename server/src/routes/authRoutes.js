const express = require('express');
const router = express.Router();
const { register, login, demoLogin, guestLogin, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/demo', demoLogin);
router.post('/guest', guestLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;


const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { signToken } = require('../config/jwt');
const storeService = require('../services/storeService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, favoriteTeam } = req.body;

    const existingEmail = await storeService.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const existingUsername = await storeService.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.'
      });
    }

    const user = await storeService.createUser({
      username,
      email,
      password,
      favoriteTeam: favoriteTeam || 'Royal Challengers Bengaluru'
    });

    const token = signToken({ id: user._id, _id: user._id, username: user.username, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to CricketVerse!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteTeam: user.favoriteTeam,
        budget: user.budget,
        tier: user.tier,
        level: user.level,
        rating: user.rating,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await storeService.findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const token = signToken({ id: user._id, _id: user._id, username: user.username, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteTeam: user.favoriteTeam,
        budget: user.budget,
        tier: user.tier,
        level: user.level,
        rating: user.rating,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Demo 1-click login
// @route   POST /api/auth/demo
// @access  Public
const demoLogin = async (req, res, next) => {
  try {
    const user = await storeService.findUserByEmail('captain@cricketverse.com', true);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo user not found.'
      });
    }

    const token = signToken({ id: user._id, _id: user._id, username: user.username, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Demo manager profile authenticated.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        favoriteTeam: user.favoriteTeam,
        budget: user.budget,
        tier: user.tier,
        level: user.level,
        rating: user.rating,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Update current user profile / settings
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { favoriteTeam, avatar, preferences } = req.body;
    const updateData = {};
    if (favoriteTeam) updateData.favoriteTeam = favoriteTeam;
    if (avatar) updateData.avatar = avatar;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const updatedUser = await storeService.updateUser(req.user._id, updateData);

    res.status(200).json({
      success: true,
      message: 'Profile settings updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Guest 1-click login for multiplayer invites & multi-device play
// @route   POST /api/auth/guest
// @access  Public
const guestLogin = async (req, res, next) => {
  try {
    const { username, teamName } = req.body || {};
    const guestId = `usr_guest_${crypto.randomBytes(8).toString('hex')}`;
    const baseName = (username && username.trim().length >= 3)
      ? username.trim().substring(0, 16)
      : `Manager_${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await storeService.createUser({
      _id: guestId,
      username: `${baseName}`,
      email: `${guestId}@guest.cricketverse.app`,
      password: crypto.randomBytes(16).toString('hex'),
      favoriteTeam: teamName || 'Royal Challengers Bengaluru'
    });

    const token = signToken({
      id: user._id,
      _id: user._id,
      username: user.username,
      role: 'user',
      isGuest: true
    });

    res.status(200).json({
      success: true,
      message: `Welcome to the arena, Manager ${user.username}!`,
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        favoriteTeam: user.favoriteTeam,
        avatar: user.avatar,
        isGuest: true
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  guestLogin,
  getMe,
  updateProfile
};


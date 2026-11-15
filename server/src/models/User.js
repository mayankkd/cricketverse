const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  _id: {
    type: String
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [24, 'Username cannot exceed 24 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  favoriteTeam: {
    type: String,
    default: 'Royal Challengers Bengaluru'
  },
  budget: {
    type: Number,
    default: 1000000000 // 100 Crores
  },
  tier: {
    type: String,
    enum: ['Rookie', 'All-Star', 'Legend', 'Master', 'Immortal'],
    default: 'Rookie'
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 250
  },
  rating: {
    type: Number,
    default: 1200
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    auctionsWon: { type: Number, default: 0 }
  },
  preferences: {
    soundEnabled: { type: Boolean, default: true },
    commentaryLanguage: { type: String, default: 'English (Harsha & Ravi)' },
    graphicsQuality: { type: String, default: 'Ultra HDR' },
    simulationSpeed: { type: String, default: 'Normal (1x)' },
    pushNotifications: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


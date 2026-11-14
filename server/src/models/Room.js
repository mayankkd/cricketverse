const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  teamName: { type: String, required: true },
  isReady: { type: Boolean, default: false },
  isHost: { type: Boolean, default: false },
  budgetRemaining: { type: Number, default: 1000000000 },
  squad: [{ type: String }] // Player IDs
});

const chatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Room title is required'],
    trim: true
  },
  hostId: {
    type: String,
    required: true
  },
  hostUsername: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'auction', 'match', 'completed'],
    default: 'waiting'
  },
  format: {
    type: String,
    enum: ['T20', 'ODI', 'The Hundred', 'Super Over'],
    default: 'T20'
  },
  maxTeams: {
    type: Number,
    min: 2,
    max: 10,
    default: 8
  },
  budgetPerTeam: {
    type: Number,
    default: 1000000000 // 100 Crores
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: ''
  },
  participants: [participantSchema],
  chatMessages: [chatMessageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);

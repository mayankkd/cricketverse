require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const morgan = require('morgan');

const { connectDB, getDBStatus } = require('./config/db');
const { seedMongoIfEmpty } = require('./services/storeService');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const { initMultiplayerSockets } = require('./sockets/multiplayerSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const playerRoutes = require('./routes/playerRoutes');
const teamRoutes = require('./routes/teamRoutes');
const matchRoutes = require('./routes/matchRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const stadiumRoutes = require('./routes/stadiumRoutes');
const advancedSystemsRoutes = require('./routes/advancedSystemsRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize Socket.IO Real-time Multiplayer & Spectator Architecture
initMultiplayerSockets(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Only use morgan if socket exists (prevents in-process test runner mock errors)
    if (req.socket && req.socket.remoteAddress) {
      return morgan('dev')(req, res, next);
    }
    next();
  });
}

// Health check & System info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'CRICKETVERSE Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/advanced', advancedSystemsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Start server
const start = async () => {
  await connectDB();
  await seedMongoIfEmpty();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏏 CRICKETVERSE Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎮 Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

// Export app, server, and io for testing and socket operations
module.exports = { app, server, start, io };

// Run if called directly
if (require.main === module) {
  start();
}

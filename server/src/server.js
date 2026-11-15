require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { connectDB, getDBStatus } = require('./config/db');
const { seedMongoIfEmpty } = require('./services/storeService');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiRateLimiter, authRateLimiter } = require('./middleware/rateLimitMiddleware');

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

// Security & Rate Limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api', apiRateLimiter);

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

// Serve static client production build if available
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Start server
const start = async () => {
  await connectDB();
  await seedMongoIfEmpty();

  server.listen(PORT, '0.0.0.0', () => {
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

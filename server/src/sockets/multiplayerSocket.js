const jwt = require('jsonwebtoken');
const storeService = require('../services/storeService');

const initMultiplayerSockets = (io) => {
  // Socket Handshake Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'cricketverse_super_secret_jwt_key_2026'
        );
        socket.user = decoded;
      } catch (err) {
        // Continue as guest socket
        socket.user = null;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connection established: ${socket.id} (User: ${socket.user?.username || 'Guest'})`);

    // Join room lobby channel
    socket.on('join_room', async ({ roomCode, role = 'player', teamName = '' }) => {
      try {
        if (!roomCode) return;
        const code = roomCode.toUpperCase();
        const room = await storeService.getRoomByCode(code);
        if (!room) {
          return socket.emit('action_error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
        }

        socket.join(code);
        socket.currentRoomCode = code;

        // If authenticated user, track connection
        if (socket.user?._id) {
          const participant = (room.participants || []).find(p => p.userId === socket.user._id);
          if (participant) {
            participant.isConnected = true;
            participant.socketId = socket.id;
            socket.currentRole = participant.role;
            await storeService.updateRoom(code, { participants: room.participants });
          } else {
            socket.currentRole = role;
          }
        } else {
          socket.currentRole = role;
        }

        if (socket.currentRole === 'spectator') {
          socket.join(`${code}:spectators`);
        }

        // Broadcast updated room state to all in room
        const updatedRoom = await storeService.getRoomByCode(code);
        io.to(code).emit('room_state', updatedRoom);
        io.to(code).emit('room_notification', {
          type: 'USER_JOINED',
          text: `${socket.user?.username || 'A visitor'} entered as ${socket.currentRole.toUpperCase()}.`
        });
      } catch (err) {
        socket.emit('action_error', { code: 'JOIN_ERROR', message: err.message });
      }
    });

    // Auction bid broadcast with SPECTATOR PERMISSION ENFORCEMENT
    socket.on('place_bid', async ({ roomCode, bidData }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        if (!code) return;

        const userId = socket.user?._id || bidData?.userId;
        if (!userId) {
          return socket.emit('action_error', {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to place a bid.'
          });
        }

        // SPECTATOR PERMISSION ENFORCEMENT:
        // Spectators are strictly barred from bidding
        await storeService.verifyPlayerActionPermission(code, userId, 'place bid');

        console.log(`[Socket] Bid approved in ${code}: ₹${bidData.amount} by ${bidData.username}`);
        io.to(code).emit('bid_updated', bidData);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'BID_REJECTED',
          message: err.message
        });
      }
    });

    // Nominate player with SPECTATOR PERMISSION ENFORCEMENT
    socket.on('nominate_player', async ({ roomCode, player }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) return;

        await storeService.verifyPlayerActionPermission(code, userId, 'nominate player');
        io.to(code).emit('player_nominated', player);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'ACTION_FORBIDDEN',
          message: err.message
        });
      }
    });

    // T2 Veto with SPECTATOR PERMISSION ENFORCEMENT
    socket.on('use_t2_veto', async ({ roomCode, vetoData }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) return;

        await storeService.verifyPlayerActionPermission(code, userId, 'use T2 Veto');
        io.to(code).emit('t2_veto_activated', vetoData);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'ACTION_FORBIDDEN',
          message: err.message
        });
      }
    });

    // Lineup/Tactics modification with SPECTATOR PERMISSION ENFORCEMENT
    socket.on('update_lineup', async ({ roomCode, lineupData }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) return;

        await storeService.verifyPlayerActionPermission(code, userId, 'modify lineup or tactics');
        io.to(code).emit('lineup_updated', lineupData);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'ACTION_FORBIDDEN',
          message: err.message
        });
      }
    });

    // Room chat with Spectator Chat host control
    socket.on('send_chat', async ({ roomCode, message }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        if (!code) return;

        const room = await storeService.getRoomByCode(code);
        if (!room) return;

        const userId = socket.user?._id;
        const participant = (room.participants || []).find(p => p.userId === userId);

        if (participant?.role === 'spectator' && room.spectatorChatEnabled === false) {
          return socket.emit('action_error', {
            code: 'SPECTATOR_CHAT_DISABLED',
            message: 'Spectator chat is disabled by the host.'
          });
        }

        io.to(code).emit('receive_chat', message);
      } catch (err) {
        console.error('[Socket Chat Error]:', err.message);
      }
    });

    // Start Arena Game (Host only, strictly validates minimum 2 active players)
    socket.on('start_game', async ({ roomCode }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) return;

        const updatedRoom = await storeService.startRoomGame(code, userId);
        io.to(code).emit('game_started', updatedRoom);
        io.to(code).emit('room_state', updatedRoom);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'START_ERROR',
          message: err.message
        });
      }
    });

    // Disconnect handling: preserve slot and mark disconnected
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      if (socket.currentRoomCode && socket.user?._id) {
        try {
          const room = await storeService.getRoomByCode(socket.currentRoomCode);
          if (room) {
            const participant = (room.participants || []).find(p => p.userId === socket.user._id);
            if (participant) {
              participant.isConnected = false;
              await storeService.updateRoom(socket.currentRoomCode, { participants: room.participants });
              io.to(socket.currentRoomCode).emit('user_disconnected', {
                userId: socket.user._id,
                username: socket.user.username,
                role: participant.role
              });
              const updatedRoom = await storeService.getRoomByCode(socket.currentRoomCode);
              io.to(socket.currentRoomCode).emit('room_state', updatedRoom);
            }
          }
        } catch (err) {
          console.error('[Socket Disconnect Error]:', err.message);
        }
      }
    });
  });
};

module.exports = { initMultiplayerSockets };

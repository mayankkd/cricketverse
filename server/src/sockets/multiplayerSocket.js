const jwt = require('jsonwebtoken');
const storeService = require('../services/storeService');
const matchEngineService = require('../services/matchEngineService');
const auctionEngineService = require('../services/auctionEngineService');
const { getStadiumById } = require('../data/stadiumsData');

const initMultiplayerSockets = (io) => {
  // Bind Socket.IO instance to auction engine for automatic server-side countdowns
  auctionEngineService.bindSocketIO(io);

  // Socket Handshake Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'cricketverse_super_secret_jwt_key_2026'
        );
        const uId = String(decoded._id || decoded.id || '');
        socket.user = {
          ...decoded,
          _id: uId,
          id: uId,
          username: decoded.username || 'Guest'
        };
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
    socket.on('join_room', async ({ roomCode, role = 'player', teamName = '', token: joinToken }) => {
      try {
        if (!roomCode) return;
        const code = roomCode.toUpperCase();

        if (!socket.user && joinToken) {
          try {
            const decoded = jwt.verify(
              joinToken,
              process.env.JWT_SECRET || 'cricketverse_super_secret_jwt_key_2026'
            );
            const uId = String(decoded._id || decoded.id || '');
            socket.user = {
              ...decoded,
              _id: uId,
              id: uId,
              username: decoded.username || 'Guest'
            };
          } catch {}
        }

        const room = await storeService.getRoomByCode(code);
        if (!room) {
          return socket.emit('action_error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
        }

        socket.join(code);
        socket.currentRoomCode = code;

        // If authenticated user, track connection
        const currentUserId = String(socket.user?._id || socket.user?.id || '');
        if (currentUserId) {
          const participant = (room.participants || []).find(p => String(p.userId) === currentUserId);
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

    // Auction bid broadcast with SPECTATOR PERMISSION ENFORCEMENT & ENGINE SYNC
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
        await storeService.verifyPlayerActionPermission(code, userId, 'place bid');

        // Apply bid via storeService
        const updatedRoom = await storeService.placeAuctionBid(code, userId, {
          amount: bidData.amount
        });

        const currentLot = updatedRoom.auctionState?.currentLot;

        io.to(code).emit('bid_updated', {
          amount: currentLot?.currentBid || bidData.amount,
          username: currentLot?.highestBidderUsername || bidData.username,
          teamName: currentLot?.highestBidderTeam || bidData.teamName,
          userId,
          lot: currentLot,
          bidHistory: updatedRoom.auctionState?.bidHistory
        });

        io.to(code).emit('auction_state', updatedRoom.auctionState);
        io.to(code).emit('room_state', updatedRoom);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'BID_REJECTED',
          message: err.message
        });
      }
    });

    // Nominate player with SPECTATOR PERMISSION ENFORCEMENT & ENGINE SYNC
    socket.on('nominate_player', async ({ roomCode, player, cardId, playerId }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) {
          return socket.emit('action_error', { code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        await storeService.verifyPlayerActionPermission(code, userId, 'nominate player');

        const pId = cardId || player?._id || playerId || player?.playerId;
        const updatedRoom = await storeService.nominatePlayerForAuction(code, userId, {
          cardId: pId,
          playerId: pId
        });

        io.to(code).emit('player_nominated', updatedRoom.auctionState?.currentLot);
        io.to(code).emit('auction_state', updatedRoom.auctionState);
        io.to(code).emit('room_state', updatedRoom);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'ACTION_FORBIDDEN',
          message: err.message
        });
      }
    });

    // T2 Veto with SPECTATOR PERMISSION ENFORCEMENT & ENGINE SYNC
    socket.on('use_t2_veto', async ({ roomCode, vetoData }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) {
          return socket.emit('action_error', { code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        await storeService.verifyPlayerActionPermission(code, userId, 'use T2 Veto');

        const updatedRoom = await storeService.useT2Veto(code, userId);
        const participant = (updatedRoom.participants || []).find(p => p.userId === userId);

        io.to(code).emit('t2_veto_activated', {
          vetoedBy: participant?.username || socket.user?.username,
          userId,
          lot: updatedRoom.auctionState?.currentLot,
          remainingTokens: participant?.t2VetoTokens,
          vetoedLots: updatedRoom.auctionState?.vetoedLots
        });

        io.to(code).emit('auction_state', updatedRoom.auctionState);
        io.to(code).emit('room_state', updatedRoom);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'ACTION_FORBIDDEN',
          message: err.message
        });
      }
    });

    // Hammer sold / unsold resolution via socket
    socket.on('hammer_lot', async ({ roomCode }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!userId) return;

        const updatedRoom = await storeService.hammerCurrentLot(code, userId);

        io.to(code).emit('lot_hammered', {
          lot: updatedRoom.auctionState?.currentLot,
          soldLots: updatedRoom.auctionState?.soldLots,
          unsoldLots: updatedRoom.auctionState?.unsoldLots
        });

        io.to(code).emit('auction_state', updatedRoom.auctionState);
        io.to(code).emit('room_state', updatedRoom);
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

    // Host Selects Stadium (Synchronized in real-time to all players and spectators)
    socket.on('select_stadium', async ({ roomCode, stadiumId }) => {
      try {
        const code = (roomCode || socket.currentRoomCode || '').toUpperCase();
        const userId = socket.user?._id;
        if (!code || !userId) {
          return socket.emit('action_error', { code: 'UNAUTHORIZED', message: 'You must be logged in as host to select stadium.' });
        }

        const room = await storeService.getRoomByCode(code);
        if (!room) {
          return socket.emit('action_error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
        }

        if (room.hostId !== userId) {
          return socket.emit('action_error', { code: 'HOST_ONLY', message: 'Only the room host can select the stadium.' });
        }

        if (room.status === 'match' || room.status === 'completed') {
          return socket.emit('action_error', { code: 'STADIUM_LOCKED', message: 'Stadium selection is locked once match begins.' });
        }

        const stadiumData = getStadiumById(stadiumId);
        const updatedRoom = await storeService.updateRoom(code, {
          stadiumId: stadiumData.id,
          stadium: stadiumData
        });

        // Broadcast to all participants and spectators
        io.to(code).emit('stadium_selected', {
          roomCode: code,
          stadium: stadiumData,
          stadiumId: stadiumData.id
        });
        io.to(code).emit('room_state', updatedRoom);
        io.to(code).emit('room_notification', {
          type: 'STADIUM_SELECTED',
          text: `Host selected venue: ${stadiumData.fullName || stadiumData.name} (${stadiumData.city}, ${stadiumData.country}).`
        });
      } catch (err) {
        socket.emit('action_error', { code: 'STADIUM_ERROR', message: err.message });
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
        io.to(code).emit('auction_state', updatedRoom.auctionState);
        if (updatedRoom.auctionState?.currentLot) {
          io.to(code).emit('player_nominated', updatedRoom.auctionState.currentLot);
        }
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'START_ERROR',
          message: err.message
        });
      }
    });

    // ==========================================
    // PHASE 8: MULTIPLAYER REAL-TIME MATCH ENGINE
    // ==========================================

    // Join Match (Room Isolation, Capacity limit 6 players, Spectator fallback)
    socket.on('join_match', async ({ matchId, role = 'player', teamKey = 'teamA', fromSeq = 0 }) => {
      try {
        if (!matchId) {
          return socket.emit('action_error', { code: 'MATCH_ID_REQUIRED', message: 'matchId is required.' });
        }

        const roomChannel = `match:${matchId}`;
        socket.join(roomChannel);
        socket.currentMatchId = matchId;

        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.user?.username || (role === 'player' ? 'Player' : 'Spectator');

        const { match, participantRole, snapshot, event } = await matchEngineService.joinMatch(matchId, {
          userId,
          username,
          role,
          teamKey,
          socketId: socket.id
        });

        socket.currentMatchRole = participantRole;

        if (participantRole === 'spectator') {
          socket.join(`${roomChannel}:spectators`);
        }

        // Deliver initial authoritative snapshot to joining client
        socket.emit('match_snapshot', snapshot);

        // If fromSeq was provided for reconnection, deliver missing events
        if (fromSeq > 0) {
          const syncResult = await matchEngineService.syncMatch(matchId, { fromSeq, userId, socketId: socket.id });
          if (syncResult.mode === 'replay') {
            socket.emit('match_events_replay', syncResult);
          }
        }

        // Broadcast notification to all participants and spectators
        io.to(roomChannel).emit('match_event', event);
        io.to(roomChannel).emit('match_notification', {
          type: 'USER_JOINED_MATCH',
          userId,
          username,
          role: participantRole,
          text: `${username} joined match as ${participantRole.toUpperCase()}.`
        });
        io.to(roomChannel).emit('match_state', snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'MATCH_JOIN_ERROR',
          message: err.message
        });
      }
    });

    // Bowling Decision (Phase A)
    socket.on('submit_bowling_decision', async ({ matchId, deliverySeq, line, length, variation, idempotencyKey }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.submitBowlingDecision(id, userId, {
          deliverySeq,
          line,
          length,
          variation,
          idempotencyKey
        });

        if (result.duplicate) {
          return socket.emit('action_acknowledged', { duplicate: true, seq: result.seq });
        }

        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('bowling_committed', {
          seq: result.event.seq,
          matchId: id,
          deliverySeq: result.event.payload.deliverySeq,
          bowlingDecision: result.event.payload.bowlingDecision,
          nextTurn: result.nextPhase,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'BOWLING_ACTION_ERROR',
          message: err.message
        });
      }
    });

    // Batting Decision & Delivery Resolution (Phase B & C)
    socket.on('submit_batting_decision', async ({ matchId, deliverySeq, shotType, direction, timing, runsAttempted, riskyRun, idempotencyKey }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.submitBattingDecision(id, userId, {
          deliverySeq,
          shotType,
          direction,
          timing,
          runsAttempted,
          riskyRun,
          idempotencyKey
        });

        if (result.duplicate) {
          return socket.emit('action_acknowledged', { duplicate: true, seq: result.seq });
        }

        const roomChannel = `match:${id}`;
        // Broadcast delivery outcome to both teams and spectators simultaneously
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('delivery_result', {
          seq: result.event.seq,
          matchId: id,
          deliverySeq: result.event.payload.deliverySeq,
          outcome: result.outcome,
          deliveryData: result.deliveryData,
          snapshot: result.snapshot,
          inningsEnded: result.inningsEnded,
          matchCompleted: result.matchCompleted
        });
        io.to(roomChannel).emit('match_state', result.snapshot);

        if (result.inningsEnded) {
          io.to(roomChannel).emit('innings_ended', {
            matchId: id,
            currentInnings: result.snapshot.currentInnings,
            targetScore: result.snapshot.targetScore,
            snapshot: result.snapshot
          });
        }

        if (result.matchCompleted) {
          io.to(roomChannel).emit('match_ended', {
            matchId: id,
            result: result.snapshot.result,
            snapshot: result.snapshot
          });
        }
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'BATTING_ACTION_ERROR',
          message: err.message
        });
      }
    });

    // Coordinated Single Delivery Execution (for 1-click execution or tactical auto-simulation)
    socket.on('submit_match_delivery', async ({ matchId, deliveryInput, idempotencyKey }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.submitFullDeliveryTurn(id, userId, {
          ...deliveryInput,
          idempotencyKey
        });

        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('delivery_result', {
          seq: result.event.seq,
          matchId: id,
          deliverySeq: result.event.payload.deliverySeq,
          outcome: result.outcome,
          deliveryData: result.deliveryData,
          snapshot: result.snapshot,
          inningsEnded: result.inningsEnded,
          matchCompleted: result.matchCompleted
        });
        io.to(roomChannel).emit('match_state', result.snapshot);

        if (result.inningsEnded) {
          io.to(roomChannel).emit('innings_ended', {
            matchId: id,
            targetScore: result.snapshot.targetScore,
            snapshot: result.snapshot
          });
        }

        if (result.matchCompleted) {
          io.to(roomChannel).emit('match_ended', {
            matchId: id,
            result: result.snapshot.result,
            snapshot: result.snapshot
          });
        }
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'DELIVERY_ERROR',
          message: err.message
        });
      }
    });

    // Reconnection & Event Synchronization Request
    socket.on('sync_match', async ({ matchId, fromSeq = 0 }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id;

        const syncResult = await matchEngineService.syncMatch(id, { fromSeq, userId, socketId: socket.id });
        socket.emit('match_synced', syncResult);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'SYNC_ERROR',
          message: err.message
        });
      }
    });

    // Test Cricket Declaration
    socket.on('declare_innings', async ({ matchId }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.declareInnings(id, userId);
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('innings_declared', {
          matchId: id,
          declared: true,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'DECLARATION_ERROR',
          message: err.message
        });
      }
    });

    // Test Cricket Follow-On Enforcement
    socket.on('enforce_follow_on', async ({ matchId }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.enforceFollowOn(id, userId);
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('follow_on_enforced', {
          matchId: id,
          followOnEnforced: true,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'FOLLOW_ON_ERROR',
          message: err.message
        });
      }
    });

    // T20 Tactical Timeout
    socket.on('call_tactical_timeout', async ({ matchId }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;
        const userId = socket.user?._id || `guest_${socket.id.slice(0, 8)}`;

        const result = await matchEngineService.callTacticalTimeout(id, userId);
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('tactical_timeout_called', {
          matchId: id,
          isTimeoutActive: true,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'TIMEOUT_ERROR',
          message: err.message
        });
      }
    });

    // Resume Tactical Timeout
    socket.on('resume_tactical_timeout', async ({ matchId }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;

        const result = await matchEngineService.resumeTacticalTimeout(id);
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('tactical_timeout_resumed', {
          matchId: id,
          isTimeoutActive: false,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'TIMEOUT_RESUME_ERROR',
          message: err.message
        });
      }
    });

    // DLS Target Adjustment
    socket.on('apply_dls', async ({ matchId, oversLost, targetTeamOversTotal }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;

        const result = await matchEngineService.applyDLSRevision(id, { oversLost, targetTeamOversTotal });
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('dls_applied', {
          matchId: id,
          dls: result.dls,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'DLS_ERROR',
          message: err.message
        });
      }
    });

    // Set Stadium & Weather Conditions
    socket.on('set_stadium_conditions', async ({ matchId, conditions }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;

        const result = await matchEngineService.setStadiumAndConditions(id, conditions || {});
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('match_event', result.event);
        io.to(roomChannel).emit('conditions_updated', {
          matchId: id,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'CONDITIONS_ERROR',
          message: err.message
        });
      }
    });

    // Change Commentary Personality in Real-Time
    socket.on('change_commentary_personality', async ({ matchId, personality }) => {
      try {
        const id = matchId || socket.currentMatchId;
        if (!id) return;

        const result = await matchEngineService.setCommentaryPersonality(id, personality);
        const roomChannel = `match:${id}`;
        io.to(roomChannel).emit('commentary_personality_changed', {
          matchId: id,
          personality: result.personality,
          snapshot: result.snapshot
        });
        io.to(roomChannel).emit('match_state', result.snapshot);
      } catch (err) {
        socket.emit('action_error', {
          code: err.code || 'PERSONALITY_ERROR',
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


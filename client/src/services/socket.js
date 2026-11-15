import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  getSocket() {
    if (!this.socket) {
      const token = localStorage.getItem('cricketverse_token');
      // Resolve socket URL: VITE_SOCKET_URL -> VITE_API_URL -> LAN/Localhost (port 5001) in dev -> window.location.origin
      let socketUrl = window.location.origin;
      if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) {
        socketUrl = import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
      } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
        socketUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
      } else if (typeof window !== 'undefined' && window.location && window.location.port === '5173') {
        const hostname = window.location.hostname || 'localhost';
        socketUrl = `http://${hostname}:5001`;
      }

      this.socket = io(socketUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        auth: { token },
        query: { token }
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('[SocketService] Connected with socket ID:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log('[SocketService] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SocketService] Connection error:', err.message);
      });
    }
    return this.socket;
  }

  joinRoom(roomCode, options = {}) {
    const socket = this.getSocket();
    socket.emit('join_room', {
      roomCode,
      role: options.role || 'player',
      teamName: options.teamName || ''
    });
  }

  sendChat(roomCode, message) {
    const socket = this.getSocket();
    socket.emit('send_chat', { roomCode, message });
  }

  placeBid(roomCode, bidData) {
    const socket = this.getSocket();
    socket.emit('place_bid', { roomCode, bidData });
  }

  nominatePlayer(roomCode, player) {
    const socket = this.getSocket();
    socket.emit('nominate_player', { roomCode, player });
  }

  useT2Veto(roomCode, vetoData) {
    const socket = this.getSocket();
    socket.emit('use_t2_veto', { roomCode, vetoData });
  }

  updateLineup(roomCode, lineupData) {
    const socket = this.getSocket();
    socket.emit('update_lineup', { roomCode, lineupData });
  }

  startGame(roomCode) {
    const socket = this.getSocket();
    socket.emit('start_game', { roomCode });
  }

  selectStadium(roomCode, stadiumId) {
    const socket = this.getSocket();
    socket.emit('select_stadium', { roomCode, stadiumId });
  }

  onStadiumSelected(callback) {
    const socket = this.getSocket();
    socket.on('stadium_selected', callback);
    return () => socket.off('stadium_selected', callback);
  }

  onRoomState(callback) {
    const socket = this.getSocket();
    socket.on('room_state', callback);
    return () => socket.off('room_state', callback);
  }

  onBidUpdated(callback) {
    const socket = this.getSocket();
    socket.on('bid_updated', callback);
    return () => socket.off('bid_updated', callback);
  }

  onReceiveChat(callback) {
    const socket = this.getSocket();
    socket.on('receive_chat', callback);
    return () => socket.off('receive_chat', callback);
  }

  onNotification(callback) {
    const socket = this.getSocket();
    socket.on('room_notification', callback);
    return () => socket.off('room_notification', callback);
  }

  hammerLot(roomCode) {
    const socket = this.getSocket();
    socket.emit('hammer_lot', { roomCode });
  }

  onAuctionState(callback) {
    const socket = this.getSocket();
    socket.on('auction_state', callback);
    return () => socket.off('auction_state', callback);
  }

  onPlayerNominated(callback) {
    const socket = this.getSocket();
    socket.on('player_nominated', callback);
    return () => socket.off('player_nominated', callback);
  }

  onT2VetoActivated(callback) {
    const socket = this.getSocket();
    socket.on('t2_veto_activated', callback);
    return () => socket.off('t2_veto_activated', callback);
  }

  onLotHammered(callback) {
    const socket = this.getSocket();
    socket.on('lot_hammered', callback);
    return () => socket.off('lot_hammered', callback);
  }

  onActionError(callback) {
    const socket = this.getSocket();
    socket.on('action_error', callback);
    return () => socket.off('action_error', callback);
  }

  onGameStarted(callback) {
    const socket = this.getSocket();
    socket.on('game_started', callback);
    return () => socket.off('game_started', callback);
  }

  // ==========================================
  // PHASE 8: MULTIPLAYER REAL-TIME MATCH ENGINE
  // ==========================================

  joinMatch(matchId, options = {}) {
    const socket = this.getSocket();
    socket.emit('join_match', {
      matchId,
      role: options.role || 'player',
      teamKey: options.teamKey || 'teamA',
      fromSeq: options.fromSeq || 0
    });
  }

  submitBowlingDecision(matchId, data = {}) {
    const socket = this.getSocket();
    socket.emit('submit_bowling_decision', {
      matchId,
      ...data
    });
  }

  submitBattingDecision(matchId, data = {}) {
    const socket = this.getSocket();
    socket.emit('submit_batting_decision', {
      matchId,
      ...data
    });
  }

  submitMatchDelivery(matchId, deliveryInput, idempotencyKey = null) {
    const socket = this.getSocket();
    socket.emit('submit_match_delivery', {
      matchId,
      deliveryInput,
      idempotencyKey
    });
  }

  syncMatch(matchId, fromSeq = 0) {
    const socket = this.getSocket();
    socket.emit('sync_match', { matchId, fromSeq });
  }

  onMatchSnapshot(callback) {
    const socket = this.getSocket();
    socket.on('match_snapshot', callback);
    return () => socket.off('match_snapshot', callback);
  }

  onMatchState(callback) {
    const socket = this.getSocket();
    socket.on('match_state', callback);
    return () => socket.off('match_state', callback);
  }

  onMatchEvent(callback) {
    const socket = this.getSocket();
    socket.on('match_event', callback);
    return () => socket.off('match_event', callback);
  }

  onBowlingCommitted(callback) {
    const socket = this.getSocket();
    socket.on('bowling_committed', callback);
    return () => socket.off('bowling_committed', callback);
  }

  onDeliveryResult(callback) {
    const socket = this.getSocket();
    socket.on('delivery_result', callback);
    return () => socket.off('delivery_result', callback);
  }

  onInningsEnded(callback) {
    const socket = this.getSocket();
    socket.on('innings_ended', callback);
    return () => socket.off('innings_ended', callback);
  }

  onMatchEnded(callback) {
    const socket = this.getSocket();
    socket.on('match_ended', callback);
    return () => socket.off('match_ended', callback);
  }

  onMatchSynced(callback) {
    const socket = this.getSocket();
    socket.on('match_synced', callback);
    return () => socket.off('match_synced', callback);
  }

  onMatchNotification(callback) {
    const socket = this.getSocket();
    socket.on('match_notification', callback);
    return () => socket.off('match_notification', callback);
  }

  // Phase 9: Match Format & Stadium Actions
  declareInnings(matchId) {
    const socket = this.getSocket();
    socket.emit('declare_innings', { matchId });
  }

  enforceFollowOn(matchId) {
    const socket = this.getSocket();
    socket.emit('enforce_follow_on', { matchId });
  }

  callTacticalTimeout(matchId) {
    const socket = this.getSocket();
    socket.emit('call_tactical_timeout', { matchId });
  }

  resumeTacticalTimeout(matchId) {
    const socket = this.getSocket();
    socket.emit('resume_tactical_timeout', { matchId });
  }

  applyDLS(matchId, oversLost, targetTeamOversTotal = 50) {
    const socket = this.getSocket();
    socket.emit('apply_dls', { matchId, oversLost, targetTeamOversTotal });
  }

  setStadiumConditions(matchId, conditions) {
    const socket = this.getSocket();
    socket.emit('set_stadium_conditions', { matchId, conditions });
  }

  onInningsDeclared(callback) {
    const socket = this.getSocket();
    socket.on('innings_declared', callback);
    return () => socket.off('innings_declared', callback);
  }

  onFollowOnEnforced(callback) {
    const socket = this.getSocket();
    socket.on('follow_on_enforced', callback);
    return () => socket.off('follow_on_enforced', callback);
  }

  onTacticalTimeoutCalled(callback) {
    const socket = this.getSocket();
    socket.on('tactical_timeout_called', callback);
    return () => socket.off('tactical_timeout_called', callback);
  }

  onTacticalTimeoutResumed(callback) {
    const socket = this.getSocket();
    socket.on('tactical_timeout_resumed', callback);
    return () => socket.off('tactical_timeout_resumed', callback);
  }

  onDLSApplied(callback) {
    const socket = this.getSocket();
    socket.on('dls_applied', callback);
    return () => socket.off('dls_applied', callback);
  }

  onConditionsUpdated(callback) {
    const socket = this.getSocket();
    socket.on('conditions_updated', callback);
    return () => socket.off('conditions_updated', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  connect() {
    return this.getSocket();
  }
}

export const socketService = new SocketService();
export default socketService;


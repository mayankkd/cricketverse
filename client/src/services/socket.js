import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  getSocket() {
    if (!this.socket) {
      const token = localStorage.getItem('cricketverse_token');
      // In Vite dev proxy or production, connect to current host origin
      const socketUrl = window.location.origin;

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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();


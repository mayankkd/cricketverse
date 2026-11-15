const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('cricketverse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateProfile(data) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Rooms
  async getRooms() {
    const res = await fetch(`${API_BASE}/rooms`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getRoom(roomCode) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async createRoom(data) {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async joinRoom(roomCode, data) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async sendRoomChat(roomCode, text) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    return await res.json();
  },

  async toggleReady(roomCode) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/ready`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async previewInvitation(token) {
    const res = await fetch(`${API_BASE}/rooms/invitation/${token}`);
    return await res.json();
  },

  async joinByInvite(token, data) {
    const res = await fetch(`${API_BASE}/rooms/join-invite/${token}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async generateInvitation(roomCode, data) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/invitations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async revokeInvitation(roomCode) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/invitations/revoke`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateRoomSettings(roomCode, settings) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings || {})
    });
    return await res.json();
  },

  async kickParticipant(roomCode, userId) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/participants/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async startRoomGame(roomCode) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async placeBid(roomCode, data) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/bid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async nominatePlayer(roomCode, data) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/nominate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async getAuctionState(roomCode) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/state`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async initAuction(roomCode, data) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/init`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async nominateRandomAuctionPlayer(roomCode) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/nominate-random`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async useT2Veto(roomCode) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/veto`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async hammerAuctionLot(roomCode) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/hammer`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async startUnsoldRound(roomCode) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/unsold-round`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateAuctionSettings(roomCode, settings) {
    const res = await fetch(`${API_BASE}/auction/${roomCode}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings || {})
    });
    return await res.json();
  },

  async updateRoomLineup(roomCode, data) {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/lineup`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  // Players
  async getPlayers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/players${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getPlayerById(id) {
    const res = await fetch(`${API_BASE}/players/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async comparePlayers(id1, id2) {
    const res = await fetch(`${API_BASE}/players/compare/${id1}/${id2}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getPlayerFilterMetadata() {
    const res = await fetch(`${API_BASE}/players/meta/filters`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Teams
  async getMyTeam() {
    const res = await fetch(`${API_BASE}/teams/my`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateMyTeam(data) {
    const res = await fetch(`${API_BASE}/teams/my`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Matches
  async getMatches() {
    const res = await fetch(`${API_BASE}/matches`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getMatchById(id) {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async simulateBall(matchId) {
    const res = await fetch(`${API_BASE}/matches/${matchId}/simulate-ball`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Tournaments
  async getTournaments() {
    const res = await fetch(`${API_BASE}/tournaments`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTournamentById(id) {
    const res = await fetch(`${API_BASE}/tournaments/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  }
};


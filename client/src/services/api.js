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

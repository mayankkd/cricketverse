const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  // When running on Vite dev port 5173, talk directly to backend on port 5001 using the same host (localhost or LAN IP)
  if (typeof window !== 'undefined' && window.location && window.location.port === '5173') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5001/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem('cricketverse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Universal safe request executor. Never blindly calls res.json() on empty responses.
 * Guarantees a parsed JSON payload or meaningful structured response even when network drops or returns HTML.
 */
async function safeFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (netErr) {
    if (url.startsWith('http://localhost:5001/api')) {
      const fallbackUrl = url.replace('http://localhost:5001/api', '/api');
      try {
        response = await fetch(fallbackUrl, options);
      } catch {
        throw new Error(`Cannot connect to game server at ${url}. Please verify server is running.`);
      }
    } else {
      throw new Error(`Network connection error: ${netErr.message}`);
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  let data = null;
  if (responseText.trim() && contentType.includes('application/json')) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Server returned invalid JSON.');
    }
  } else if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new Error(`Server returned error (${response.status}): ${responseText.slice(0, 150)}`);
      }
    }
  }

  if (!response.ok) {
    const errorMsg = data?.message || (data?.errors ? (Array.isArray(data.errors) ? data.errors.join(', ') : data.errors) : `Server error (${response.status})`);
    return {
      ok: false,
      status: response.status,
      headers: response.headers,
      text: async () => responseText,
      json: async () => (data || { success: false, message: errorMsg, status: response.status })
    };
  }

  return {
    ok: true,
    status: response.status,
    headers: response.headers,
    text: async () => responseText,
    json: async () => (data !== null ? data : { success: true, status: response.status })
  };
}

export const api = {
  // Auth
  async register(data) {
    const res = await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async login(data) {
    const res = await safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async demoLogin() {
    const res = await safeFetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  async guestLogin(data = {}) {
    const res = await safeFetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getMe() {
    const res = await safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateProfile(data) {
    const res = await safeFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Rooms
  async getRooms() {
    const res = await safeFetch(`${API_BASE}/rooms`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getRoom(roomCode) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async createRoom(data) {
    const res = await safeFetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async joinRoom(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async sendRoomChat(roomCode, text) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    return await res.json();
  },

  async toggleReady(roomCode) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/ready`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async previewInvitation(token) {
    const res = await safeFetch(`${API_BASE}/rooms/invitation/${token}`);
    return await res.json();
  },

  async getNetworkInfo() {
    const res = await safeFetch(`${API_BASE}/network-info`);
    return await res.json();
  },

  async joinByInvite(token, data) {
    const res = await safeFetch(`${API_BASE}/rooms/join-invite/${token}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async generateInvitation(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/invitations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async revokeInvitation(roomCode) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/invitations/revoke`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateRoomSettings(roomCode, settings) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings || {})
    });
    return await res.json();
  },

  async kickParticipant(roomCode, userId) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/participants/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async startRoomGame(roomCode) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async placeBid(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/bid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async nominatePlayer(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/nominate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async getAuctionState(roomCode) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/state`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async initAuction(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/init`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  async nominateRandomAuctionPlayer(roomCode) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/nominate-random`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async useT2Veto(roomCode) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/veto`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async hammerAuctionLot(roomCode) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/hammer`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async startUnsoldRound(roomCode) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/unsold-round`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateAuctionSettings(roomCode, settings) {
    const res = await safeFetch(`${API_BASE}/auction/${roomCode}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings || {})
    });
    return await res.json();
  },

  async updateRoomLineup(roomCode, data) {
    const res = await safeFetch(`${API_BASE}/rooms/${roomCode}/lineup`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {})
    });
    return await res.json();
  },

  // Players
  async getPlayers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/players${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getPlayerById(id) {
    const res = await safeFetch(`${API_BASE}/players/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async comparePlayers(id1, id2) {
    const res = await safeFetch(`${API_BASE}/players/compare/${id1}/${id2}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getPlayerFilterMetadata() {
    const res = await safeFetch(`${API_BASE}/players/meta/filters`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Teams
  async getMyTeam(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/teams/my${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTeamById(id) {
    const res = await safeFetch(`${API_BASE}/teams/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTeamsByRoom(roomCode) {
    const res = await safeFetch(`${API_BASE}/teams/room/${roomCode}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateMyTeam(idOrData, data) {
    const teamId = typeof idOrData === 'string' ? idOrData : idOrData?._id;
    const payload = typeof idOrData === 'string' ? data : idOrData;
    const url = teamId ? `${API_BASE}/teams/${teamId}` : `${API_BASE}/teams/my`;
    const res = await safeFetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async updateTeam(id, data) {
    const res = await safeFetch(`${API_BASE}/teams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async swapTeamPlayer(teamId, data) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/swap`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async configureRoomSquadLimits(roomCode, limits) {
    const res = await safeFetch(`${API_BASE}/teams/room/${roomCode}/squad-limits`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(limits)
    });
    return await res.json();
  },

  // Tactical Management
  async getTeamTactics(teamId) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/tactics`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateTeamTactics(teamId, data) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/tactics`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getMatchTactics(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/tactics`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async updateMatchTactics(matchId, data) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/tactics`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Matches
  async getMatches() {
    const res = await safeFetch(`${API_BASE}/matches`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getMatchById(id) {
    const res = await safeFetch(`${API_BASE}/matches/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async simulateBall(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/simulate-ball`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async playDelivery(matchId, deliveryData = {}) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/play-delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deliveryData)
    });
    return await res.json();
  },

  // Phase 9: Stadiums & Match Formats
  async getStadiums() {
    const res = await safeFetch(`${API_BASE}/stadiums`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getStadiumById(id) {
    const res = await safeFetch(`${API_BASE}/stadiums/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async declareInnings(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/declare`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async enforceFollowOn(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/follow-on`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async callTacticalTimeout(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/timeout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async resumeTacticalTimeout(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/timeout/resume`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async applyDLS(matchId, dlsData = {}) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/dls`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dlsData)
    });
    return await res.json();
  },

  async setConditions(matchId, conditionsData = {}) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/conditions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conditionsData)
    });
    return await res.json();
  },

  // Phase 10: Broadcast & Telemetry Analytics
  async getMatchAnalytics(matchId) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/analytics`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async setCommentaryPersonality(matchId, personality) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/personality`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ personality })
    });
    return await res.json();
  },

  async compareMatchPlayers(matchId, player1Id, player2Id) {
    const res = await safeFetch(`${API_BASE}/matches/${matchId}/compare-players?player1Id=${player1Id}&player2Id=${player2Id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Tournaments
  async getTournaments() {
    const res = await safeFetch(`${API_BASE}/tournaments`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTournamentById(id) {
    const res = await safeFetch(`${API_BASE}/tournaments/${id}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Phase 11: Tournaments & Game Modes
  async getGameModes() {
    const res = await safeFetch(`${API_BASE}/tournaments/modes`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getHistoricalChallenges() {
    const res = await safeFetch(`${API_BASE}/tournaments/historical-challenges`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getRivalries() {
    const res = await safeFetch(`${API_BASE}/tournaments/rivalries`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getScenarios() {
    const res = await safeFetch(`${API_BASE}/tournaments/scenarios`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async createCustomTournament(data = {}) {
    const res = await safeFetch(`${API_BASE}/tournaments/custom`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getTournamentAwards(id) {
    const res = await safeFetch(`${API_BASE}/tournaments/${id}/awards`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async simulateTournamentFixture(tournamentId, fixtureId) {
    const res = await safeFetch(`${API_BASE}/tournaments/${tournamentId}/matches/${fixtureId}/simulate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Phase 11: Franchise Legacy & Multi-Season Retention
  async getFranchiseLegacy(teamId) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/legacy`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getSeasonRecap(teamId, seasonId) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/legacy/recap${seasonId ? `?seasonId=${seasonId}` : ''}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async retainPlayers(teamId, retentions = []) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/legacy/retentions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ retentions })
    });
    return await res.json();
  },

  async transferPlayer(data = {}) {
    const res = await safeFetch(`${API_BASE}/teams/legacy/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async rolloverToNextSeason(teamId, data = {}) {
    const res = await safeFetch(`${API_BASE}/teams/${teamId}/legacy/rollover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Phase 12: Advanced Game Systems
  async trainPlayer(playerId, drillType = 'Batting') {
    const res = await safeFetch(`${API_BASE}/advanced/players/${playerId}/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ drillType })
    });
    return await res.json();
  },

  async recoverPlayer(playerId, method = 'physio') {
    const res = await safeFetch(`${API_BASE}/advanced/players/${playerId}/recover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ method })
    });
    return await res.json();
  },

  async getPlayerDevelopment(playerId) {
    const res = await safeFetch(`${API_BASE}/advanced/players/${playerId}/development`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getTeamChemistry(teamId) {
    const res = await safeFetch(`${API_BASE}/advanced/teams/${teamId}/chemistry`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getOpponentScouting(teamId, opponentId) {
    const res = await safeFetch(`${API_BASE}/advanced/teams/${teamId}/scouting/${opponentId}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getMatchDocumentary(matchId) {
    const res = await safeFetch(`${API_BASE}/advanced/matches/${matchId}/documentary`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getDrsReview(matchId) {
    const res = await safeFetch(`${API_BASE}/advanced/matches/${matchId}/drs-review`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getAuctionAwards(roomCode) {
    const res = await safeFetch(`${API_BASE}/advanced/auction/${roomCode}/awards`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  async getVoiceChatToken(matchId, userData = {}) {
    const res = await safeFetch(`${API_BASE}/advanced/matches/${matchId}/voice/token`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return await res.json();
  }
};

export default api;


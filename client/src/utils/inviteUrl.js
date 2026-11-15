/**
 * CRICKETVERSE Dynamic Invitation URL Generator
 *
 * Supports:
 * 1. Public Production URL (via VITE_APP_URL, e.g. https://cricketverse.app)
 * 2. Local Wi-Fi / LAN IP (e.g. http://192.168.1.15:5173 for cross-device testing)
 * 3. Localhost fallback for single-device testing
 */

export const getShareableInviteUrl = (inviteToken, roomCode) => {
  const code = inviteToken || roomCode;
  if (!code) return '';

  const path = inviteToken ? `/rooms/invite/${inviteToken}` : `/rooms/${roomCode}`;

  // 1. If public production VITE_APP_URL is explicitly configured (non-localhost)
  const envAppUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL
    ? import.meta.env.VITE_APP_URL.replace(/\/$/, '')
    : null;

  if (envAppUrl && !envAppUrl.includes('localhost') && !envAppUrl.includes('127.0.0.1')) {
    return `${envAppUrl}${path}`;
  }

  // 2. If browser is currently accessed via a public domain or LAN IP
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // If host is already accessing via public domain or LAN IP, use it!
    if (!isLocalhost) {
      return `${origin}${path}`;
    }
  }

  // 3. If VITE_APP_URL is set (even to a LAN IP in dev)
  if (envAppUrl) {
    return `${envAppUrl}${path}`;
  }

  // 4. Default fallback to current origin
  return typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}${path}`
    : `http://localhost:5173${path}`;
};

/**
 * Builds a LAN-specific invite URL given a LAN IP address
 */
export const buildLanInviteUrl = (lanIp, inviteToken, roomCode, port = 5173) => {
  const path = inviteToken ? `/rooms/invite/${inviteToken}` : `/rooms/${roomCode}`;
  if (!lanIp || lanIp === '127.0.0.1' || lanIp === 'localhost') {
    return getShareableInviteUrl(inviteToken, roomCode);
  }
  return `http://${lanIp}:${port}${path}`;
};


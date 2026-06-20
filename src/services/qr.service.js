/**
 * qr.service.js
 * In-memory QR session store with expiry (5 minutes)
 * Each session = { token, name, createdAt }
 * Mirror polls nothing — socket.io pushes instantly
 */

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Map<sessionId, { token, name, createdAt }>
const sessions = new Map();

// Clean up expired sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}, 60_000);

/**
 * Store a confirmed QR session (called when mobile login succeeds)
 * @param {string} sessionId  - Mirror's session ID
 * @param {string} token      - JWT token for the authenticated user
 * @param {string} name       - User's display name
 */
function confirmSession(sessionId, token, name) {
  sessions.set(sessionId, {
    token,
    name,
    createdAt: Date.now(),
  });
}

/**
 * Check if a session has been confirmed (used by REST fallback only)
 * @param {string} sessionId
 * @returns {{ token, name } | null}
 */
function getSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return { token: s.token, name: s.name };
}

/**
 * Delete a session after it's been consumed
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = { confirmSession, getSession, deleteSession };

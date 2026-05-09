// Custom authentication system using localStorage
// Session is stored locally, credentials validated against entities

const SESSION_KEY = 'educonnect_session';

export function getSession() {
  try {
    // sessionStorage is tab-isolated — prevents cross-user contamination
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
    // Fallback: migrate old localStorage session for this user only (then remove)
    const legacy = localStorage.getItem(SESSION_KEY);
    if (legacy) {
      sessionStorage.setItem(SESSION_KEY, legacy);
      localStorage.removeItem(SESSION_KEY);
      return JSON.parse(legacy);
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  // Use sessionStorage so each browser tab has its own independent session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Remove any leftover localStorage entry to avoid confusion
  localStorage.removeItem(SESSION_KEY);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isAdminSession() {
  const s = getSession();
  return s?.role === 'admin';
}

export function isStudentSession() {
  const s = getSession();
  return s?.role === 'student';
}

// Simple reversible hash (not for real security, just obfuscation)
export function hashPassword(password) {
  return btoa(unescape(encodeURIComponent(password + '_educonnect')));
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Returns current timestamp in ISO format adjusted to GMT-3 (Brasília)
export function nowBRT() {
  const now = new Date();
  // Offset to UTC-3
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().replace('Z', '-03:00');
}

// Generate a random access code like: EDU-XXXX-XXXX
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EDU-${seg(4)}-${seg(4)}`;
}
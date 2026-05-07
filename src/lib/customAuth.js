// Custom authentication system using localStorage
// Session is stored locally, credentials validated against entities

const SESSION_KEY = 'educonnect_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
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

// Generate a random access code like: EDU-XXXX-XXXX
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EDU-${seg(4)}-${seg(4)}`;
}
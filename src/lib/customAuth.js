// Custom authentication system using localStorage
// Session is stored locally, credentials validated against entities

const SESSION_KEY = 'educonnect_session';

function normalizeSession(session) {
  if (!session || typeof session !== 'object') return null;
  if (session.role !== 'admin' && !session.study_mode) {
    return { ...session, study_mode: 'diploma' };
  }
  return session;
}

export function getSession() {
  try {
    const remembered = localStorage.getItem(SESSION_KEY);
    if (remembered) return normalizeSession(JSON.parse(remembered));
    // sessionStorage is tab-isolated — prevents cross-user contamination
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return normalizeSession(JSON.parse(raw));
    // Fallback: migrate old localStorage session for this user only (then remove)
    const legacy = localStorage.getItem(SESSION_KEY);
    if (legacy) {
      sessionStorage.setItem(SESSION_KEY, legacy);
      localStorage.removeItem(SESSION_KEY);
      return normalizeSession(JSON.parse(legacy));
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(session, options = {}) {
  const normalized = normalizeSession(session);
  const { remember = false } = options;
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  // Use sessionStorage so each browser tab has its own independent session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
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

// Generate a random access code with course prefix: EDU/SEX/PSI-XXXX-XXXX (EDU remains the legacy prefix for TC)
export function generateCode(course = 'tcc') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const prefix = course === 'psicanalise' ? 'PSI' : course === 'sexologia' ? 'SEX' : 'EDU';
  return `${prefix}-${seg(4)}-${seg(4)}`;
}

export const MASTER_ADMIN_KEY_STORAGE = 'wr_master_admin_key';
export const ADMIN_GOOGLE_EMAIL_STORAGE = 'wr_admin_google_email';

export function getMasterAdminKey() {
  try {
    return localStorage.getItem(MASTER_ADMIN_KEY_STORAGE) || 'ADM-MASTER-2026';
  } catch {
    return 'ADM-MASTER-2026';
  }
}

export function setMasterAdminKey(key) {
  if (!key) return;
  const clean = String(key).trim().toUpperCase();
  try {
    localStorage.setItem(MASTER_ADMIN_KEY_STORAGE, clean);
  } catch {}
  return clean;
}

export function getAdminGoogleEmail() {
  try {
    return localStorage.getItem(ADMIN_GOOGLE_EMAIL_STORAGE) || 'williamribadm@gmail.com';
  } catch {
    return 'williamribadm@gmail.com';
  }
}

export function setAdminGoogleEmail(email) {
  if (!email) return;
  const clean = String(email).trim().toLowerCase();
  try {
    localStorage.setItem(ADMIN_GOOGLE_EMAIL_STORAGE, clean);
  } catch {}
  return clean;
}
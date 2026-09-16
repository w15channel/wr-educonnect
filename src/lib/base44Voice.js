import { base44 } from '@/api/base44Client';

// ════════════════════════════════════════════════════════════════════════
// LUNA VOICE SYSTEM
// ════════════════════════════════════════════════════════════════════════
// Features:
//   • Voice caching: reuses audio already generated for the same text,
//     saving AI generation costs when multiple students read the same lesson.
//   • Mute-aware: when the student has muted Luna, NO AI generation happens.
//   • Text normalization: removes page breaks and excessive whitespace that
//     cause long pauses (>3s) in TTS output.
//   • Friendly tone: uses 'honey' voice with warm pitch/speed parameters.
// ════════════════════════════════════════════════════════════════════════

const VOICE_CACHE_KEY = 'wr_luna_voice_cache';
const VOICE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MUTE_STORAGE_KEY = 'checklist-owl-voice';

// In-memory cache for the current session (fast, no localStorage parse)
const memoryCache = new Map();

/**
 * Simple hash function for cache keys (djb2 algorithm).
 */
function hashText(text) {
  const str = String(text || '');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Loads the persistent voice cache from localStorage.
 */
function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(VOICE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry?.url && (now - (entry.ts || 0)) < VOICE_CACHE_TTL_MS) {
        valid[key] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

/**
 * Saves the voice cache to localStorage.
 */
function savePersistentCache(cache) {
  try {
    const entries = Object.entries(cache);
    if (entries.length > 200) {
      entries.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
      cache = Object.fromEntries(entries.slice(0, 200));
    }
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full; silently ignore
  }
}

/**
 * Retrieves a cached audio URL for the given text, if available.
 */
function getCachedUrl(text) {
  const key = hashText(text);
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (Date.now() - entry.ts < VOICE_CACHE_TTL_MS) {
      return entry.url;
    }
    memoryCache.delete(key);
  }
  const persistent = loadPersistentCache();
  if (persistent[key]?.url && Date.now() - (persistent[key].ts || 0) < VOICE_CACHE_TTL_MS) {
    memoryCache.set(key, persistent[key]);
    return persistent[key].url;
  }
  return null;
}

/**
 * Stores an audio URL in both memory and persistent cache.
 */
function setCachedUrl(text, url) {
  if (!url) return;
  const key = hashText(text);
  const entry = { url, ts: Date.now() };
  memoryCache.set(key, entry);
  const persistent = loadPersistentCache();
  persistent[key] = entry;
  savePersistentCache(persistent);
}

/**
 * Normalizes text for speech generation:
 *   - Replaces page breaks and null chars with space
 *   - Collapses multiple newlines into a single pause (period)
 *   - Removes excessive whitespace
 *   - Ensures no more than 3 seconds of silence between segments
 */
export function normalizeTextForSpeech(text) {
  let normalized = String(text || '');
  // Remove form feed (page break), null bytes, and other control chars
  normalized = normalized.replace(/[\f\x00\x0B]/g, ' ');
  // Replace 3+ newlines with a period (creates a natural pause, not silence)
  normalized = normalized.replace(/\n{3,}/g, '. ');
  // Replace 2 newlines with a comma (short pause)
  normalized = normalized.replace(/\n{2}/g, ', ');
  // Replace single newlines with space
  normalized = normalized.replace(/\n/g, ' ');
  // Collapse multiple spaces
  normalized = normalized.replace(/ {2,}/g, ' ');
  // Replace multiple dots (ellipsis) with single period
  normalized = normalized.replace(/\.{2,}/g, '.');
  // Replace multiple dashes with comma
  normalized = normalized.replace(/[-]{2,}/g, ', ');
  // Trim leading/trailing whitespace
  normalized = normalized.trim();
  // Ensure the text ends with punctuation for a natural ending
  if (normalized && !/[.!?,;:]$/.test(normalized)) {
    normalized += '.';
  }
  return normalized;
}

/**
 * Checks if the Luna voice is enabled (not muted).
 * Reads the same localStorage key used by useOwlVoice.
 */
export function isVoiceEnabled() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Checks if the Luna voice is muted.
 */
export function isVoiceMuted() {
  return !isVoiceEnabled();
}

/**
 * Generates AI voice audio for the given text.
 * Uses cache when available to avoid redundant AI generation.
 * Returns null if the voice is muted (no AI generation).
 *
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Optional parameters
 * @param {boolean} options.force - Generate even if muted (default: false)
 * @param {boolean} options.useCache - Use cached audio if available (default: true)
 * @returns {Promise<Audio|null>} Audio element or null if muted
 */
export async function createBase44VoiceAudio(text, options = {}) {
  const { force = false, useCache = true } = options;

  // If voice is muted and not forced, do NOT generate AI audio
  if (!force && isVoiceMuted()) {
    return null;
  }

  const normalized = normalizeTextForSpeech(text);
  if (!normalized) return null;

  // Check cache first
  if (useCache) {
    const cachedUrl = getCachedUrl(normalized);
    if (cachedUrl) {
      try {
        const audio = new Audio(cachedUrl);
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
          setTimeout(reject, 5000);
        });
        return audio;
      } catch {
        // Cached URL might have expired
      }
    }
  }

  // Generate new audio via AI
  const response = await base44.integrations.Core.GenerateSpeech({
    text: normalized,
    voice: 'honey',
    language_code: 'pt',
    speed: 1.0,
    pitch: 1.15,
  });
  const url = response?.url;
  if (!url) throw new Error('Áudio da Luna indisponível.');

  // Cache the generated URL for reuse by other students
  if (useCache) {
    setCachedUrl(normalized, url);
  }

  return new Audio(url);
}

/**
 * Releases an audio element and frees resources.
 */
export function releaseBase44VoiceAudio(audio) {
  if (!audio) return;
  audio.onended = null;
  audio.onerror = null;
  audio.oncanplaythrough = null;
  audio.removeAttribute('src');
  audio.load();
}

/**
 * Clears all cached voice entries.
 */
export function clearVoiceCache() {
  memoryCache.clear();
  try {
    localStorage.removeItem(VOICE_CACHE_KEY);
  } catch {}
}

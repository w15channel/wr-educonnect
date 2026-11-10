export const GEMINI_READER_VOICE = 'Eclipse';
const MAX_TTS_INPUT = 3800;
const memoryCache = new Map();

export function normalizeSpeechText(text = '') {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TTS_INPUT);
}

function hashText(value = '') {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cacheKeyFor(text) {
  return `${GEMINI_READER_VOICE}:${hashText(text)}:${text.length}`;
}

export async function requestBase44VoiceUrl(text, { voice = GEMINI_READER_VOICE } = {}) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return null;

  const key = cacheKeyFor(normalized);
  if (memoryCache.has(key)) return memoryCache.get(key);

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: normalized,
      voice,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data?.audioBase64) {
    return null;
  }

  const mimeType = data.mimeType || 'audio/wav';
  const audioDataUrl = `data:${mimeType};base64,${data.audioBase64}`;
  memoryCache.set(key, audioDataUrl);
  return audioDataUrl;
}

export async function createBase44VoiceAudio(text, options = {}) {
  try {
    const audioUrl = await requestBase44VoiceUrl(text, {
      voice: GEMINI_READER_VOICE,
      ...options,
    });
    if (!audioUrl || typeof Audio === 'undefined') return null;
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audio.dataset.voice = GEMINI_READER_VOICE;
    return audio;
  } catch {
    return null;
  }
}

export function releaseBase44VoiceAudio(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.load?.();
  } catch {
    // ignore cleanup failures
  }
}
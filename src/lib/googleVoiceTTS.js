/**
 * Google Voice TTS & Media Session API integration.
 * Provides high-fidelity audio reading with background playback capabilities
 * (plays continuously when screen is locked or app is in background).
 */

export function selectBestGoogleVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;

  // Prefer Google Portuguese (Brazil) voices
  const googlePt = voices.find(
    (v) => (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Natural')) && v.lang.startsWith('pt')
  );
  if (googlePt) return googlePt;

  // Fallback to any pt-BR voice
  const ptBr = voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR');
  if (ptBr) return ptBr;

  // Any pt voice
  return voices.find((v) => v.lang.startsWith('pt')) || null;
}

/**
 * Configure MediaSession metadata and controls for lock-screen & background playback.
 */
export function setupMediaSession({ title, chapterTitle, audioRef, onPlay, onPause, onNext, onPrev }) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Aula da Apostila',
      artist: 'Prof. William Ribeiro | WR-EDU®',
      album: chapterTitle || 'Formação em Terapia Comportamental',
      artwork: [
        { src: '/favicon.ico', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      onPlay?.();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      onPause?.();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      onPrev?.();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      onNext?.();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef?.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef?.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skipTime, audioRef.current.duration || Infinity);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef?.current) {
        const skipTime = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
      }
    });
  } catch (err) {
    console.warn('[MediaSession] Non-critical setup error:', err);
  }
}

/**
 * Updates position state for lock screen seekbar.
 */
export function updateMediaSessionState(currentTime, duration, playbackRate = 1) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  if (!duration || !isFinite(duration) || duration <= 0) return;

  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate: Math.max(0.5, Math.min(playbackRate, 3.0)),
      position: Math.min(Math.max(0, currentTime), duration),
    });
  } catch {
    // Ignore invalid position values
  }
}

/**
 * Creates a silence buffer HTML5 Audio element to keep background audio session active on mobile web browsers.
 */
export function createKeepAliveAudioElement() {
  if (typeof window === 'undefined') return null;
  // 1 second silent WAV data URI
  const SILENT_WAV_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  const audio = new Audio(SILENT_WAV_URI);
  audio.loop = true;
  return audio;
}

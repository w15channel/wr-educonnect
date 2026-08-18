/**
 * Lazy loaders for the official third-party player SDKs.
 * ─────────────────────────────────────────────────────
 * A plain <iframe> embed cannot be controlled from our page (cross-origin), so
 * the WR player drives YouTube through the IFrame Player API and Vimeo through
 * the Player SDK. Both scripts are injected on demand (only when a lesson with
 * that provider is actually opened) and cached in a module-level promise so
 * they are downloaded once per session.
 */

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';
const VIMEO_API_SRC = 'https://player.vimeo.com/api/player.js';

let youtubePromise = null;
let vimeoPromise = null;

export function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Ambiente sem navegador'));
  if (window.YT && typeof window.YT.Player === 'function') return Promise.resolve(window.YT);
  if (youtubePromise) return youtubePromise;

  youtubePromise = new Promise((resolve, reject) => {
    // The YouTube API only exposes a single global ready callback, so chain any
    // previously registered one instead of overwriting it.
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve(window.YT);
    };

    const existing = document.querySelector(`script[src="${YOUTUBE_API_SRC}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.src = YOUTUBE_API_SRC;
    script.async = true;
    script.onerror = () => {
      youtubePromise = null;
      reject(new Error('Falha ao carregar o player do YouTube'));
    };
    document.head.appendChild(script);
  });

  return youtubePromise;
}

export function loadVimeoApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Ambiente sem navegador'));
  if (window.Vimeo && typeof window.Vimeo.Player === 'function') return Promise.resolve(window.Vimeo);
  if (vimeoPromise) return vimeoPromise;

  vimeoPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = VIMEO_API_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Vimeo && typeof window.Vimeo.Player === 'function') resolve(window.Vimeo);
      else {
        vimeoPromise = null;
        reject(new Error('Falha ao carregar o player do Vimeo'));
      }
    };
    script.onerror = () => {
      vimeoPromise = null;
      reject(new Error('Falha ao carregar o player do Vimeo'));
    };
    document.head.appendChild(script);
  });

  return vimeoPromise;
}

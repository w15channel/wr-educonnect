/**
 * getVideoSource(url)
 * ───────────────────
 * Auto-detects the video source/platform from any pasted URL and describes how
 * the WR player should drive it.
 *
 * Returns: {
 *   kind: 'file' | 'youtube' | 'vimeo' | 'iframe' | 'unsupported',
 *   src,          // direct media URL (kind === 'file')
 *   embedSrc,     // iframe URL (kind === 'youtube' | 'vimeo' | 'iframe')
 *   videoId,      // provider id (kind === 'youtube' | 'vimeo')
 *   provider,     // human readable origin, used in the "open externally" hint
 *   originalUrl,  // normalized original URL, always safe to open in a new tab
 * }
 *
 * `kind` distinguishes what the player can actually control:
 *  - 'file' / 'youtube' / 'vimeo' → full transport control (own UI)
 *  - 'iframe'                     → cross-origin embed, only fullscreen is ours
 */
export function getVideoSource(url) {
  const empty = { kind: 'unsupported', src: null, embedSrc: null, videoId: null, provider: '', originalUrl: '' };
  if (!url || typeof url !== 'string') return empty;

  let parsed;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return empty;
  }
  const host = parsed.hostname.replace('www.', '').toLowerCase();
  const path = parsed.pathname;
  const originalUrl = parsed.toString();
  const base = { src: null, embedSrc: null, videoId: null, originalUrl };

  // YouTube
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    let videoId = '';
    if (host === 'youtu.be') videoId = path.split('/').filter(Boolean)[0] || '';
    else if (path.startsWith('/watch')) videoId = parsed.searchParams.get('v') || '';
    else if (path.startsWith('/embed/')) videoId = path.split('/embed/')[1]?.split('/')[0] || '';
    else if (path.startsWith('/shorts/') || path.startsWith('/live/')) videoId = path.split('/')[2] || '';
    if (videoId) {
      return {
        ...base,
        kind: 'youtube',
        videoId,
        provider: 'YouTube',
        embedSrc: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      };
    }
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = path.split('/').find((p) => /^\d+$/.test(p));
    if (id) {
      return { ...base, kind: 'vimeo', videoId: id, provider: 'Vimeo', embedSrc: `https://player.vimeo.com/video/${id}` };
    }
  }

  // Google Drive (file share / preview / open links)
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    let fileId = '';
    const dMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) fileId = dMatch[1];
    else if (path.startsWith('/open')) fileId = parsed.searchParams.get('id') || '';
    else fileId = parsed.searchParams.get('id') || '';
    if (fileId) {
      return { ...base, kind: 'iframe', provider: 'Google Drive', embedSrc: `https://drive.google.com/file/d/${fileId}/preview` };
    }
  }

  // Instagram (reels/posts/tv)
  if (host === 'instagram.com') {
    const clean = path.replace(/\/$/, '');
    return { ...base, kind: 'iframe', provider: 'Instagram', embedSrc: `https://www.instagram.com${clean}/embed` };
  }

  // Facebook video
  if (host === 'facebook.com' || host === 'fb.watch') {
    return {
      ...base,
      kind: 'iframe',
      provider: 'Facebook',
      embedSrc: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalUrl)}&show_text=0`,
    };
  }

  // TikTok
  if (host === 'tiktok.com') {
    const idMatch = path.match(/\/video\/(\d+)/);
    if (idMatch) return { ...base, kind: 'iframe', provider: 'TikTok', embedSrc: `https://www.tiktok.com/embed/v2/${idMatch[1]}` };
  }

  // Direct video file (any host) — playable natively, full control
  if (/\.(mp4|webm|ogg|ogv|mov|m3u8)(\?.*)?$/i.test(path)) {
    return { ...base, kind: 'file', provider: host, src: originalUrl };
  }

  // Already an embed-style URL — trust it
  if (path.includes('/embed/') || path.includes('/preview')) {
    return { ...base, kind: 'iframe', provider: host, embedSrc: originalUrl };
  }

  return { ...base, kind: 'unsupported', provider: host };
}

/**
 * getVideoEmbed(url)
 * ──────────────────
 * Legacy shape kept for callers that only need "iframe vs native video vs
 * unsupported". Prefer `getVideoSource` when you need provider-level control.
 *
 * Returns: { type: 'iframe' | 'video' | 'unsupported', src }
 */
export function getVideoEmbed(url) {
  const source = getVideoSource(url);
  if (source.kind === 'file') return { type: 'video', src: source.src };
  if (source.kind === 'unsupported') return { type: 'unsupported', src: source.originalUrl || null };
  return { type: 'iframe', src: source.embedSrc };
}
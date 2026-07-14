/**
 * getVideoEmbed(url)
 * ──────────────────
 * Auto-detects the video source/platform from any pasted URL and returns
 * how to play it: an iframe embed, a native <video> file, or a fallback link.
 * Supports YouTube, Vimeo, Google Drive, Instagram, Facebook, TikTok,
 * direct video files (mp4/webm/ogg/mov/m3u8) and generic embeddable pages.
 *
 * Returns: { type: 'iframe' | 'video' | 'unsupported', src }
 */
export function getVideoEmbed(url) {
  if (!url || typeof url !== 'string') return { type: 'unsupported', src: null };

  let parsed;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return { type: 'unsupported', src: null };
  }
  const host = parsed.hostname.replace('www.', '').toLowerCase();
  const path = parsed.pathname;

  // YouTube
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    let videoId = '';
    if (host === 'youtu.be') videoId = path.split('/').filter(Boolean)[0] || '';
    else if (path.startsWith('/watch')) videoId = parsed.searchParams.get('v') || '';
    else if (path.startsWith('/embed/')) videoId = path.split('/embed/')[1]?.split('/')[0] || '';
    else if (path.startsWith('/shorts/') || path.startsWith('/live/')) videoId = path.split('/')[2] || '';
    if (videoId) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = path.split('/').find((p) => /^\d+$/.test(p));
    if (id) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` };
  }

  // Google Drive (file share / preview / open links)
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    let fileId = '';
    const dMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) fileId = dMatch[1];
    else if (path.startsWith('/open')) fileId = parsed.searchParams.get('id') || '';
    else fileId = parsed.searchParams.get('id') || '';
    if (fileId) return { type: 'iframe', src: `https://drive.google.com/file/d/${fileId}/preview` };
  }

  // Instagram (reels/posts/tv)
  if (host === 'instagram.com') {
    const clean = path.replace(/\/$/, '');
    return { type: 'iframe', src: `https://www.instagram.com${clean}/embed` };
  }

  // Facebook video
  if (host === 'facebook.com' || host === 'fb.watch') {
    return { type: 'iframe', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(parsed.toString())}&show_text=0` };
  }

  // TikTok
  if (host === 'tiktok.com') {
    const idMatch = path.match(/\/video\/(\d+)/);
    if (idMatch) return { type: 'iframe', src: `https://www.tiktok.com/embed/v2/${idMatch[1]}` };
  }

  // Direct video file (any host) — playable natively
  if (/\.(mp4|webm|ogg|ogv|mov|m3u8)(\?.*)?$/i.test(path)) {
    return { type: 'video', src: parsed.toString() };
  }

  // Already an embed-style URL — trust it
  if (path.includes('/embed/') || path.includes('/preview')) {
    return { type: 'iframe', src: parsed.toString() };
  }

  return { type: 'unsupported', src: parsed.toString() };
}
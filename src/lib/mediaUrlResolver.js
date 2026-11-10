/**
 * mediaUrlResolver.js
 * ───────────────────
 * Utilitário central para detectar, extrair e normalizar links de mídia
 * (áudio e vídeo) provenientes do Google Drive, Microsoft OneDrive, Dropbox,
 * YouTube e arquivos diretos.
 *
 * Resolve problemas comuns como:
 *  - URLs compartilhadas do Google Drive que entregam páginas HTML em vez de stream de áudio.
 *  - Bloqueio de CORS e ausência de headers Range para avançar/retroceder.
 *  - Links curtos do OneDrive (1drv.ms) e parâmetros de visualização.
 */

/**
 * Extrai o ID do arquivo do Google Drive a partir de qualquer padrão de URL comum.
 * @param {string} url
 * @returns {string|null} ID do arquivo ou null
 */
export function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // /file/d/ID/...
  const dMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];

  // /d/ID/...
  const shortDMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (shortDMatch) return shortDMatch[1];

  // id=ID ou ?id=ID
  const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Normaliza links do Microsoft OneDrive para download direto ou stream.
 * @param {string} url
 * @returns {string} URL transformada
 */
export function normalizeOneDriveUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const clean = url.trim();

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    // onedrive.live.com compartilhamento direto
    if (host.includes('onedrive.live.com') || host.includes('1drv.ms')) {
      // Se tiver resid e authkey, pode ser convertido para download
      if (parsed.searchParams.has('resid') && !parsed.searchParams.has('download')) {
        parsed.searchParams.set('download', '1');
        return parsed.toString();
      }
      // Se for link de embed ou view, manter ou adaptar
      if (parsed.pathname.includes('/redir')) {
        parsed.searchParams.set('download', '1');
        return parsed.toString();
      }
    }
  } catch {
    // Se falhar o parse da URL, retorna original
  }

  return clean;
}

/**
 * Normaliza links do Dropbox para download/stream direto.
 * @param {string} url
 * @returns {string}
 */
export function normalizeDropboxUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const clean = url.trim();
  if (clean.includes('dropbox.com')) {
    return clean.replace(/[?&]dl=0/, '?raw=1').replace(/[?&]dl=1/, '?raw=1');
  }
  return clean;
}

/**
 * Verifica se a URL é do Google NotebookLM.
 * @param {string} url
 * @returns {boolean}
 */
export function isNotebookLmUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.includes('notebooklm.google.com') || lower.includes('notebook.google.com');
}

/**
 * Identifica o provedor de mídia e o status do link.
 * @param {string} url
 * @returns {{
 *   provider: 'Google Drive' | 'OneDrive' | 'YouTube' | 'Vimeo' | 'Dropbox' | 'NotebookLM' | 'Direct' | 'Unknown',
 *   fileId: string | null,
 *   isCloudDrive: boolean,
 *   isNotebookLm: boolean,
 *   recommendedForAudio: boolean,
 *   recommendedForVideo: boolean,
 * }}
 */
export function detectMediaProvider(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      provider: 'Unknown',
      fileId: null,
      isCloudDrive: false,
      isNotebookLm: false,
      recommendedForAudio: false,
      recommendedForVideo: false,
    };
  }

  const clean = url.trim();
  const lower = clean.toLowerCase();

  // Google NotebookLM
  if (isNotebookLmUrl(clean)) {
    return {
      provider: 'NotebookLM',
      fileId: null,
      isCloudDrive: false,
      isNotebookLm: true,
      recommendedForAudio: false,
      recommendedForVideo: false,
    };
  }

  // Google Drive
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    const fileId = extractGoogleDriveId(clean);
    return {
      provider: 'Google Drive',
      fileId,
      isCloudDrive: true,
      recommendedForAudio: Boolean(fileId),
      recommendedForVideo: Boolean(fileId),
    };
  }

  // OneDrive
  if (lower.includes('onedrive.live.com') || lower.includes('1drv.ms') || lower.includes('sharepoint.com')) {
    return {
      provider: 'OneDrive',
      fileId: null,
      isCloudDrive: true,
      recommendedForAudio: true,
      recommendedForVideo: true,
    };
  }

  // YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      provider: 'YouTube',
      fileId: null,
      isCloudDrive: false,
      recommendedForAudio: false,
      recommendedForVideo: true,
    };
  }

  // Vimeo
  if (lower.includes('vimeo.com')) {
    return {
      provider: 'Vimeo',
      fileId: null,
      isCloudDrive: false,
      recommendedForAudio: false,
      recommendedForVideo: true,
    };
  }

  // Dropbox
  if (lower.includes('dropbox.com')) {
    return {
      provider: 'Dropbox',
      fileId: null,
      isCloudDrive: true,
      recommendedForAudio: true,
      recommendedForVideo: true,
    };
  }

  // Arquivo de mídia direto ou Data URI
  if (lower.startsWith('data:audio') || /\.(mp3|m4a|wav|aac|ogg|webm|flac)(\?.*)?$/i.test(lower)) {
    return {
      provider: 'Direct',
      fileId: null,
      isCloudDrive: false,
      recommendedForAudio: true,
      recommendedForVideo: false,
    };
  }

  if (/\.(mp4|webm|ogv|mov|m3u8)(\?.*)?$/i.test(lower)) {
    return {
      provider: 'Direct',
      fileId: null,
      isCloudDrive: false,
      recommendedForAudio: false,
      recommendedForVideo: true,
    };
  }

  return {
    provider: 'Unknown',
    fileId: null,
    isCloudDrive: false,
    recommendedForAudio: true,
    recommendedForVideo: true,
  };
}

/**
 * Gera uma URL pronta para streaming no elemento <audio>.
 * Para links do Google Drive ou OneDrive que bloqueiam CORS ou entregam páginas HTML,
 * utiliza o proxy de áudio da plataforma (/api/stream-audio).
 *
 * @param {string} url
 * @returns {string}
 */
export function resolveAudioStreamUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';

  // Data URLs ou blobs locais são tocados diretamente
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  const { provider, fileId } = detectMediaProvider(clean);

  // Google Drive: usa o proxy do servidor com fileId ou url
  if (provider === 'Google Drive' && fileId) {
    return `/api/stream-audio?driveId=${encodeURIComponent(fileId)}`;
  }

  // OneDrive ou Dropbox: se for cloud drive, passa pelo proxy para evitar CORS
  if (provider === 'OneDrive' || provider === 'Dropbox') {
    return `/api/stream-audio?url=${encodeURIComponent(clean)}`;
  }

  // URLs diretas já compatíveis
  return clean;
}

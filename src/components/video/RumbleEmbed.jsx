import { useEffect, useMemo, useState } from 'react';

const isRumbleEmbed = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.hostname === 'rumble.com' && parsed.pathname.startsWith('/embed/');
  } catch {
    return false;
  }
};

const extractEmbedFromOEmbed = (html = '') => {
  if (typeof DOMParser === 'undefined') return '';
  const document = new DOMParser().parseFromString(html, 'text/html');
  const src = document.querySelector('iframe')?.getAttribute('src') || '';
  return isRumbleEmbed(src) ? src : '';
};

/**
 * Incorpora o player oficial do Rumble sem executar HTML arbitrário no React.
 * URLs públicas são resolvidas pelo oEmbed oficial porque o identificador da
 * página nem sempre é igual ao identificador interno usado no iframe.
 */
export default function RumbleEmbed({ videoId, publisherId, src = '', url = '', title = 'Vídeo do Rumble' }) {
  const fallbackSrc = useMemo(() => {
    if (isRumbleEmbed(src)) return src;
    if (!videoId) return '';
    const query = publisherId ? `?pub=${encodeURIComponent(publisherId)}` : '';
    return `https://rumble.com/embed/${videoId}/${query}`;
  }, [publisherId, src, videoId]);
  const [embedSrc, setEmbedSrc] = useState(fallbackSrc);

  useEffect(() => {
    setEmbedSrc(fallbackSrc);
    if (!url || isRumbleEmbed(url)) return undefined;

    const controller = new AbortController();
    const endpoint = `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(url)}`;
    fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Rumble oEmbed indisponível');
        return response.json();
      })
      .then((data) => {
        const canonicalSrc = extractEmbedFromOEmbed(data?.html);
        if (canonicalSrc) setEmbedSrc(canonicalSrc);
      })
      .catch(() => {
        // Mantém o endereço inferido; o botão "Abrir original" segue disponível.
      });

    return () => controller.abort();
  }, [fallbackSrc, url]);

  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        src={embedSrc}
        title={title}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

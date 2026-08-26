import { useEffect, useId, useRef } from 'react';

const RUMBLE_EMBED_BASE_URL = 'https://rumble.com/embedJS/';
const DEFAULT_PUBLISHER_ID = 'u4qbnem';

function initializeRumble(publisherId) {
  if (window.Rumble) return;

  window._Rumble = 'Rumble';
  window.Rumble = function rumble(...args) {
    window.Rumble._ = window.Rumble._ || [];
    window.Rumble._.push(args);

    if (window.Rumble._.length !== 1) return;

    const [, options] = args;
    const script = document.createElement('script');
    const firstScript = document.getElementsByTagName('script')[0];
    const videoSuffix = options?.video ? `.${options.video}` : '';

    script.async = true;
    // Sem crossOrigin o navegador esconde qualquer falha do script do Rumble
    // atrás de um "Script error." genérico, que aparece como erro do app.
    script.crossOrigin = 'anonymous';
    // O snippet oficial serializa os argumentos da chamada diretamente como
    // ["play", { video, div }]. Um nível extra de array faz o embedJS receber
    // um comando inválido e deixa o contêiner vazio.
    script.src = `${RUMBLE_EMBED_BASE_URL}${publisherId}${videoSuffix}/?url=${encodeURIComponent(window.location.href)}&args=${encodeURIComponent(JSON.stringify(args))}`;

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  };
}

/**
 * Incorpora o player oficial do Rumble com o mesmo carregador usado no tutorial
 * da dashboard. O script oficial recebe o ID público e resolve internamente o
 * vídeo correto, sem depender de oEmbed (bloqueado por CORS em alguns browsers).
 */
export default function RumbleEmbed({ videoId, publisherId = DEFAULT_PUBLISHER_ID, title = 'Vídeo do Rumble' }) {
  const reactId = useId();
  const containerId = `rumble_${videoId}_${reactId.replace(/:/g, '')}`;
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!videoId || requestedRef.current) return;
    requestedRef.current = true;

    initializeRumble(publisherId);
    window.Rumble('play', {
      video: videoId,
      div: containerId,
    });
  }, [containerId, publisherId, videoId]);

  return (
    <div className="aspect-video w-full bg-black">
      <div
        id={containerId}
        className="h-full w-full"
        role="region"
        aria-label={title}
      />
    </div>
  );
}
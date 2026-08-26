import { useEffect, useId, useRef, useState } from 'react';
import { Minimize2, RotateCw } from 'lucide-react';

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
export default function RumbleEmbed({ videoId, publisherId = DEFAULT_PUBLISHER_ID, title = 'Vídeo do Rumble', showFullscreenButton = true }) {
  const reactId = useId();
  const containerId = `rumble_${videoId}_${reactId.replace(/:/g, '')}`;
  const requestedRef = useRef(false);
  const frameRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!videoId || requestedRef.current) return;
    requestedRef.current = true;

    initializeRumble(publisherId);
    window.Rumble('play', {
      video: videoId,
      div: containerId,
    });
  }, [containerId, publisherId, videoId]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frameRef.current || document.webkitFullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (fullscreen) {
      await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
      return;
    }
    const frame = frameRef.current;
    await (frame?.requestFullscreen?.() || frame?.webkitRequestFullscreen?.());
    try { await screen.orientation?.lock?.('landscape'); } catch (_) { /* Bloqueado em alguns navegadores; a tela cheia continua ativa. */ }
  };

  return (
    <div ref={frameRef} className="rumble-fullscreen-frame group relative aspect-video w-full bg-black">
      <div
        id={containerId}
        className="h-full w-full"
        role="region"
        aria-label={title}
      />
      {showFullscreenButton && <button type="button" onClick={toggleFullscreen} className="absolute bottom-3 right-3 z-10 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-black/75 px-3 text-xs font-bold text-white shadow-lg transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-white" title={fullscreen ? 'Sair da tela cheia' : 'Girar tela (tela cheia)'} aria-label={fullscreen ? 'Sair da tela cheia' : 'Girar tela e abrir em tela cheia'}>
        {fullscreen ? <Minimize2 size={16}/> : <RotateCw size={16}/>}<span>{fullscreen ? 'Sair' : 'Girar tela'}</span>
      </button>}
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { Minimize2, RotateCw } from 'lucide-react';

/**
 * Incorpora o vídeo do Rumble pelo iframe público. O carregador JS oficial
 * injeta o player de forma assíncrona e quebrava ao tentar escrever num
 * contêiner já desmontado pelo React ("appendChild of null"); o iframe é
 * estável e não depende de estado global.
 */
export default function RumbleEmbed({ videoId, title = 'Vídeo do Rumble', showFullscreenButton = true }) {
  const frameRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

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

  if (!videoId) return null;

  return (
    <div ref={frameRef} className="rumble-fullscreen-frame group relative aspect-video w-full bg-black">
      <iframe
        src={`https://rumble.com/embed/${videoId}/?pub=4`}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
      {showFullscreenButton && <button type="button" onClick={toggleFullscreen} className="absolute bottom-3 right-3 z-10 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-black/75 px-3 text-xs font-bold text-white shadow-lg transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-white" title={fullscreen ? 'Sair da tela cheia' : 'Girar tela (tela cheia)'} aria-label={fullscreen ? 'Sair da tela cheia' : 'Girar tela e abrir em tela cheia'}>
        {fullscreen ? <Minimize2 size={16}/> : <RotateCw size={16}/>}<span>{fullscreen ? 'Sair' : 'Girar tela'}</span>
      </button>}
    </div>
  );
}
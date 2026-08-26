import { useEffect, useRef, useState } from 'react';
import { Minimize2, RotateCw, ExternalLink, WifiOff } from 'lucide-react';

/**
 * Incorpora o vídeo do Rumble pelo iframe público. O carregador JS oficial
 * injeta o player de forma assíncrona e quebrava ao tentar escrever num
 * contêiner já desmontado pelo React ("appendChild of null"); o iframe é
 * estável e não depende de estado global.
 *
 * Em algumas redes móveis o domínio do Rumble não é resolvido pelo DNS da
 * operadora ("não foi possível encontrar o endereço IP do servidor"). Nesses
 * casos o iframe nunca dispara o evento de carregamento: após alguns segundos
 * exibimos um aviso com o link direto, em vez da página de erro do navegador.
 */
export default function RumbleEmbed({ videoId, publisherId = 'u4qbnem', title = 'Vídeo do Rumble', showFullscreenButton = true }) {
  const frameRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frameRef.current || document.webkitFullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
    setBlocked(false);
    const timer = setTimeout(() => setBlocked(prev => (loadedRef.current ? prev : true)), 7000);
    return () => clearTimeout(timer);
  }, [videoId]);

  // Referência espelhada para o timeout ler o estado mais recente.
  useEffect(() => { loadedRef.current = loaded; }, [loaded]);

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

  const watchUrl = `https://rumble.com/embed/${videoId}/?pub=${publisherId}`;

  if (blocked && !loaded) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black px-5 text-center">
        <WifiOff size={24} className="text-white/60" />
        <p className="text-sm font-bold text-white">Seu provedor de internet está bloqueando o vídeo</p>
        <p className="max-w-sm text-xs text-white/60">
          A rede que você está usando não consegue acessar o servidor do vídeo (erro de DNS). Tente pelo Wi-Fi,
          alterne para os dados móveis ou abra o vídeo direto no navegador pelo botão abaixo.
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 text-xs font-bold text-white"
        >
          <ExternalLink size={14} /> Abrir vídeo em nova aba
        </a>
      </div>
    );
  }

  return (
    <div ref={frameRef} className="rumble-fullscreen-frame group relative aspect-video w-full bg-black">
      <iframe
        src={watchUrl}
        title={title}
        onLoad={() => { setLoaded(true); setBlocked(false); }}
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
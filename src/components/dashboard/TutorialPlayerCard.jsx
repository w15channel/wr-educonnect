import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, PlayCircle, RotateCw } from 'lucide-react';
import RumbleEmbed from '@/components/video/RumbleEmbed';

/**
 * Cartão do tutorial da dashboard. O controle "Girar tela" fica no campo de
 * texto abaixo do vídeo — nunca sobreposto ao player.
 */
export default function TutorialPlayerCard() {
  const frameRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(
      document.fullscreenElement === frameRef.current || document.webkitFullscreenElement === frameRef.current
    );
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
    try { await screen.orientation?.lock?.('landscape'); } catch (_) { /* alguns navegadores bloqueiam o giro */ }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
          <PlayCircle size={16} className="text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Tutorial da Plataforma</h3>
          <p className="text-xs text-muted-foreground">Assista quando quiser para aprender a usar o site</p>
        </div>
      </div>
      <div ref={frameRef} className="rumble-fullscreen-frame rounded-xl overflow-hidden border border-border bg-black">
        <RumbleEmbed videoId="v7cfewe" publisherId="u4qbnem" title="Tutorial da Plataforma" showFullscreenButton={false} />
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Este vídeo é o tutorial de como usar o site adequadamente. Você pode assisti-lo sempre que precisar — tudo o que você precisa para começar a usar a plataforma está nele.
        </p>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-xs font-bold text-foreground transition-colors hover:bg-secondary/70"
        >
          {fullscreen ? <Minimize2 size={14} /> : <RotateCw size={14} />}
          {fullscreen ? 'Sair da tela cheia' : 'Girar tela (tela cheia)'}
        </button>
      </div>
    </div>
  );
}
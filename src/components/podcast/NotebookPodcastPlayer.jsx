import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Headphones,
  Radio,
  CheckCircle2,
  Loader2,
  Sliders,
} from 'lucide-react';

function extractDriveFileId(url = '') {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const byPath = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (byParam?.[1]) return byParam[1];
  return null;
}

function parseMediaSource(notebookUrl = '', audioUrl = '') {
  const primaryAudio = String(audioUrl || '').trim();
  const rawUrl = String(notebookUrl || '').trim();
  const driveId = extractDriveFileId(primaryAudio) || extractDriveFileId(rawUrl);

  if (driveId) {
    return {
      kind: 'drive',
      driveId,
      // Endpoint direto do Google Drive com Access-Control-Allow-Origin: * e suporte a Range 206
      streamUrl: `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }

  const candidate = primaryAudio || rawUrl;
  return {
    kind: 'audio',
    driveId: null,
    streamUrl: candidate || null,
    embedUrl: null,
  };
}

function formatSeconds(sec = 0) {
  if (!Number.isFinite(sec) || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WAVE_BARS = [
  28, 52, 74, 42, 88, 64, 34, 92, 58, 40, 78, 96, 50, 36, 70, 84,
  46, 62, 90, 54, 32, 76, 68, 44, 82, 60, 38, 72, 56, 34,
];

export default function NotebookPodcastPlayer({
  podcast,
  isCompleted = false,
  onMarkCompleted,
  savingCompletion = false,
}) {
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [blobAudioSrc, setBlobAudioSrc] = useState(null);
  const [useDirectDriveDeck, setUseDirectDriveDeck] = useState(false);
  const [tick, setTick] = useState(0);

  const source = useMemo(
    () => parseMediaSource(podcast?.notebook_url, podcast?.audio_url),
    [podcast?.notebook_url, podcast?.audio_url]
  );

  // Limpa estado e blob ao trocar de episódio
  useEffect(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setUseDirectDriveDeck(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobAudioSrc(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [podcast?.id, source.streamUrl]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Animação suave das barras enquanto está reproduzindo
  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 220);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Fallback via fetch CORS -> Blob URL caso o navegador bloqueie o streaming direto no elemento <audio>
  const loadDriveAudioAsBlob = async () => {
    if (!source.streamUrl || blobUrlRef.current) return blobUrlRef.current;
    setIsBuffering(true);
    try {
      const response = await fetch(source.streamUrl, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error('Falha ao carregar stream do Drive');
      const rawBlob = await response.blob();
      const audioBlob = new Blob([rawBlob], { type: 'audio/mp4' });
      const objectUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = objectUrl;
      setBlobAudioSrc(objectUrl);
      return objectUrl;
    } catch {
      // Se o arquivo no Drive exigir cookie da conta Google, libera a barra inferior do player encoberto do Drive
      setUseDirectDriveDeck(true);
      return null;
    } finally {
      setIsBuffering(false);
    }
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setIsBuffering(true);
    try {
      await audio.play();
      setIsPlaying(true);
      setIsBuffering(false);
    } catch {
      const blobUrl = await loadDriveAudioAsBlob();
      if (blobUrl && audioRef.current) {
        audioRef.current.src = blobUrl;
        audioRef.current.playbackRate = speed;
        audioRef.current.muted = muted;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setUseDirectDriveDeck(true))
          .finally(() => setIsBuffering(false));
      } else {
        setIsBuffering(false);
      }
    }
  };

  const handleSkip = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    const maxDur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration || 3600;
    const next = Math.max(0, Math.min(maxDur, (audio.currentTime || 0) + delta));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const handleScrub = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  if (!podcast) return null;

  const activeAudioSrc = blobAudioSrc || source.streamUrl || '';
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : isPlaying ? 35 : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/35 bg-gradient-to-br from-[#0b1022] via-[#121936] to-[#1d143b] text-white shadow-2xl select-none">
      {/* Player do Google Drive posicionado por baixo e 100% encoberto pelo player simulado */}
      {source.embedUrl && (
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl"
          aria-hidden={!useDirectDriveDeck}
        >
          <iframe
            src={source.embedUrl}
            title={podcast.title}
            allow="autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="w-full h-full border-0 opacity-0 pointer-events-none"
          />
        </div>
      )}

      {/* Elemento de áudio conectado diretamente ao stream CORS do Google Drive */}
      {activeAudioSrc && (
        <audio
          ref={audioRef}
          crossOrigin="anonymous"
          src={activeAudioSrc}
          preload="metadata"
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            setDuration(audioRef.current?.duration || 0);
            setIsBuffering(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (!isCompleted && onMarkCompleted) onMarkCompleted(podcast);
          }}
          onError={() => {
            if (!blobUrlRef.current) {
              loadDriveAudioAsBlob();
            } else {
              setUseDirectDriveDeck(true);
            }
          }}
        />
      )}

      {/* Camada Superior: Player Simulado WR Studio cobrindo integralmente o player do Drive */}
      <div className="relative z-10 p-5 sm:p-6 bg-gradient-to-br from-[#0b1022]/98 via-[#121936]/98 to-[#1d143b]/98 backdrop-blur-md">
        {/* Halos decorativos */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

        {/* Cabeçalho do Player Simulado */}
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-200 border border-white/10">
                  <Radio size={10} className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-indigo-300'} />
                  WR Podcast Studio
                </span>
                {podcast.module_number && (
                  <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                    Módulo {podcast.module_number}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                {podcast.hosts || 'Google NotebookLM · Deep Dive Audio'}
              </p>
            </div>
          </div>

          {source.embedUrl && (
            <button
              type="button"
              onClick={() => setUseDirectDriveDeck((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-indigo-200/80 hover:bg-white/10 transition-colors"
              title="Alternar deck auxiliar"
            >
              <Sliders size={11} />
              {useDirectDriveDeck ? 'Player Padrão' : 'Deck Auxiliar'}
            </button>
          )}
        </div>

        {/* Título e resumo do episódio */}
        <div className="relative mt-4">
          <h3 className="text-base sm:text-xl font-black tracking-tight text-white leading-snug">
            {podcast.title}
          </h3>
          {podcast.description && (
            <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/80 leading-relaxed line-clamp-3">
              {podcast.description}
            </p>
          )}
        </div>

        {/* Visualizador de Ondas Sonoras + Scrubber Sincronizado com o Áudio do Drive */}
        <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] text-indigo-200/80 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isBuffering
                    ? 'bg-amber-400 animate-ping'
                    : isPlaying
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-indigo-400'
                }`}
              />
              {isBuffering
                ? 'Carregando áudio...'
                : isPlaying
                ? 'Reproduzindo episódio...'
                : 'Pronto para ouvir'}
            </span>
            <span className="font-mono font-bold text-xs">
              {formatSeconds(currentTime)} /{' '}
              {duration > 0 ? formatSeconds(duration) : podcast.duration || '--:--'}
            </span>
          </div>

          {/* Barras de Onda Sonora clicáveis para buscar posição no áudio */}
          <div
            onClick={(e) => {
              if (!duration || !audioRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const nextTime = ratio * duration;
              audioRef.current.currentTime = nextTime;
              setCurrentTime(nextTime);
            }}
            className="flex h-14 items-center justify-between gap-1 px-1 cursor-pointer"
            title="Clique para avançar ou retroceder no áudio"
          >
            {WAVE_BARS.map((height, idx) => {
              const barPct = (idx / WAVE_BARS.length) * 100;
              const passed = barPct <= progressPct;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-200 ${
                    passed
                      ? 'bg-gradient-to-t from-indigo-400 via-fuchsia-400 to-emerald-300'
                      : 'bg-white/15'
                  }`}
                  style={{
                    height: isPlaying
                      ? `${Math.max(18, ((height + ((tick * 11 + idx * 7) % 38)) % 96))}%`
                      : `${Math.max(16, Math.round(height * 0.45))}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Barra deslizante de tempo */}
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.5}
            value={duration > 0 ? currentTime : 0}
            onChange={handleScrub}
            disabled={!duration}
            className="mt-3 h-1.5 w-full cursor-pointer accent-emerald-400 disabled:opacity-50"
          />
        </div>

        {/* Deck Auxiliar Encoberto: se ativado, expõe apenas a faixa inferior de controle do player do Drive mantendo o cabeçalho/pop-out 100% cobertos */}
        {useDirectDriveDeck && source.embedUrl && (
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-indigo-400/30 bg-[#0d1226] h-14">
            {/* Iframe posicionado de modo que apenas a barra inferior de play/progresso fique visível e clicável, enquanto o topo e o botão de abrir janela ficam 100% fora e bloqueados */}
            <iframe
              src={source.embedUrl}
              title={`Player ${podcast.title}`}
              allow="autoplay; encrypted-media"
              className="w-full h-56 -mt-[168px] border-0"
            />
            {/* Máscara bloqueando o canto superior/direito contra cliques externos */}
            <div className="pointer-events-auto absolute top-0 right-0 h-3 w-16 bg-transparent" />
          </div>
        )}

        {/* Controles Principais do Player Simulado */}
        <div className="relative mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSkip(-15)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              title="Voltar 15 segundos"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={isBuffering}
              className="flex h-12 px-5 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-indigo-500/40 hover:opacity-95 transition-all disabled:opacity-70"
            >
              {isBuffering ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="fill-white" />
              )}
              <span>
                {isBuffering ? 'Carregando...' : isPlaying ? 'Pausar' : 'Reproduzir'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSkip(15)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              title="Avançar 15 segundos"
            >
              <RotateCw size={16} />
            </button>

            <button
              type="button"
              onClick={handleSpeedChange}
              className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black text-indigo-200 hover:bg-white/15 transition-colors"
              title="Velocidade de reprodução"
            >
              {speed}x
            </button>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 h-10">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-white/80 hover:text-white transition-colors"
                title={muted ? 'Ativar som' : 'Silenciar'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:block w-16 h-1 cursor-pointer accent-indigo-400"
                title="Volume"
              />
            </div>
          </div>

          {/* Botão de Autocorreção / Concluir episódio */}
          {onMarkCompleted && (
            <button
              type="button"
              disabled={isCompleted || savingCompletion}
              onClick={() => onMarkCompleted(podcast)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition-all ${
                isCompleted
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 cursor-default'
                  : 'bg-emerald-500 text-slate-950 shadow-lg hover:bg-emerald-400'
              }`}
            >
              <CheckCircle2 size={15} />
              {savingCompletion
                ? 'Validando...'
                : isCompleted
                ? 'Episódio Concluído (+2 pts)'
                : 'Marcar Episódio Concluído (+2 pts)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
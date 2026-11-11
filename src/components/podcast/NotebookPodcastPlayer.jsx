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
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import useLunaVoice from '@/hooks/useLunaVoice';

function parseMediaSource(notebookUrl = '', audioUrl = '') {
  const primaryAudio = String(audioUrl || '').trim();
  const rawUrl = String(notebookUrl || '').trim();
  const candidate = primaryAudio || rawUrl;

  // Google Drive file link -> direct stream & preview embed
  const driveMatch = candidate.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || candidate.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && (candidate.includes('drive.google.com') || candidate.includes('docs.google.com'))) {
    const fileId = driveMatch[1];
    return {
      kind: 'drive',
      streamUrl: `https://docs.google.com/uc?export=download&id=${fileId}`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      externalUrl: rawUrl || primaryAudio,
    };
  }

  // Direct audio file (.mp3, .wav, .ogg, .m4a, .aac, .webm or explicit audio_url)
  if (
    primaryAudio ||
    /\.(mp3|wav|ogg|m4a|aac|webm|flac)(\?.*)?$/i.test(rawUrl)
  ) {
    return {
      kind: 'audio',
      streamUrl: primaryAudio || rawUrl,
      embedUrl: null,
      externalUrl: rawUrl || primaryAudio,
    };
  }

  // YouTube link
  const ytMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      kind: 'embed',
      streamUrl: null,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      externalUrl: rawUrl,
    };
  }

  // Google NotebookLM link (notebooklm.google.com)
  return {
    kind: 'notebooklm',
    streamUrl: null,
    embedUrl: rawUrl,
    externalUrl: rawUrl,
  };
}

function formatSeconds(sec = 0) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
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
  const voice = useLunaVoice();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showEmbedFrame, setShowEmbedFrame] = useState(false);
  const [studioTimerSec, setStudioTimerSec] = useState(0);
  const [studioSessionActive, setStudioSessionActive] = useState(false);
  const [audioFallbackMode, setAudioFallbackMode] = useState(false);

  const source = useMemo(
    () => parseMediaSource(podcast?.notebook_url, podcast?.audio_url),
    [podcast?.notebook_url, podcast?.audio_url]
  );

  // Reset state when switching episode
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setStudioTimerSec(0);
    setStudioSessionActive(false);
    setAudioFallbackMode(false);
    voice.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcast?.id]);

  // Cronômetro de escuta ativa quando sintonizado no NotebookLM
  useEffect(() => {
    if (!studioSessionActive && !isPlaying) return undefined;
    const interval = setInterval(() => {
      setStudioTimerSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [studioSessionActive, isPlaying]);

  const handleTogglePlay = () => {
    // Se tem stream de áudio direto e não falhou
    if (source.streamUrl && !audioFallbackMode && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setAudioFallbackMode(true);
            handleNotebookPlayFallback();
          });
      }
      return;
    }

    handleNotebookPlayFallback();
  };

  const handleNotebookPlayFallback = () => {
    if (isPlaying || studioSessionActive) {
      setIsPlaying(false);
      setStudioSessionActive(false);
      voice.stop();
      return;
    }
    setIsPlaying(true);
    setStudioSessionActive(true);
    if (podcast?.description) {
      voice.speak(`${podcast.title}. ${podcast.description}`, { force: true });
    }
  };

  const handleOpenNotebookStream = () => {
    if (!source.externalUrl) return;
    setStudioSessionActive(true);
    setIsPlaying(true);
    window.open(source.externalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSkip = (delta) => {
    if (audioRef.current && source.streamUrl && !audioFallbackMode) {
      const next = Math.max(0, Math.min(duration || 0, audioRef.current.currentTime + delta));
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    } else {
      setStudioTimerSec((prev) => Math.max(0, prev + delta));
    }
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

  const handleScrub = (e) => {
    const val = Number(e.target.value);
    if (audioRef.current && source.streamUrl && !audioFallbackMode && duration > 0) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  if (!podcast) return null;

  const activeWave = isPlaying || studioSessionActive || voice.speaking;
  const displayCurrent = source.streamUrl && !audioFallbackMode ? currentTime : studioTimerSec;
  const displayTotal = source.streamUrl && !audioFallbackMode && duration > 0 ? duration : 0;
  const progressPct = displayTotal > 0 ? Math.min(100, (displayCurrent / displayTotal) * 100) : activeWave ? 45 : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-[#0b1022] via-[#121936] to-[#1d143b] p-5 sm:p-6 text-white shadow-2xl">
      {/* Halo decorativo */}
      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

      {source.streamUrl && (
        <audio
          ref={audioRef}
          src={source.streamUrl}
          preload="metadata"
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            setIsPlaying(false);
            if (!isCompleted && onMarkCompleted) onMarkCompleted(podcast);
          }}
          onError={() => setAudioFallbackMode(true)}
        />
      )}

      {/* Topo do Player Exclusivo */}
      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
            <Headphones size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-200 border border-white/10">
                <Radio size={10} className={activeWave ? 'text-emerald-400 animate-pulse' : 'text-indigo-300'} />
                WR Studio · Google NotebookLM Player
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowEmbedFrame((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/90 hover:bg-white/15 transition-colors"
            title="Alternar visualizador NotebookLM"
          >
            {showEmbedFrame ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {showEmbedFrame ? 'Ocultar Painel' : 'Painel Notebook'}
          </button>

          {source.externalUrl && (
            <button
              type="button"
              onClick={handleOpenNotebookStream}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-black text-slate-950 shadow-md hover:opacity-95 transition-opacity"
            >
              <Sparkles size={12} />
              Ouvir no NotebookLM
              <ExternalLink size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Título e resumo do episódio */}
      <div className="relative mt-4">
        <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
          {podcast.title}
        </h3>
        {podcast.description && (
          <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/80 leading-relaxed line-clamp-3">
            {podcast.description}
          </p>
        )}
      </div>

      {/* Visualizador de Ondas Sonoras Dual-Host (Exclusivo NotebookLM) */}
      <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] text-indigo-200/75 mb-2">
          <span className="font-semibold flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${activeWave ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
            {activeWave ? 'Reproduzindo síntese clínica...' : 'Pronto para reprodução'}
          </span>
          <span className="font-mono font-bold">
            {formatSeconds(displayCurrent)}
            {displayTotal > 0 ? ` / ${formatSeconds(displayTotal)}` : podcast.duration ? ` · ${podcast.duration}` : ''}
          </span>
        </div>

        {/* Barras de onda */}
        <div className="flex h-14 items-center justify-between gap-1 px-1">
          {WAVE_BARS.map((height, idx) => {
            const barPct = (idx / WAVE_BARS.length) * 100;
            const passed = barPct <= progressPct;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  passed
                    ? 'bg-gradient-to-t from-indigo-400 via-fuchsia-400 to-emerald-300'
                    : 'bg-white/15'
                }`}
                style={{
                  height: activeWave
                    ? `${Math.max(18, ((height + ((studioTimerSec * 13 + idx * 7) % 35)) % 95))}%`
                    : `${Math.max(16, Math.round(height * 0.45))}%`,
                }}
              />
            );
          })}
        </div>

        {/* Barra deslizante quando há stream nativo */}
        {source.streamUrl && !audioFallbackMode && duration > 0 && (
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleScrub}
            className="mt-2 h-1.5 w-full cursor-pointer accent-emerald-400"
          />
        )}
      </div>

      {/* Painel Embed ou Conector Direto Google NotebookLM */}
      {showEmbedFrame && source.externalUrl && (
        <div className="relative mt-4 rounded-2xl border border-white/15 bg-black/40 p-3 space-y-2.5">
          {source.kind === 'drive' || source.kind === 'embed' ? (
            <iframe
              src={source.embedUrl}
              title={podcast.title}
              className="w-full h-48 sm:h-60 rounded-xl border border-white/10 bg-black"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={13} /> Caderno & Áudio Oficial no Google NotebookLM
                </p>
                <p className="text-[11px] text-indigo-100/75 break-all line-clamp-1">
                  {source.externalUrl}
                </p>
                <p className="text-[11px] text-indigo-200/60">
                  O Google NotebookLM abre o player interativo de duas vozes em janela segura sincronizada com seu estudo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNotebookStream}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 transition-colors"
              >
                Abrir Player NotebookLM <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Controles Principais do Player */}
      <div className="relative mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSkip(-15)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
            title="Voltar 15 segundos"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex h-12 px-5 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-indigo-500/40 hover:opacity-95 transition-all"
          >
            {activeWave ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
            <span>{activeWave ? 'Pausar' : 'Reproduzir'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSkip(15)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
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

          <button
            type="button"
            onClick={handleToggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 transition-colors"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
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
  );
}
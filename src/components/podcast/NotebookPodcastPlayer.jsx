import React, { useState, useEffect, useMemo } from 'react';
import { Headphones, Radio, CheckCircle2 } from 'lucide-react';

function extractDriveFileId(url = '') {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const byPath = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byParam?.[1] || null;
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
  const [tick, setTick] = useState(0);

  const driveId = useMemo(
    () => extractDriveFileId(podcast?.audio_url) || extractDriveFileId(podcast?.notebook_url),
    [podcast?.audio_url, podcast?.notebook_url]
  );
  const directAudio = !driveId ? podcast?.audio_url || podcast?.notebook_url : null;

  // Animação contínua das barras (decorativa)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 260);
    return () => clearInterval(interval);
  }, []);

  if (!podcast) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/35 bg-gradient-to-br from-[#0b1022] via-[#121936] to-[#1d143b] text-white shadow-2xl">
      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
            <Headphones size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-200 border border-white/10">
                <Radio size={10} className="text-emerald-400 animate-pulse" />
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

        <h3 className="mt-4 text-base sm:text-xl font-black tracking-tight leading-snug">{podcast.title}</h3>
        {podcast.description && (
          <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/80 leading-relaxed line-clamp-3">
            {podcast.description}
          </p>
        )}

        {/* Animação das ondas sonoras */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="flex h-14 items-center justify-between gap-1 px-1">
            {WAVE_BARS.map((height, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-full bg-gradient-to-t from-indigo-400 via-fuchsia-400 to-emerald-300 transition-all duration-200"
                style={{ height: `${Math.max(18, (height + ((tick * 11 + idx * 7) % 38)) % 96)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Recorte: apenas a barra de controles nativa do Google Drive */}
        {driveId && (
          <div className="mt-3 h-[60px] overflow-hidden rounded-2xl border border-indigo-400/30 bg-[#0d1226]">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              title={podcast.title}
              allow="autoplay; encrypted-media"
              className="block w-full h-[240px] -mt-[180px] border-0"
            />
          </div>
        )}

        {directAudio && (
          <audio controls preload="metadata" src={directAudio} className="mt-3 w-full" />
        )}

        {onMarkCompleted && (
          <button
            type="button"
            disabled={isCompleted || savingCompletion}
            onClick={() => onMarkCompleted(podcast)}
            className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition-all ${
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
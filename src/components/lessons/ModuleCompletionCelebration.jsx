import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Module names aligned with Apostila themes
export const MODULE_THEMES = [
  { id: 1, label: 'Fundamentos da Terapia Comportamental', emoji: '🧠', color: 'from-violet-500 to-purple-700', light: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 2, label: 'O Terapeuta em Ação', emoji: '🎯', color: 'from-blue-500 to-indigo-700', light: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 3, label: 'Demandas Clínicas Contemporâneas', emoji: '🌿', color: 'from-emerald-500 to-teal-700', light: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 4, label: 'Sexualidade e Clínica', emoji: '💛', color: 'from-yellow-500 to-amber-700', light: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 5, label: 'Psicossomática e Corpo', emoji: '🫀', color: 'from-rose-500 to-red-700', light: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 6, label: 'Família, Infância e Desenvolvimento', emoji: '👨‍👩‍👧', color: 'from-orange-500 to-amber-600', light: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 7, label: 'Sofrimento e Sentido de Vida', emoji: '✨', color: 'from-cyan-500 to-sky-700', light: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 8, label: 'Prática Clínica Avançada', emoji: '⚡', color: 'from-fuchsia-500 to-pink-700', light: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  { id: 9, label: 'TCC e Abordagens Integrativas', emoji: '🔬', color: 'from-lime-500 to-green-700', light: 'text-lime-400', bg: 'bg-lime-500/10' },
  { id: 10, label: 'Identidade e Formação Profissional', emoji: '🎓', color: 'from-amber-500 to-yellow-700', light: 'text-amber-400', bg: 'bg-amber-500/10' },
];

// Play a little trumpet / celebration sound via Web Audio API
export function playCelebrationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.38);
      osc.start(ctx.currentTime + i * 0.13);
      osc.stop(ctx.currentTime + i * 0.13 + 0.4);
    });
  } catch (_) {}
}

export function fireCelebrationConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function ModuleCompletionCelebration({ module: mod, onClose, session }) {
  const theme = MODULE_THEMES[(mod?.index ?? 0) % MODULE_THEMES.length];
  const [shareState, setShareState] = useState('idle');

  useEffect(() => {
    playCelebrationSound();
    fireCelebrationConfetti();
    const t = setTimeout(() => {
      fireCelebrationConfetti();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const share = async () => {
    if (!session?.email || !session?.code || shareState === 'sharing' || shareState === 'shared') return;
    setShareState('sharing');
    try {
      await base44.functions.invoke('manageOvercomingWall', {
        action: 'publish', actor_email: session.email, access_code: session.code, course: session.course || 'tcc',
        kind: 'module', title: theme.label, message: `concluiu o módulo “${theme.label}”.`, source_id: `module:${mod?.index ?? theme.id}`,
      });
      setShareState('shared');
    } catch (_) { setShareState('error'); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient bg */}
        <div className={`bg-gradient-to-br ${theme.color} p-8 text-center`}>
          <div className="text-7xl mb-4">{theme.emoji}</div>
          <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Módulo {mod?.index + 1} Concluído!</div>
          <h2 className="text-white text-xl font-black leading-tight mb-2">{theme.label}</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Parabéns! Você completou todas as 5 aulas deste módulo. Continue assim! 🚀
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-white shadow-lg" />
            ))}
          </div>

          <button
            type="button"
            onClick={share}
            disabled={shareState === 'sharing' || shareState === 'shared'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/20 py-3 text-sm font-bold text-white transition-all hover:bg-white/30 disabled:opacity-80"
          >
            {shareState === 'shared' ? <Check size={17}/> : <Share2 size={17}/>} {shareState === 'sharing' ? 'Publicando...' : shareState === 'shared' ? 'Publicado no mural!' : shareState === 'error' ? 'Tentar novamente' : 'Compartilhar no mural'}
          </button>

          <button
            onClick={onClose}
            className="mt-3 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-2xl transition-all text-sm"
          >
            Continuar aprendendo ✨
          </button>
        </div>
      </div>
    </div>
  );
}

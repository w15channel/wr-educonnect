import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// Module names aligned with Apostila themes
export const MODULE_THEMES = [
  { id: 1, label: 'Fundamentos da Terapia Comportamental', emoji: '🧠', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 2, label: 'O Terapeuta em Ação', emoji: '🎯', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 3, label: 'Demandas Clínicas Contemporâneas', emoji: '🌿', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 4, label: 'Sexualidade e Clínica', emoji: '💛', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 5, label: 'Psicossomática e Corpo', emoji: '🫀', color: 'from-accent to-destructive', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 6, label: 'Família, Infância e Desenvolvimento', emoji: '👨‍👩‍👧', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 7, label: 'Sofrimento e Sentido de Vida', emoji: '✨', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 8, label: 'Prática Clínica Avançada', emoji: '⚡', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 9, label: 'TCC e Abordagens Integrativas', emoji: '🔬', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
  { id: 10, label: 'Identidade e Formação Profissional', emoji: '🎓', color: 'from-accent to-primary', light: 'text-primary', bg: 'bg-accent/10' },
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

export default function ModuleCompletionCelebration({ module: mod, onClose }) {
  const theme = MODULE_THEMES[(mod?.index ?? 0) % MODULE_THEMES.length];

  useEffect(() => {
    playCelebrationSound();
    fireCelebrationConfetti();
    const t = setTimeout(() => {
      fireCelebrationConfetti();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient bg */}
        <div className={`bg-gradient-to-br ${theme.color} p-8 text-center`}>
          <div className="text-7xl mb-4">{theme.emoji}</div>
          <div className="text-primary-foreground/80 text-xs font-bold uppercase tracking-widest mb-1">Módulo {mod?.index + 1} Concluído!</div>
          <h2 className="text-primary-foreground text-xl font-black leading-tight mb-2">{theme.label}</h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Parabéns! Você completou todas as 5 aulas deste módulo. Continue assim! 🚀
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-card shadow-lg" />
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-card/20 hover:bg-card/30 border border-border/30 text-primary-foreground font-bold py-3 rounded-2xl transition-all text-sm"
          >
            Continuar aprendendo ✨
          </button>
        </div>
      </div>
    </div>
  );
}
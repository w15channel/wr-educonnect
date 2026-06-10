/**
 * ParticipationCelebration
 * ─────────────────────────
 * Shown briefly after posting/replying in Forum or SalaDebates.
 * Auto-dismisses after 3s. Plays a cheer sound + confetti burst.
 */
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

function playCheer() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Quick ascending fanfare
    const notes = [440, 554, 659, 880, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.28, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.32);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.34);
    });
  } catch (_) {}
}

function burst() {
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, startVelocity: 40, scalar: 0.9 });
}

export default function ParticipationCelebration({ message = 'Parabéns! Você participou! 🎉', onClose }) {
  useEffect(() => {
    playCheer();
    burst();
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-up"
        style={{ maxWidth: 380 }}
      >
        <span className="text-3xl">🥳</span>
        <div>
          <p className="font-black text-base leading-tight">{message}</p>
          <p className="text-emerald-100 text-xs mt-0.5">Sua voz faz a turma crescer!</p>
        </div>
      </div>
    </div>
  );
}
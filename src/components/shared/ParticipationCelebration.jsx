/**
 * ParticipationCelebration
 * ─────────────────────────
 * Shown after achievements across the platform. It remains visible so the
 * student can deliberately share the moment after the sound and confetti.
 */
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

export default function ParticipationCelebration({ message = 'Parabéns! Você participou! 🎉', onClose, session, achievement }) {
  const [shareState, setShareState] = useState('idle');
  useEffect(() => {
    playCheer();
    burst();
  }, []);

  const share = async () => {
    if (!session?.email || !session?.code || !achievement || shareState === 'sharing' || shareState === 'shared') return;
    setShareState('sharing');
    try {
      await base44.functions.invoke('manageOvercomingWall', { action: 'publish', actor_email: session.email, access_code: session.code, course: session.course || 'tcc', ...achievement });
      setShareState('shared');
    } catch (_) { setShareState('error'); }
  };

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
        <div className="min-w-0 flex-1">
          <p className="font-black text-base leading-tight">{message}</p>
          <p className="text-emerald-100 text-xs mt-0.5">Sua voz faz a turma crescer!</p>
          {achievement && <button type="button" onClick={share} disabled={shareState === 'sharing' || shareState === 'shared'} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/40 bg-white/20 px-3 py-2 text-xs font-bold transition hover:bg-white/30 disabled:opacity-80">
            {shareState === 'shared' ? <Check size={15}/> : <Share2 size={15}/>} {shareState === 'sharing' ? 'Publicando...' : shareState === 'shared' ? 'Publicado no mural!' : shareState === 'error' ? 'Tentar novamente' : 'Compartilhar no mural'}
          </button>}
        </div>
        <button type="button" onClick={onClose} className="self-start rounded-lg px-2 py-1 text-lg text-white/80 hover:bg-white/20" aria-label="Fechar comemoração">×</button>
      </div>
    </div>
  );
}

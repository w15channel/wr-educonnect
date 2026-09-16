import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Share2, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { trophyForModule } from '@/lib/moduleAchievements';

function celebrate() {
  confetti({ particleCount: 120, spread: 85, origin: { y: 0.62 }, startVelocity: 44 });
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  [523, 659, 784, 1047].forEach((frequency, index) => { const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); oscillator.connect(gain); gain.connect(ctx.destination); oscillator.type = 'square'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.16, ctx.currentTime + index * 0.11); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.11 + 0.28); oscillator.start(ctx.currentTime + index * 0.11); oscillator.stop(ctx.currentTime + index * 0.11 + 0.3); });
}

export default function ModuleCompletionCard({ moduleNumber, firstName, session, voice }) {
  const sourceId = `module-${moduleNumber}`;
  const [shared, setShared] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sharing, setSharing] = useState(false);
  const celebrated = useRef(false);
  const trophy = trophyForModule(moduleNumber);
  useEffect(() => { base44.entities.Achievement.filter({ dedupe_key: `shared:${String(session?.email || '').trim().toLowerCase()}:${sourceId}` }, '-created_date', 1).then((items) => { setShared(items.length > 0); setChecked(true); }); }, [session?.email, sourceId]);
  useEffect(() => { if (!checked || shared || celebrated.current) return; celebrated.current = true; celebrate(); voice.speak(`Parabéns, ${firstName}! Você concluiu o módulo ${moduleNumber}, entregou sua prova e conquistou um novo troféu. Sua dedicação merece ser celebrada!`, { force: true }); }, [checked, shared, firstName, moduleNumber, voice]);
  const share = async () => { setSharing(true); await base44.functions.invoke('manageOvercomingWall', { action: 'publish', actor_email: session?.email, access_code: session?.code, access_code_id: session?.codeId, course: session?.course || 'tcc', kind: 'module', title: `Troféu do Módulo ${moduleNumber}`, message: `concluiu o Módulo ${moduleNumber}, entregou a prova e conquistou um novo troféu.`, source_id: sourceId }); setShared(true); setSharing(false); };
  return <div className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-card to-violet-50 p-6 text-center shadow-lg dark:border-amber-500/30 dark:from-amber-950/30 dark:via-card dark:to-violet-950/30"><span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 ${trophy.surface}`}><Trophy size={42} className={trophy.color} /></span><h3 className="mt-4 text-xl font-black text-foreground">Módulo {moduleNumber} concluído!</h3><p className="mt-1 text-sm text-muted-foreground">Prova entregue. Este troféu agora faz parte da sua história.</p>{shared ? <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600"><Check size={16} /> Conquista compartilhada</p> : <button type="button" onClick={share} disabled={sharing} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Share2 size={16} /> {sharing ? 'Compartilhando...' : 'Compartilhar conquista'}</button>}</div>;
}
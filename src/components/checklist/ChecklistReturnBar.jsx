import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardCheck, ArrowLeft, CheckCircle2, X, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStepGuide } from '@/lib/checklistGuide';
import useLunaVoice from '@/hooks/useLunaVoice';

/**
 * Caminho de volta do checklist: quando o aluno sai do checklist para cumprir um
 * requisito, a página recebe ?checklist=<módulo>&checklistItem=<key> e esta
 * barra o traz de volta.
 *
 * FLUXO DA LUNA:
 * 1. Ao chegar na atividade, a Luna aparece com um balão explicando o passo a
 *    passo de onde clicar e como concluir a etapa (com narração por voz).
 * 2. A Luna pergunta: "Você já conseguiu concluir esta etapa?"
 *    - "Ainda não terminei" → o balão fecha e a barra inferior oferece
 *      "Concluir" + "Voltar ao Checklist" para quando o aluno terminar.
 *    - "Já concluí" → dispara a comemoração (confete + jingle) e a barra
 *      passa a oferecer o retorno ao checklist.
 * 3. Após a comemoração, a barra mostra "Etapa concluída! Voltar ao Checklist".
 */
function celebrate() {
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 }, startVelocity: 40 });
  setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, startVelocity: 30 }), 350);
  // Jingle de conclusão (mesmo padrão do ModuleCompletionCard)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.27);
  });
}

const CELEBRATION_DURATION = 3200;

export default function ChecklistReturnBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const moduleNumber = params.get('checklist');
  const itemKey = params.get('checklistItem');
  const voice = useLunaVoice();

  // Fases: guiding → ready (ou celebrating) → celebrating → celebrated
  const [phase, setPhase] = useState('guiding');
  const [bubbleOpen, setBubbleOpen] = useState(true);

  const guide = useMemo(() => (itemKey ? getStepGuide(itemKey) : null), [itemKey]);

  // Resetar o estado sempre que o aluno muda de página ou item
  useEffect(() => {
    setPhase('guiding');
    setBubbleOpen(true);
  }, [location.pathname, moduleNumber, itemKey]);

  // Narração por voz da orientação ao entrar na fase de guia
  useEffect(() => {
    if (phase !== 'guiding' || !guide || !itemKey) return;
    const stepsText = guide.steps?.length ? guide.steps.join('. ') : '';
    const script = `${guide.what}. ${
      stepsText ? `Vou te explicar o passo a passo. ${stepsText}.` : ''
    } Quando você terminar, toque em \"Já concluí\" aqui embaixo. Se ainda não fez, não tem problema — faça com calma e depois marque como concluído.`;
    voice.speak(script);
    return () => voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, itemKey]);

  const handleNotYet = useCallback(() => {
    voice.stop();
    setBubbleOpen(false);
    setPhase('ready');
  }, [voice]);

  const handleAlreadyDone = useCallback(() => {
    voice.stop();
    setBubbleOpen(false);
    setPhase('celebrating');
    celebrate();
    setTimeout(() => setPhase('celebrated'), CELEBRATION_DURATION);
  }, [voice]);

  const handleMarkComplete = useCallback(() => {
    voice.stop();
    setPhase('celebrating');
    celebrate();
    setTimeout(() => setPhase('celebrated'), CELEBRATION_DURATION);
  }, [voice]);

  const dismissBubble = useCallback(() => {
    voice.stop();
    setBubbleOpen(false);
    setPhase('ready');
  }, [voice]);

  if (!moduleNumber || location.pathname.endsWith('/checklist')) return null;

  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';
  const returnTo = `${prefix}/checklist?module=${moduleNumber}`;

  return (
    <>
      {/* ── Balão de orientação da Luna ─────────────────────────────────── */}
      <AnimatePresence>
        {bubbleOpen && phase === 'guiding' && guide && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-40 lg:bottom-24 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-md"
          >
            <div className="rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-card to-orange-50/70 p-4 shadow-lg dark:border-amber-400/25 dark:from-amber-950/30 dark:via-card dark:to-orange-950/20">
              {/* Cabeçalho */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-3xl" role="img" aria-label="Luna">🦉</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Luna · Módulo {moduleNumber}
                  </p>
                  <p className="mt-1 text-sm font-black leading-snug text-foreground">
                    {guide.emoji} {guide.what}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={voice.toggle}
                    className={`rounded-full p-1.5 transition-colors ${
                      voice.enabled ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-muted-foreground hover:bg-muted'
                    }`}
                    aria-label={voice.enabled ? 'Desligar voz' : 'Ligar voz'}
                  >
                    {voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={dismissBubble}
                    className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Fechar orientação"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Passo a passo */}
              {guide.steps?.length > 0 && (
                <ol className="mt-3 space-y-2 rounded-2xl border border-border bg-background/70 p-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] font-semibold leading-snug text-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Pergunta da Luna */}
              <p className="mt-3 text-sm font-bold text-amber-800 dark:text-amber-200">
                Você já conseguiu concluir esta etapa?
              </p>

              {/* Botões de resposta */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleNotYet}
                  className="flex-1 rounded-2xl border border-border bg-background px-3 py-3 text-xs font-bold text-foreground hover:opacity-90 transition-opacity"
                >
                  Ainda não terminei
                </button>
                <button
                  type="button"
                  onClick={handleAlreadyDone}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600 transition-colors"
                >
                  <CheckCircle2 size={14} />
                  Já concluí
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay de comemoração ──────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'celebrating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6"
          >
            {/* Fundo escurecido sutil */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Card de parabenização */}
            <motion.div
              initial={{ scale: 0.6, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative rounded-3xl border-2 border-green-300 bg-card px-8 py-6 text-center shadow-2xl dark:border-green-500/40"
            >
              <div className="text-5xl mb-2">{guide?.emoji || '✅'}</div>
              <p className="text-lg font-black text-foreground">Parabéns!</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {guide ? guide.what : 'Etapa concluída'}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Agora é só voltar ao checklist para continuar sua trilha.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra flutuante de retorno ─────────────────────────────────── */}
      {phase !== 'celebrating' && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-md">
          {phase === 'ready' && itemKey ? (
            /* Antes de marcar: botão de concluir + botão de retorno lado a lado */
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2"
            >
              <button
                type="button"
                onClick={handleMarkComplete}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-green-300 bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600 transition-colors whitespace-nowrap"
              >
                <CheckCircle2 size={14} />
                Concluir
              </button>
              <button
                type="button"
                onClick={() => navigate(returnTo)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
              >
                <ArrowLeft size={14} />
                <ClipboardCheck size={14} />
                Voltar ao Checklist
              </button>
            </motion.div>
          ) : (
            /* Durante orientação, após comemorar, ou sem itemKey: apenas retorno */
            <motion.button
              type="button"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(returnTo)}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold shadow-lg transition-opacity hover:opacity-90 ${
                phase === 'celebrated'
                  ? 'border-green-300 bg-green-500 text-white'
                  : 'border-primary/30 bg-primary text-primary-foreground'
              }`}
            >
              {phase === 'celebrated' ? <CheckCircle2 size={14} /> : <ArrowLeft size={14} />}
              <ClipboardCheck size={14} />
              {phase === 'celebrated'
                ? 'Etapa concluída! Voltar ao Checklist'
                : `Voltar ao Checklist do Módulo ${moduleNumber}`}
            </motion.button>
          )}
        </div>
      )}
    </>
  );
}
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  Circle,
  X,
  Volume2,
  VolumeX,
  Download,
  ChevronUp,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { getStepGuide } from '@/lib/checklistGuide';
import useLunaVoice from '@/hooks/useLunaVoice';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import useModuleChecklist from '@/hooks/useModuleChecklist';
import {
  resolveChecklistPrefix,
  saveActiveChecklistGuide,
  loadActiveChecklistGuide,
  clearActiveChecklistGuide,
  markChecklistItemDone,
  downloadCompletedChecklistPDF,
} from '@/lib/checklistActions';

const ACTIVITY_PATHS = [
  '/apostila',
  '/tasks',
  '/debates',
  '/ofensivas',
  '/lessons',
  '/exams',
  '/tuitions',
  '/terapeuta',
];

function celebrate() {
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 }, startVelocity: 40 });
  setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, startVelocity: 30 }), 350);
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

const CELEBRATION_DURATION = 2600;

export default function ChecklistReturnBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useCustomAuth();
  const voice = useLunaVoice();

  const params = new URLSearchParams(location.search);
  const urlModule = params.get('checklist');
  const urlItemKey = params.get('checklistItem');

  const [storedGuide, setStoredGuide] = useState(() => loadActiveChecklistGuide());
  const [phase, setPhase] = useState('guiding');
  const [bubbleOpen, setBubbleOpen] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const isChecklistPage = location.pathname.endsWith('/checklist');
  const isActivityPage = ACTIVITY_PATHS.some((p) => location.pathname.includes(p));

  // Sincroniza quando o aluno chega com ?checklist=<módulo>&checklistItem=<key>
  useEffect(() => {
    if (isChecklistPage) {
      clearActiveChecklistGuide();
      setStoredGuide(null);
      return;
    }
    if (urlModule) {
      const next = { moduleNumber: Number(urlModule), itemKey: urlItemKey || null };
      saveActiveChecklistGuide(next);
      setStoredGuide(next);
      setPhase('guiding');
      setBubbleOpen(true);
    } else {
      setStoredGuide(loadActiveChecklistGuide());
    }
  }, [location.pathname, urlModule, urlItemKey, isChecklistPage]);

  const moduleNumber = urlModule || (isActivityPage ? storedGuide?.moduleNumber : null);
  const itemKey = urlItemKey || (isActivityPage ? storedGuide?.itemKey : null);

  const isDiplomaMode = location.pathname.startsWith('/degree');
  const { modules } = useModuleChecklist({
    course: session?.course || 'tcc',
    session,
    includeOfensiva: !isDiplomaMode,
  });

  const currentMod = useMemo(
    () => modules.find((m) => m.moduleNumber === Number(moduleNumber)) || null,
    [modules, moduleNumber]
  );
  const items = currentMod?.items || [];
  const activeItem = useMemo(
    () => items.find((i) => i.key === itemKey) || items.find((i) => !i.done) || items[0] || null,
    [items, itemKey]
  );
  const effectiveKey = activeItem?.key || itemKey;
  const guide = useMemo(() => (effectiveKey ? getStepGuide(effectiveKey) : null), [effectiveKey]);

  // Narração por voz da orientação ao entrar na fase de guia
  useEffect(() => {
    if (!moduleNumber || isChecklistPage || phase !== 'guiding' || !guide || !effectiveKey) return;
    const stepsText = guide.steps?.length ? guide.steps.join('. ') : '';
    const script = `${guide.what}. ${
      stepsText ? `Vou te explicar o passo a passo. ${stepsText}.` : ''
    } Quando você terminar, toque em "Concluir etapa" aqui no menu flutuante.`;
    voice.speak(script);
    return () => voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, effectiveKey, moduleNumber, isChecklistPage]);

  const handleSaveDone = useCallback(
    async (targetKey) => {
      const keyToMark = targetKey || effectiveKey;
      if (!moduleNumber || !keyToMark || savingKey) return;
      voice.stop();
      setSavingKey(keyToMark);
      try {
        await markChecklistItemDone({
          session,
          moduleNumber: Number(moduleNumber),
          itemKey: keyToMark,
          queryClient,
        });
        toast.success('Opção marcada como concluída no checklist!');
        setBubbleOpen(false);
        setPhase('celebrating');
        celebrate();
        setTimeout(() => setPhase('celebrated'), CELEBRATION_DURATION);
      } catch (err) {
        toast.error(err?.message || 'Não foi possível salvar a conclusão.');
      } finally {
        setSavingKey(null);
      }
    },
    [moduleNumber, effectiveKey, savingKey, voice, session, queryClient]
  );

  const handleDownloadCompleted = useCallback(async () => {
    if (!currentMod || downloading) return;
    const doneItems = (currentMod.items || []).filter((i) => i.done);
    if (doneItems.length === 0) {
      toast.info('Marque ao menos uma opção como concluída para baixar.');
      return;
    }
    setDownloading(true);
    try {
      await downloadCompletedChecklistPDF({
        session,
        moduleNumber: currentMod.moduleNumber,
        items: currentMod.items,
        modules: [currentMod],
      });
      toast.success('Opções concluídas baixadas em PDF!');
    } catch (err) {
      toast.error(err?.message || 'Não foi possível baixar o arquivo.');
    } finally {
      setDownloading(false);
    }
  }, [currentMod, downloading, session]);

  const handleNotYet = useCallback(() => {
    voice.stop();
    setBubbleOpen(false);
    setPhase('ready');
  }, [voice]);

  const handleCloseCompanion = useCallback(() => {
    voice.stop();
    clearActiveChecklistGuide();
    setStoredGuide(null);
  }, [voice]);

  if (!moduleNumber || isChecklistPage) return null;

  const prefix = resolveChecklistPrefix(location.pathname);
  const returnTo = `${prefix}/checklist?module=${moduleNumber}`;
  const doneCount = currentMod?.doneCount || 0;
  const totalCount = items.length || 0;
  const isCurrentDone = !!activeItem?.done || phase === 'celebrated';

  const goToActivityItem = (item) => {
    voice.stop();
    saveActiveChecklistGuide({ moduleNumber: Number(moduleNumber), itemKey: item.key });
    setStoredGuide({ moduleNumber: Number(moduleNumber), itemKey: item.key });
    setMenuExpanded(false);
    const sep = item.to.includes('?') ? '&' : '?';
    navigate(`${prefix}${item.to}${sep}checklist=${moduleNumber}&checklistItem=${item.key}`);
  };

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
            className="fixed bottom-36 lg:bottom-24 left-0 right-0 z-40 mx-auto w-full max-w-md px-3"
          >
            <div className="rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-card to-orange-50/70 p-4 shadow-xl dark:border-amber-400/25 dark:from-amber-950/30 dark:via-card dark:to-orange-950/20">
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-3xl" role="img" aria-label="Luna">🦉</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Luna · Checklist Módulo {moduleNumber} ({doneCount}/{totalCount})
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
                    onClick={handleNotYet}
                    className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Minimizar orientação"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

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

              <p className="mt-3 text-sm font-bold text-amber-800 dark:text-amber-200">
                Você já conseguiu concluir esta etapa?
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleNotYet}
                  className="flex-1 rounded-2xl border border-border bg-background px-3 py-3 text-xs font-bold text-foreground hover:opacity-90 transition-opacity"
                >
                  Fazer agora
                </button>
                <button
                  type="button"
                  disabled={!!savingKey}
                  onClick={() => handleSaveDone(effectiveKey)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 size={14} />
                  {savingKey === effectiveKey ? 'Salvando...' : isCurrentDone ? 'Já concluída' : 'Marcar concluído'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Painel expansível do Checklist Flutuante na atividade ───────── */}
      <AnimatePresence>
        {menuExpanded && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 lg:bottom-24 left-0 right-0 z-40 mx-auto w-full max-w-md px-3"
          >
            <div className="rounded-3xl border border-border bg-card p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardCheck size={17} className="text-primary shrink-0" />
                  <p className="text-xs font-black text-foreground truncate">
                    Checklist · Módulo {moduleNumber} ({doneCount}/{totalCount} concluídas)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuExpanded(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Fechar lista do checklist"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {items.map((item) => {
                  const isSavingThis = savingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 rounded-2xl border p-2.5 text-xs ${
                        item.done
                          ? 'border-green-300/70 bg-green-50/70 dark:border-green-600/30 dark:bg-green-950/25'
                          : item.key === effectiveKey
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border bg-background/60'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={item.done || isSavingThis}
                        onClick={() => handleSaveDone(item.key)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left disabled:cursor-default"
                        title={item.done ? 'Opção concluída' : 'Selecionar como concluído'}
                      >
                        {item.done ? (
                          <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                        ) : (
                          <Circle size={16} className="shrink-0 text-muted-foreground hover:text-green-600" />
                        )}
                        <span className={`truncate font-semibold ${item.done ? 'text-green-800 dark:text-green-300 line-through' : 'text-foreground'}`}>
                          {item.label}
                        </span>
                      </button>

                      {!item.done ? (
                        <button
                          type="button"
                          disabled={isSavingThis}
                          onClick={() => handleSaveDone(item.key)}
                          className="shrink-0 rounded-xl bg-green-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-green-600 disabled:opacity-60"
                        >
                          {isSavingThis ? '...' : 'Concluir'}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-xl bg-green-500/15 px-2 py-0.5 text-[10px] font-black text-green-700 dark:text-green-300">
                          Concluído
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => goToActivityItem(item)}
                        className="shrink-0 rounded-xl border border-border bg-secondary px-2 py-1 text-[11px] font-bold text-foreground hover:bg-secondary/80"
                        title="Ir para esta atividade"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadCompleted}
                  disabled={downloading || doneCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200"
                >
                  <Download size={14} />
                  {downloading ? 'Baixando...' : `Baixar concluídas (${doneCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(returnTo)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  <ArrowLeft size={14} />
                  Abrir Checklist
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
            <div className="absolute inset-0 bg-black/20" />
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
                Opção marcada como concluída no seu checklist!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra flutuante de acompanhamento ──────────────────────────── */}
      {phase !== 'celebrating' && (
        <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-40 mx-auto w-full max-w-md px-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur p-1.5 shadow-xl"
          >
            {effectiveKey && (
              <button
                type="button"
                disabled={isCurrentDone || !!savingKey}
                onClick={() => handleSaveDone(effectiveKey)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${
                  isCurrentDone
                    ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                    : 'bg-green-500 text-white shadow hover:bg-green-600'
                }`}
              >
                <CheckCircle2 size={14} />
                {savingKey === effectiveKey ? 'Salvando...' : isCurrentDone ? 'Concluído' : 'Concluir'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setBubbleOpen(false);
                setMenuExpanded((prev) => !prev);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-2.5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80"
            >
              <ClipboardCheck size={14} className="text-primary shrink-0" />
              <span className="truncate">Checklist ({doneCount}/{totalCount})</span>
              {menuExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>

            {doneCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadCompleted}
                disabled={downloading}
                title="Baixar opções concluídas"
                className="flex items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 p-2.5 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200"
              >
                <Download size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(returnTo)}
              title="Voltar ao Checklist"
              className="flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <button
              type="button"
              onClick={handleCloseCompanion}
              title="Fechar menu flutuante"
              aria-label="Fechar menu flutuante"
              className="flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStepGuide } from '@/lib/checklistGuide';

/**
 * Caminho de volta do checklist: quando o aluno sai do checklist para cumprir um
 * requisito, a página recebe ?checklist=<módulo>&checklistItem=<key> e esta
 * barra o traz de volta.
 *
 * Além do retorno, oferece o botão "Marcar como concluído" para o aluno
 * registrar manualmente que cumpriu a etapa nesta visita. Ao marcar, uma
 * comemoração com confete parabeniza o aluno e, em seguida, a barra volta a
 * oferecer o caminho de retorno ao checklist.
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

  const [celebrating, setCelebrating] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  // Resetar o estado da comemoração sempre que o aluno muda de página ou item
  useEffect(() => {
    setCelebrating(false);
    setCelebrated(false);
  }, [location.pathname, moduleNumber, itemKey]);

  const handleMarkComplete = useCallback(() => {
    setCelebrating(true);
    celebrate();
    setTimeout(() => {
      setCelebrating(false);
      setCelebrated(true);
    }, CELEBRATION_DURATION);
  }, []);

  if (!moduleNumber || location.pathname.endsWith('/checklist')) return null;

  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';
  const guide = itemKey ? getStepGuide(itemKey) : null;
  const returnTo = `${prefix}/checklist?module=${moduleNumber}`;

  return (
    <>
      {/* Overlay de comemoração */}
      <AnimatePresence>
        {celebrating && (
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
n              initial={{ scale: 0.6, y: 30 }}
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

      {/* Barra flutuante de retorno */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-md">
        {itemKey && !celebrated ? (
          /* Antes de marcar: botão de concluir + botão de retorno lado a lado */
          <motion.div
n            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2"
          >
            <button
n              type="button"
              onClick={handleMarkComplete}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-green-300 bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 size={14} />
              Concluir
            </button>
            <button
n              type="button"
              onClick={() => navigate(returnTo)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={14} />
              <ClipboardCheck size={14} />
              Voltar ao Checklist
            </button>
          </motion.div>
        ) : (
          /* Após comemorar (ou sem itemKey): apenas o botão de retorno */
          <motion.button
n            type="button"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate(returnTo)}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold shadow-lg transition-opacity hover:opacity-90 ${
              celebrated
                ? 'border-green-300 bg-green-500 text-white'
                : 'border-primary/30 bg-primary text-primary-foreground'
            }`}
          >
            {celebrated ? <CheckCircle2 size={14} /> : <ArrowLeft size={14} />}
            <ClipboardCheck size={14} />
            {celebrated
              ? 'Etapa concluída! Voltar ao Checklist'
              : `Voltar ao Checklist do Módulo ${moduleNumber}`}
          </motion.button>
        )}
      </div>
    </>
  );
}
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, RotateCcw, Rocket } from 'lucide-react';
import useOwlVoice from '@/hooks/useOwlVoice';
import LunaTutorialStep from '@/components/onboarding/LunaTutorialStep';
import { LUNA_TUTORIAL_STEPS, LUNA_NAME } from '@/lib/lunaTutorial';

/**
 * Tutorial guiado pela Luna, a assistente do site: uma etapa por vez, com a
 * explicação lida em voz alta para quem tem pouca familiaridade com celular.
 */
export default function TutorialModal({ onFinish, studentName }) {
  const voice = useOwlVoice();
  const [index, setIndex] = useState(0);
  const step = LUNA_TUTORIAL_STEPS[index];
  const isLast = index === LUNA_TUTORIAL_STEPS.length - 1;
  const firstName = String(studentName || '').split(' ')[0];

  const script = useMemo(
    () => (index === 0 && firstName ? `Olá ${firstName}! ${step.speech}` : step.speech),
    [index, step, firstName]
  );

  useEffect(() => {
    voice.speak(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const go = (next) => { voice.stop(); setIndex(next); };
  const finish = () => { voice.stop(); onFinish(); };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-amber-300/70 bg-background shadow-2xl">
        <div className="flex items-start gap-3 border-b border-border p-4">
          <div className="ofensiva-owl shrink-0 text-4xl" role="img" aria-label={`${LUNA_NAME}, assistente do site`}>🦉</div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
              {LUNA_NAME} · Tutorial · {index + 1} de {LUNA_TUTORIAL_STEPS.length}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-muted-foreground">
              Sou a {LUNA_NAME}, sua assistente. Ligue a voz e eu explico cada parte do site.
            </p>
          </div>
          <button onClick={finish} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Pular tutorial">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {LUNA_TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? 'bg-amber-500' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <LunaTutorialStep step={step} />
        </div>

        <div className="space-y-2.5 border-t border-border p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={voice.toggle}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-2 text-[11.5px] font-bold ${
                voice.enabled
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {voice.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {voice.enabled ? 'Voz ligada' : 'Ligar voz'}
            </button>
            <button
              type="button"
              onClick={() => voice.speak(script, { force: true })}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-2 text-[11.5px] font-bold text-foreground"
            >
              <RotateCcw size={14} /> Ouvir de novo
            </button>
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="flex min-h-[3rem] items-center justify-center gap-1 rounded-2xl border border-border bg-background px-3 text-[12px] font-bold text-foreground"
              >
                <ChevronLeft size={15} /> Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : go(index + 1))}
              className="flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[13px] font-black text-primary-foreground"
            >
              {isLast ? <><Rocket size={15} /> Concluir e começar</> : <>Próximo <ChevronRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
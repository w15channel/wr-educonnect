import React from 'react';
import { ArrowRight, Volume2, VolumeX, RotateCcw, SkipForward, CheckCircle2, Loader2 } from 'lucide-react';
import { getStepGuide } from '@/lib/checklistGuide';

/**
 * Painel da Corujinha: explica em letras grandes o que fazer NESTA etapa,
 * lê em voz alta e pergunta ao aluno se ele deseja ser levado até lá.
 */
export default function OwlStepGuide({
  item,
  index,
  total,
  firstName,
  moduleNumber,
  complete,
  voice,
  onGo,
  onSkip,
  onRepeat,
}) {
  const guide = item ? getStepGuide(item.key) : null;
  const falta = item ? Math.max(0, (item.target || 0) - (item.current || 0)) : 0;

  return (
    <div className="rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-card to-orange-50/70 p-4 shadow-lg dark:border-amber-400/25 dark:from-amber-950/30 dark:via-card dark:to-orange-950/20">
      <div className="flex items-start gap-3">
        <div className="ofensiva-owl shrink-0 text-4xl" role="img" aria-label="Luna, assistente do site">🦉</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Luna · Módulo {moduleNumber}
          </p>
          {complete ? (
            <p className="mt-1 text-base font-black leading-snug text-foreground">
              Parabéns, {firstName}! Você concluiu todas as etapas. Sua prova está liberada 🎉
            </p>
          ) : (
            <>
              <p className="mt-1 text-base font-black leading-snug text-foreground">
                Etapa {index + 1} de {total}: {guide?.emoji} {guide?.what}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
                {falta > 0 ? `Ainda falta ${falta} de ${item.target}.` : 'Esta etapa já está pronta!'}
              </p>
            </>
          )}
        </div>
      </div>

      {!complete && guide?.steps?.length > 0 && (
        <ol className="mt-3 space-y-2 rounded-2xl border border-border bg-background/70 p-3">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] font-semibold leading-snug text-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                {i + 1}
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3.5 grid gap-2">
        {!complete && (
          <button
            type="button"
            onClick={onGo}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow hover:opacity-90"
          >
            Sim, me leve até lá <ArrowRight size={16} />
          </button>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={voice.toggle}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-2 text-[11.5px] font-bold ${
              voice.enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {voice.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {voice.enabled ? 'Voz ligada' : 'Ligar voz'}
          </button>
          <button
            type="button"
            onClick={onRepeat}
            disabled={voice.loading}
            aria-busy={voice.loading}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-2 text-[11.5px] font-bold text-foreground"
          >
            {voice.loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} {voice.loading ? 'Gerando voz...' : 'Ouvir'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-2 text-[11.5px] font-bold text-foreground"
          >
            {complete ? <CheckCircle2 size={14} /> : <SkipForward size={14} />} {complete ? 'Reler' : 'Próxima'}
          </button>
        </div>
      </div>

      {!voice.supported && (
        <p className="mt-2 text-[11px] text-muted-foreground">Este aparelho não tem voz do navegador — siga os passos escritos acima.</p>
      )}
    </div>
  );
}
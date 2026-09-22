import React, { forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff } from 'lucide-react';
import useVoiceDictation from '@/hooks/useVoiceDictation';

/**
 * Mini microfone para escrever falando: o texto ditado é acrescentado ao
 * conteúdo atual do campo e o aluno envia normalmente.
 */
const VoiceDictationButton = forwardRef(function VoiceDictationButton({ value = '', onChange, className = '' }, ref) {
  const { supported, listening, stop, toggle } = useVoiceDictation({
    onResult: (text) => {
      const base = String(value || '');
      onChange(base ? `${base.replace(/\s+$/, '')} ${text}` : text);
    },
  });

  useImperativeHandle(ref, () => ({ stop }), [stop]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Desligar microfone' : 'Escrever falando'}
      aria-label={listening ? 'Parar de ditar' : 'Escrever falando'}
      aria-pressed={listening}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 ${
        listening
          ? 'border-red-400 bg-red-500 text-white animate-pulse'
          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      {listening ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  );
});

export default VoiceDictationButton;

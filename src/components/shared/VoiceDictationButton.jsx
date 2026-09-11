import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import useVoiceDictation from '@/hooks/useVoiceDictation';

/**
 * Mini microfone para escrever falando: o texto ditado é acrescentado ao
 * conteúdo atual do campo e o aluno envia normalmente.
 */
export default function VoiceDictationButton({ value = '', onChange, className = '' }) {
  const { supported, listening, toggle } = useVoiceDictation({
    onResult: (text) => {
      const base = String(value || '');
      onChange(base ? `${base.replace(/\s+$/, '')} ${text}` : text);
    },
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Parar de ditar' : 'Escrever falando'}
      aria-label={listening ? 'Parar de ditar' : 'Escrever falando'}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 ${
        listening
          ? 'border-red-400 bg-red-500 text-white animate-pulse'
          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      {listening ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  );
}
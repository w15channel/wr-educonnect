import React from 'react';
import { MIN_TEXT_LENGTH, textLength, isTextLongEnough } from '@/lib/minTextLength';

/** Contador de caracteres com o mínimo exigido pela plataforma. */
export default function MinLengthHint({ value = '', className = '' }) {
  const length = textLength(value);
  const ok = isTextLongEnough(value);
  return (
    <p className={`text-[10px] font-semibold mt-1 ${ok ? 'text-green-600' : 'text-amber-600'} ${className}`}>
      {length}/{MIN_TEXT_LENGTH} caracteres
      {!ok && ` · faltam ${MIN_TEXT_LENGTH - length} para liberar o envio`}
    </p>
  );
}
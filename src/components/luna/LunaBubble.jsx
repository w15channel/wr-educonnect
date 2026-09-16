import React from 'react';

/** Balão de conversa da Luna (esquerda) ou do aluno (direita). */
export default function LunaBubble({ role, children }) {
  const isUser = role === 'user';
  const bubbleClass = `min-w-0 max-w-[80%] overflow-hidden whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${isUser ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border border-amber-300/60 bg-card text-foreground'}`;
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="ofensiva-owl shrink-0 text-xl" role="img" aria-label="Luna">🦉</div>
      )}
      <div className={bubbleClass} style={{ overflowWrap: 'anywhere' }}>
        {children}
      </div>
    </div>
  );
}